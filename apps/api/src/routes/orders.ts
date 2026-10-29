import { Router, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { orderRateLimiter } from "../middleware/rateLimit.js";
import { orderStore } from "../store/orderStore.js";
import { createOrderSchema, createRazorpayOrderSchema } from "../schemas/order.js";
import { generateOrderNumber, shouldGenerateServerOrderNumber } from "../utils/orderNumber.js";
import { verifyAdminAuth } from "../middleware/auth.js";
import { razorpayService } from "../services/razorpay.js";
import { logger } from "../lib/logger.js";
import { productStore } from "../store/productStore.js";
import {
  calculateShipping,
  getShippingRates,
  getDeliveryEstimation,
} from "../services/shipping.js";
import {
  verifyCloudIamToken,
  signGuestOrderToken,
  verifyGuestOrderToken,
} from "../services/cloudIam.js";
import { verifyAdminSession } from "../services/adminSession.js";
import { trackServerEvent } from "../services/posthog.js";
import { userStore } from "../store/userStore.js";
import { db, isDatabaseConfigured } from "../db/index.js";
import { calculatePricing, type PricedLineInput } from "../services/pricing.js";
import {
  CouponError,
  normalizeCouponCode,
  resolveCoupon,
} from "../services/coupon.js";
import {
  ReservationUnavailableError,
  confirmReservations,
  expireReservations,
  reserveInventory,
} from "../services/inventory.js";
import {
  PaymentError,
  createPaymentAttempt,
  findAttemptByGatewayOrderId,
} from "../services/payments.js";
import type { CalculatedOrder, CreateOrder, Order } from "../schemas/order.js";

export const orderRouter = Router();

async function getOptionalCustomerClaims(
  req: Request,
): Promise<{ email: string } | null | false> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return false;
  const claims = await verifyCloudIamToken(authHeader.slice(7).trim());
  if (!claims?.email) return false;
  return { email: claims.email.trim().toLowerCase() };
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

// Public: Get Razorpay configuration
orderRouter.get(
  "/api/orders/razorpay/config",
  (_req: Request, res: Response) => {
    const keyId = razorpayService.getKeyId();
    res.json({
      enabled: Boolean(keyId),
      keyId: keyId || "",
    });
  },
);

const orderItemInputSchema = z.object({
  id: z.string().uuid(),
  variantId: z.number().int().positive().nullable().optional(),
  designId: z.number().int().positive().nullable().optional(),
  size: z.string().min(1),
  quantity: z.number().int().positive().max(50),
});

async function calculateCheckout(
  itemsRequest: Array<{
    id: string;
    variantId?: number | null;
    designId?: number | null;
    size: string;
    quantity: number;
  }>,
  state: string,
  pincode?: string,
  couponCode?: string,
  options: { skipStockCheck?: boolean; customerId?: number | null } = {},
): Promise<
  Pick<
    CalculatedOrder,
    "items" | "subtotal" | "discountTotal" | "shipping" | "total"
  > & {
    weightGrams: number;
    deliveryEstimation: ReturnType<typeof getDeliveryEstimation>;
  }
> {
  const pricedInputs: PricedLineInput[] = [];
  const freeSizeRequested = new Map<
    string,
    { quantity: number; available: number; name: string }
  >();

  for (const requested of itemsRequest) {
    const product = await productStore.getById(requested.id);
    if (!product)
      throw new Error(`Product ${requested.id} is no longer available.`);
    const productStatus = (
      product.adminData as Record<string, unknown> | undefined
    )?.status;
    if (productStatus && productStatus !== "Active")
      throw new Error(`${product.name} is not available for purchase.`);
    let variant = requested.variantId
      ? product.variants?.find((candidate) => candidate.id === requested.variantId)
      : undefined;
    if (!variant) {
      variant = product.variants?.find(
        (candidate) => String(candidate.size).toLowerCase() === requested.size.toLowerCase()
      );
    }
    if (!variant && product.isFreeSize && product.variants && product.variants.length > 0) {
      variant = product.variants[0];
    }
    if (!variant || variant.status !== "Active") {
      throw new Error(
        `Size ${requested.size} for ${product.name} is no longer available.`,
      );
    }

    const trackInventory = product.trackInventory ?? true;
    const continueSelling = product.continueSelling ?? false;

    if (
      trackInventory &&
      !continueSelling &&
      !options.skipStockCheck &&
      variant.stock - variant.reserved < requested.quantity
    ) {
      throw new Error(
        `${product.name} (${requested.size}) does not have enough stock.`,
      );
    }
    if (product.isFreeSize && trackInventory && !continueSelling) {
      const current = freeSizeRequested.get(product.id);
      freeSizeRequested.set(product.id, {
        quantity: (current?.quantity ?? 0) + requested.quantity,
        available: variant.stock - variant.reserved,
        name: product.name,
      });
    }

    const design =
      variant.designId && product.designs
        ? product.designs.find((d) => d.id === variant.designId)
        : undefined;
    const variantPrice =
      typeof variant.price === "number" && variant.price > 0
        ? variant.price
        : undefined;
    const designPrice =
      design?.priceOverride != null && design.priceOverride > 0
        ? design.priceOverride
        : undefined;
    const unitPrice = variantPrice ?? designPrice ?? product.priceNum;

    const designImage = design?.images?.[0];
    const lineImg = designImage || product.img;
    const designName = design?.name;
    const variantLabel = [designName ?? variant.color, variant.size].filter(Boolean).join(" / ");

    pricedInputs.push({
      productId: product.id,
      variantId: variant.id!,
      name: product.name,
      size: String(variant.size),
      color: variant.color,
      sku: variant.sku,
      quantity: requested.quantity,
      unitPrice,
      weightGrams: variant.weight ?? product.weightGrams ?? 350,
      img: lineImg,
      categoryId: product.categoryId,
      isFreeSize: Boolean(product.isFreeSize),
      variantLabel,
      designId: variant.designId ?? undefined,
      designName,
    });
  }

  if (!options.skipStockCheck) {
    for (const shared of freeSizeRequested.values()) {
      if (shared.quantity > shared.available)
        throw new Error(`${shared.name} does not have enough shared stock.`);
    }
  }

  const weightGrams = pricedInputs.reduce(
    (sum, line) => sum + line.weightGrams * line.quantity,
    0,
  );
  const rates = await getShippingRates();
  const shipping = calculateShipping(weightGrams, state, rates, pincode);
  const deliveryEstimation = getDeliveryEstimation(state, rates, pincode);

  let discount = 0;
  if (couponCode) {
    if (!isDatabaseConfigured() || !db)
      throw new CouponError("Discount codes are temporarily unavailable.", 503);
    const resolved = await resolveCoupon(db, {
      code: normalizeCouponCode(couponCode),
      customerId: options.customerId ?? null,
      items: pricedInputs.map((line) => ({
        productId: line.productId,
        categoryId: line.categoryId,
        lineTotal: line.unitPrice * line.quantity,
      })),
      subtotal: pricedInputs.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      ),
      forUpdate: false,
    });
    discount = resolved.discount;
  }

  const pricing = calculatePricing(pricedInputs, { discount, shipping });
  const items: CalculatedOrder["items"] = pricing.lines.map((line) => ({
    id: line.productId,
    variantId: line.variantId,
    designId: line.designId,
    designName: line.designName,
    name: line.name,
    size: line.size,
    price: line.price,
    priceNum: line.unitPrice,
    sku: line.sku,
    quantity: line.quantity,
    weightGrams: line.weightGrams,
    img: line.img,
    lineTotal: line.lineTotal,
    discountAmount: line.discountAmount,
    variantLabel: line.variantLabel,
    categoryId: line.categoryId,
    isFreeSize: Boolean(line.isFreeSize),
  }));

  return {
    items,
    subtotal: pricing.subtotal,
    discountTotal: pricing.discountTotal,
    shipping: pricing.shipping,
    total: pricing.total,
    weightGrams: pricing.weightGrams,
    deliveryEstimation,
  };
}

async function calculateOrder(
  input: CreateOrder,
  options: { skipStockCheck?: boolean; couponCode?: string } = {},
): Promise<CalculatedOrder> {
  const calculated = await calculateCheckout(
    input.items,
    input.state,
    (input as { pincode?: string }).pincode,
    options.couponCode ?? input.couponCode,
    { skipStockCheck: options.skipStockCheck },
  );
  return {
    ...input,
    ...calculated,
    orderNumber: input.orderNumber || generateOrderNumber(),
    couponCode: input.couponCode
      ? normalizeCouponCode(input.couponCode)
      : undefined,
  };
}

const quoteSchema = z
  .object({
    state: z.string().trim().max(100).optional().default(""),
    pincode: z.string().trim().max(10).optional().default(""),
    items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty"),
    couponCode: z.string().trim().min(1).max(60).optional(),
  })
  .refine(
    (data) =>
      data.state.length > 0 || data.pincode.replace(/\D/g, "").length === 6,
    {
      message: "A delivery state or 6-digit PIN code is required.",
    },
  );

orderRouter.post("/api/orders/quote", async (req: Request, res: Response) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error:
        parsed.error.issues[0]?.message ||
        "A delivery state or 6-digit PIN code and valid cart items are required.",
    });
    return;
  }
  try {
    const quote = await calculateCheckout(
      parsed.data.items,
      parsed.data.state,
      parsed.data.pincode,
      parsed.data.couponCode,
    );
    res.json({
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      shipping: quote.shipping,
      total: quote.total,
      weightGrams: quote.weightGrams,
      deliveryEstimation: quote.deliveryEstimation,
    });
  } catch (err) {
    res.status(err instanceof CouponError ? err.statusCode : 400).json({
      error: err instanceof Error ? err.message : "Unable to quote this cart.",
    });
  }
});

// Public: Validate a coupon against the server-calculated cart. The discount is
// recalculated again, under a row lock, when the order is created.
const couponQuoteSchema = z.object({
  code: z.string().trim().min(1).max(60),
  state: z.string().trim().max(100).optional().default(""),
  pincode: z.string().trim().max(10).optional().default(""),
  items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty"),
});

orderRouter.post(
  "/api/orders/coupon/validate",
  async (req: Request, res: Response) => {
    const parsed = couponQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error:
            parsed.error.issues[0]?.message ||
            "Enter a valid discount code and cart.",
        });
      return;
    }
    try {
      const quote = await calculateCheckout(
        parsed.data.items,
        parsed.data.state,
        parsed.data.pincode,
        parsed.data.code,
      );
      res.json({
        code: normalizeCouponCode(parsed.data.code),
        discountTotal: quote.discountTotal,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        total: quote.total,
      });
    } catch (err) {
      res.status(err instanceof CouponError ? err.statusCode : 400).json({
        error:
          err instanceof Error
            ? err.message
            : "This discount code is not valid.",
      });
    }
  },
);

orderRouter.post(
  "/api/orders/razorpay/create-order",
  orderRateLimiter,
  async (req: Request, res: Response) => {
    const parsed = createRazorpayOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid Razorpay order request",
        details: z.treeifyError(parsed.error),
      });
      return;
    }

    try {
      const {
        currency,
        orderNumber: clientOrderNumber,
        customerName,
        customerEmail,
        customerPhone,
        state,
        pincode,
        items,
        couponCode,
      } = parsed.data;

      let orderNumber: string;
      if (shouldGenerateServerOrderNumber(clientOrderNumber)) {
        orderNumber = generateOrderNumber();
        let retries = 0;
        while (await orderStore.getByOrderNumber(orderNumber)) {
          orderNumber = generateOrderNumber();
          retries++;
          if (retries > 5) break;
        }
      } else {
        orderNumber = clientOrderNumber!;
      }

      const quote = await calculateCheckout(items, state, pincode, couponCode);
      const amountInPaise = Math.round(quote.total * 100);

      const rzpOrder = await razorpayService.createOrder({
        amount: amountInPaise,
        currency,
        receipt: orderNumber,
        notes: {
          orderNumber,
          shipping: String(quote.shipping),
          discountTotal: String(quote.discountTotal),
          weightGrams: String(quote.weightGrams),
          customerName: customerName || "",
          customerEmail: customerEmail || "",
          customerPhone: customerPhone || "",
        },
      });

      if (isDatabaseConfigured() && db) {
        try {
          await db.transaction(async (tx) => {
            const executor =
              tx as unknown as import("../db/types.js").DbExecutor;
            await expireReservations(executor, 50);
            await reserveInventory(executor, {
              gatewayOrderId: rzpOrder.id,
              reservationKeyPrefix: `razorpay:${rzpOrder.id}`,
              items: quote.items.map((item) => ({
                productId: item.id,
                variantId: item.variantId,
                quantity: item.quantity,
                isFreeSize: Boolean(item.isFreeSize),
                sku: item.sku,
              })),
              ttlSeconds: 20 * 60,
              reason: "Razorpay checkout inventory held",
            });
          });
        } catch (error) {
          if (error instanceof ReservationUnavailableError) {
            res.status(409).json({
              error:
                "Stock changed while starting checkout. Please review your cart and try again.",
            });
            return;
          }
          throw error;
        }

        try {
          await createPaymentAttempt({
            orderNumber,
            amount: quote.total,
            currency,
            gatewayOrderId: rzpOrder.id,
          });
        } catch (error) {
          // The verification route can create the attempt if this write fails;
          // the reservation still protects stock until it expires.
          logger.error(
            { err: error, razorpayOrderId: rzpOrder.id },
            "Failed to record Razorpay payment attempt",
          );
        }
      }

      res.status(201).json({
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: razorpayService.getKeyId(),
        orderNumber,
        subtotal: quote.subtotal,
        discountTotal: quote.discountTotal,
        shipping: quote.shipping,
        total: quote.total,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to create Razorpay order");
      res.status(err instanceof CouponError ? err.statusCode : 500).json({
        error:
          err instanceof Error
            ? err.message
            : "Failed to initiate Razorpay transaction",
      });
    }
  },
);

// Public: Verify Razorpay payment and commit order
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  order: createOrderSchema,
});

orderRouter.post(
  "/api/orders/razorpay/verify",
  async (req: Request, res: Response) => {
    const parsed = verifyPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payment verification payload",
        details: z.treeifyError(parsed.error),
      });
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order,
    } = parsed.data;

    const customer = await getOptionalCustomerClaims(req);
    // Payment verification must not depend on a customer session. The payment may
    // complete after the account token expires while Razorpay is open. Keep the
    // verified payment and save it as a guest order in that case.
    const accountCustomer =
      customer && customer.email === order.customerEmail.trim().toLowerCase()
        ? customer
        : null;

    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      logger.warn(
        { razorpay_order_id, razorpay_payment_id },
        "Payment signature verification failed",
      );
      trackServerEvent(
        order?.customerEmail || order?.orderNumber || razorpay_order_id,
        "payment_failed",
        {
          order_number: order?.orderNumber,
          payment_id: razorpay_payment_id,
          gateway: "razorpay",
          error_code: "INVALID_SIGNATURE",
          error_description: "Payment signature verification failed.",
          step: "signature_verification",
        },
      );
      res
        .status(400)
        .json({ error: "Invalid payment signature. Verification failed." });
      return;
    }

    // Razorpay verification can be retried by the client after a network drop or
    // a page reload. The payment may already be committed, and recalculating the
    // cart would fail on the stock this order already consumed. Return the
    // committed order instead of charging ahead with a duplicate.
    try {
      const existingPaidOrder =
        await orderStore.getByRazorpayPaymentId(razorpay_payment_id);
      if (existingPaidOrder) {
        if (
          existingPaidOrder.razorpayOrderId &&
          existingPaidOrder.razorpayOrderId !== razorpay_order_id
        ) {
          logger.warn(
            {
              razorpay_order_id,
              razorpay_payment_id,
              orderNumber: existingPaidOrder.orderNumber,
            },
            "Payment is already linked to a different Razorpay order",
          );
          res
            .status(409)
            .json({
              error: "This payment is already linked to another order.",
            });
          return;
        }
        logger.info(
          {
            orderNumber: existingPaidOrder.orderNumber,
            paymentId: razorpay_payment_id,
          },
          "Razorpay payment already committed; returning existing order",
        );
        res.status(200).json({
          success: true,
          order: existingPaidOrder,
          guestToken: signGuestOrderToken(
            existingPaidOrder.orderNumber,
            existingPaidOrder.customerEmail,
          ),
          paymentId: razorpay_payment_id,
          idempotent: true,
        });
        return;
      }
    } catch (err: unknown) {
      logger.error(
        {
          err,
          message: err instanceof Error ? err.message : String(err),
          razorpay_payment_id,
        },
        "Failed to check for an existing order before committing payment",
      );
    }

    // A payment attempt created by /razorpay/create-order may already be linked
    // to an order even if the browser lost the first response.
    if (isDatabaseConfigured() && db) {
      const attempt = await findAttemptByGatewayOrderId(db, razorpay_order_id);
      if (attempt?.orderId) {
        const existing = await orderStore.getById(attempt.orderId);
        if (existing) {
          res.status(200).json({
            success: true,
            order: existing,
            guestToken: signGuestOrderToken(
              existing.orderNumber,
              existing.customerEmail,
            ),
            paymentId: razorpay_payment_id,
            idempotent: true,
          });
          return;
        }
      }
      if (attempt?.orderNumber && attempt.orderNumber !== order.orderNumber) {
        res
          .status(409)
          .json({
            error: "This payment was started for a different order number.",
          });
        return;
      }
    }

    try {
      const calculatedOrder = await calculateOrder(order, {
        skipStockCheck: true,
      });
      const razorpayOrder = await razorpayService.fetchOrder(razorpay_order_id);
      const payment = await razorpayService.fetchPayment(razorpay_payment_id);
      if (
        razorpayOrder.receipt !== order.orderNumber ||
        razorpayOrder.amount !== Math.round(calculatedOrder.total * 100) ||
        razorpayOrder.currency !== "INR" ||
        payment.order_id !== razorpay_order_id ||
        payment.amount !== razorpayOrder.amount ||
        payment.status !== "captured"
      ) {
        if (isDatabaseConfigured() && db) {
          await db
            .execute(
              sql`
            UPDATE payments
            SET status = 'Paid', gateway_payment_id = ${razorpay_payment_id},
                verified_at = now(), settled_at = COALESCE(settled_at, now()),
                failure_reason = 'Gateway verification mismatch; order not committed',
                updated_at = now()
            WHERE gateway = 'razorpay' AND gateway_order_id = ${razorpay_order_id}
              AND order_id IS NULL AND status IN ('Pending', 'Authorized', 'Paid')
          `,
            )
            .catch(() => {});
        }
        res
          .status(400)
          .json({ error: "Payment amount or status could not be verified." });
        return;
      }
      let userId: number | undefined;
      if (accountCustomer) {
        const user = await userStore.findByEmail(accountCustomer.email);
        if (user) userId = user.id;
      }

      // A different payment must never be attached to an order number that is
      // already recorded. Surface the conflict instead of letting the unique
      // constraint produce a generic commit failure.
      const existingByNumber = await orderStore.getByOrderNumber(
        order.orderNumber,
      );
      if (existingByNumber) {
        if (existingByNumber.razorpayPaymentId === razorpay_payment_id) {
          res.status(200).json({
            success: true,
            order: existingByNumber,
            guestToken: signGuestOrderToken(
              existingByNumber.orderNumber,
              existingByNumber.customerEmail,
            ),
            paymentId: razorpay_payment_id,
            idempotent: true,
          });
          return;
        }
        logger.warn(
          {
            orderNumber: order.orderNumber,
            razorpay_payment_id,
            existingOrderNumber: existingByNumber.orderNumber,
          },
          "Order number already recorded for a different payment",
        );
        res
          .status(409)
          .json({
            error:
              "This order number has already been recorded. Please contact support with your payment ID.",
          });
        return;
      }

      const paymentNote = `Razorpay Payment ID: ${razorpay_payment_id} | Order ID: ${razorpay_order_id}`;
      const finalOrder = await orderStore.create(
        {
          ...calculatedOrder,
          userId,
          status: "paid",
          handoffType: "razorpay",
          paymentMethod: "razorpay",
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          notes: order.notes ? `${order.notes} | ${paymentNote}` : paymentNote,
        },
        {
          payment: {
            gateway: "razorpay",
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            method: "Razorpay",
            status: "Paid",
            expectedAmount: calculatedOrder.total,
          },
        },
      );

      trackServerEvent(
        finalOrder.customerEmail || finalOrder.orderNumber,
        "payment_succeeded",
        {
          order_id: finalOrder.id || finalOrder.orderNumber,
          order_number: finalOrder.orderNumber,
          payment_id: razorpay_payment_id,
          gateway: "razorpay",
          amount: Number(finalOrder.total ?? calculatedOrder.total ?? 0),
          currency: "INR",
          item_count: finalOrder.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
          items: finalOrder.items.map((item) => ({
            product_id: item.id,
            product_name: item.name || `Product #${item.id}`,
            size: item.size,
            price: Number(
              item.priceNum ?? (parseFloat(item.price || "0") || 0),
            ),
            quantity: item.quantity,
          })),
        },
      );

      trackServerEvent(
        finalOrder.customerEmail || finalOrder.orderNumber,
        "order_completed",
        {
          order_id: finalOrder.id || finalOrder.orderNumber,
          order_number: finalOrder.orderNumber,
          total: Number(finalOrder.total ?? calculatedOrder.total ?? 0),
          subtotal: Number(
            finalOrder.subtotal ?? calculatedOrder.subtotal ?? 0,
          ),
          shipping: Number(
            finalOrder.shipping ?? calculatedOrder.shipping ?? 0,
          ),
          currency: "INR",
          item_count: finalOrder.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
          customer_email: finalOrder.customerEmail,
          payment_method: "razorpay",
          items: finalOrder.items.map((item) => ({
            product_id: item.id,
            product_name: item.name || `Product #${item.id}`,
            size: item.size,
            price: Number(
              item.priceNum ?? (parseFloat(item.price || "0") || 0),
            ),
            quantity: item.quantity,
          })),
        },
      );

      logger.info(
        { orderNumber: finalOrder.orderNumber, paymentId: razorpay_payment_id },
        "Order successfully paid and recorded",
      );
      res.status(201).json({
        success: true,
        order: finalOrder,
        guestToken: signGuestOrderToken(
          finalOrder.orderNumber,
          finalOrder.customerEmail,
        ),
        paymentId: razorpay_payment_id,
      });
    } catch (err: unknown) {
      logger.error(
        {
          err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          orderNumber: order.orderNumber,
          razorpay_order_id,
          razorpay_payment_id,
        },
        "Failed to save confirmed order",
      );

      // Verification only reaches this catch after the signature, gateway order,
      // payment status and amount have been checked, so the money has been
      // captured. Always retain the captured payment for reconciliation even if
      // the order could not be committed.
      if (isDatabaseConfigured() && db) {
        await db
          .execute(
            sql`
          UPDATE payments
          SET status = 'Paid', gateway_payment_id = ${razorpay_payment_id},
              verified_at = now(), settled_at = COALESCE(settled_at, now()),
              failure_reason = ${err instanceof Error ? err.message : "Order commit failed after capture"},
              updated_at = now()
          WHERE gateway = 'razorpay' AND gateway_order_id = ${razorpay_order_id}
            AND order_id IS NULL AND status IN ('Pending', 'Authorized', 'Paid')
        `,
          )
          .catch(() => {});
        await db
          .execute(
            sql`
          UPDATE payment_events
          SET status = 'Unmatched',
              last_error = ${err instanceof Error ? err.message : "Order commit failed after capture"}
          WHERE gateway_order_id = ${razorpay_order_id} AND status = 'Received'
        `,
          )
          .catch(() => {});
      }

      if (err instanceof ReservationUnavailableError) {
        res.status(409).json({
          error:
            "Payment was captured but the items are no longer in stock. Contact support with your payment id.",
        });
        return;
      }

      if (err instanceof CouponError) {
        res.status(409).json({
          error:
            "Payment was captured but the discount code is no longer valid. Contact support with your payment id.",
        });
        return;
      }

      // The order may have been committed by a concurrent retry between our
      // idempotency check and the insert (for example a duplicate checkout
      // handler call). Return that order rather than reporting a false failure.
      try {
        const committed =
          await orderStore.getByRazorpayPaymentId(razorpay_payment_id);
        if (committed) {
          logger.info(
            {
              orderNumber: committed.orderNumber,
              paymentId: razorpay_payment_id,
            },
            "Order was committed by a concurrent verification; returning it",
          );
          res.status(200).json({
            success: true,
            order: committed,
            paymentId: razorpay_payment_id,
            idempotent: true,
          });
          return;
        }
      } catch (lookupErr: unknown) {
        logger.error(
          {
            err: lookupErr,
            message:
              lookupErr instanceof Error
                ? lookupErr.message
                : String(lookupErr),
            razorpay_payment_id,
          },
          "Failed to look up order after commit error",
        );
      }

      res
        .status(500)
        .json({ error: "Payment received but failed to commit order" });
    }
  },
);

// Public order submission from Storefront
orderRouter.post("/api/orders", orderRateLimiter, async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid order payload",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  if (parsed.data.handoffType === "razorpay") {
    res
      .status(400)
      .json({
        error:
          "Online payments must be completed through the verified Razorpay checkout.",
      });
    return;
  }

  const customer = await getOptionalCustomerClaims(req);
  if (customer === false) {
    res
      .status(401)
      .json({
        error:
          "Your customer session is invalid or expired. Please sign in again.",
      });
    return;
  }
  if (
    customer &&
    customer.email !== parsed.data.customerEmail.trim().toLowerCase()
  ) {
    res
      .status(403)
      .json({
        error: "Checkout email must match the signed-in customer account.",
      });
    return;
  }

  let userId: number | undefined;
  if (customer) {
    const user = await userStore.findByEmail(customer.email);
    if (user) userId = user.id;
  }

  const shouldGenerate = shouldGenerateServerOrderNumber(parsed.data.orderNumber);

  try {
    let order: Order | undefined;
    let calculatedOrder: CalculatedOrder | undefined;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      const currentOrderNumber =
        attempts === 1 && !shouldGenerate
          ? parsed.data.orderNumber!
          : generateOrderNumber();

      const existingOrder = await orderStore.getByOrderNumber(currentOrderNumber);
      if (existingOrder) {
        if (!shouldGenerate) {
          res.status(409).json({
            error:
              "This order number has already been recorded. Please contact support if you need help with an existing order.",
          });
          return;
        }
        continue;
      }

      try {
        calculatedOrder = await calculateOrder({
          ...parsed.data,
          orderNumber: currentOrderNumber,
        });
        order = await orderStore.create({
          ...calculatedOrder,
          userId,
        });
        break;
      } catch (err) {
        if (isUniqueConstraintViolation(err) && shouldGenerate && attempts < maxAttempts) {
          continue;
        }
        throw err;
      }
    }

    if (!order || !calculatedOrder) {
      res.status(500).json({ error: "Failed to process order" });
      return;
    }

    trackServerEvent(
      order.customerEmail || order.orderNumber,
      "payment_succeeded",
      {
        order_id: order.id || order.orderNumber,
        order_number: order.orderNumber,
        payment_id: `cod_${order.orderNumber}`,
        gateway: "cod",
        amount: Number(order.total ?? calculatedOrder.total ?? 0),
        currency: "INR",
        item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map((item) => ({
          product_id: item.id,
          product_name: item.name || `Product #${item.id}`,
          size: item.size,
          price: Number(item.priceNum ?? (parseFloat(item.price || "0") || 0)),
          quantity: item.quantity,
        })),
      },
    );

    trackServerEvent(
      order.customerEmail || order.orderNumber,
      "order_completed",
      {
        order_id: order.id || order.orderNumber,
        order_number: order.orderNumber,
        total: Number(order.total ?? calculatedOrder.total ?? 0),
        subtotal: Number(order.subtotal ?? calculatedOrder.subtotal ?? 0),
        shipping: Number(order.shipping ?? calculatedOrder.shipping ?? 0),
        currency: "INR",
        item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
        customer_email: order.customerEmail,
        payment_method: order.paymentMethod || "cod",
        items: order.items.map((item) => ({
          product_id: item.id,
          product_name: item.name || `Product #${item.id}`,
          size: item.size,
          price: Number(item.priceNum ?? (parseFloat(item.price || "0") || 0)),
          quantity: item.quantity,
        })),
      },
    );

    const guestToken = signGuestOrderToken(
      order.orderNumber,
      order.customerEmail,
    );
    res.status(201).json({ order, guestToken });
  } catch (err) {
    logger.error({ err }, "Failed to save order");
    if (err instanceof CouponError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    if (err instanceof ReservationUnavailableError) {
      res
        .status(409)
        .json({
          error:
            "One or more items are no longer available in the requested quantity.",
        });
      return;
    }
    if (isUniqueConstraintViolation(err)) {
      res.status(409).json({
        error:
          "This order number has already been recorded. Please contact support if you need help with an existing order.",
      });
      return;
    }
    res.status(500).json({ error: "Failed to process order" });
  }
});

// Customer / Guest / Admin: Retrieve order details for order confirmation
async function handleOrderConfirmationLookup(
  req: Request,
  res: Response,
): Promise<void> {
  const { orderNumber } = req.params;
  if (!orderNumber || typeof orderNumber !== "string") {
    res.status(400).json({ error: "Order number is required" });
    return;
  }

  const order = await orderStore.getByOrderNumber(orderNumber.trim());
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  let isAuthorized = false;

  // 1. Check admin key or admin session token
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  const headerKey = req.headers["x-admin-key"];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (adminKey && (headerKey === adminKey || bearerToken === adminKey)) {
    isAuthorized = true;
  } else if (bearerToken && verifyAdminSession(bearerToken)) {
    isAuthorized = true;
  }

  // 2. Check customer token
  if (!isAuthorized) {
    const customer = await getOptionalCustomerClaims(req);
    if (customer && customer.email) {
      if (order.customerEmail.toLowerCase() === customer.email.toLowerCase()) {
        isAuthorized = true;
      } else {
        const user = await userStore.findByEmail(customer.email);
        if (user && order.userId && order.userId === user.id) {
          isAuthorized = true;
        }
      }
    }
  }

  // 3. Check guest verification token
  const token =
    (req.query.token as string) || (req.headers["x-guest-token"] as string);
  if (!isAuthorized && token) {
    if (verifyGuestOrderToken(order.orderNumber, token)) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    res
      .status(403)
      .json({ error: "You are not authorized to view this order." });
    return;
  }

  res.json({
    order: {
      orderNumber: order.orderNumber,
      paymentId:
        order.paymentId ||
        (order.paymentMethod === "cod" ? "Cash on delivery" : ""),
      paymentMethod:
        order.paymentMethod === "cod" || order.handoffType === "cod"
          ? "cod"
          : "online",
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : String(order.createdAt),
      customerName: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.address,
      apartment: order.apartment || "",
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        priceNum: item.priceNum,
        img: item.img,
        color: (item as any).color || (item as any).variantLabel,
      })),
    },
  });
}

orderRouter.get(
  "/api/orders/confirmation/:orderNumber",
  handleOrderConfirmationLookup,
);
orderRouter.get(
  "/api/orders/lookup/:orderNumber",
  handleOrderConfirmationLookup,
);

// Admin: List all captured orders
orderRouter.get("/api/orders/mine", async (req: Request, res: Response) => {
  const customer = await getOptionalCustomerClaims(req);
  if (!customer) {
    res.status(401).json({ error: "Sign in to view your order history." });
    return;
  }

  try {
    const user = await userStore.findByEmail(customer.email);
    const orders = user
      ? await orderStore.listByUserId(user.id, customer.email)
      : await orderStore.listByCustomerEmail(customer.email);
    res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        address: order.address,
        apartment: order.apartment,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch customer order history");
    res
      .status(503)
      .json({ error: "Order history is temporarily unavailable." });
  }
});
// Customer: Cancel order
orderRouter.post("/api/orders/:id/cancel", async (req: Request, res: Response) => {
  const customer = await getOptionalCustomerClaims(req);
  if (!customer) {
    res.status(401).json({ error: "Sign in to manage your orders." });
    return;
  }

  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id || "");
  const numericId = /^\d+$/.test(idParam) ? Number(idParam) : null;
  const order = numericId !== null ? await orderStore.getById(numericId) : await orderStore.getByOrderNumber(idParam);

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const user = await userStore.findByEmail(customer.email);
  const ownsOrder =
    (order.customerEmail && order.customerEmail.toLowerCase() === customer.email.toLowerCase()) ||
    (user && order.userId === user.id);

  if (!ownsOrder) {
    res.status(403).json({ error: "You do not have permission to cancel this order." });
    return;
  }

  if (order.status !== "Pending" && order.status !== "Confirmed") {
    res.status(400).json({
      error: `Orders with status "${order.status}" cannot be cancelled. Only Pending or Confirmed orders can be cancelled.`,
    });
    return;
  }

  try {
    const updated = await orderStore.updateAdmin(order.id, { status: "Cancelled" }, "Customer");
    res.json({ success: true, order: updated });
  } catch (err) {
    logger.error({ err, orderId: order.id }, "Failed to cancel order");
    res.status(500).json({ error: "Failed to cancel order. Please try again." });
  }
});


orderRouter.get(
  "/api/orders",
  verifyAdminAuth,
  async (_req: Request, res: Response) => {
    try {
      const orders = await orderStore.list();
      res.json({ count: orders.length, orders });
    } catch (err) {
      logger.error({ err }, "Failed to fetch orders");
      res.status(500).json({ error: "Failed to retrieve orders" });
    }
  },
);

// Admin: Get single order by id
orderRouter.get(
  "/api/orders/:id",
  verifyAdminAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 0) {
      res
        .status(400)
        .json({ error: "Order id must be a non-negative integer" });
      return;
    }

    const order = await orderStore.getById(numericId);
    if (!order) {
      res.status(404).json({ error: `Order ${numericId} not found` });
      return;
    }

    res.json({ order });
  },
);

const adminOrderPatchSchema = z
  .object({
    status: z
      .enum([
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ])
      .optional(),
    paymentStatus: z.enum(["Pending", "Paid", "Failed"]).optional(),
    carrier: z.string().trim().min(1).max(100).optional(),
    trackingNumber: z.string().trim().min(1).max(100).optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "At least one update is required.",
  );

const ORDER_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Delivered", "Returned"],
  "Out for Delivery": ["Delivered", "Returned"],
  Delivered: ["Returned"],
  Returned: [],
  Cancelled: [],
};

orderRouter.patch(
  "/api/orders/:id",
  verifyAdminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Order id must be a positive integer." });
      return;
    }
    const parsed = adminOrderPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid order update." });
      return;
    }
    try {
      const current = await orderStore.getById(id);
      if (!current) {
        res.status(404).json({ error: `Order ${id} not found.` });
        return;
      }
      const patch = parsed.data;
      if (
        patch.status &&
        patch.status !== current.status &&
        !ORDER_TRANSITIONS[current.status]?.includes(patch.status)
      ) {
        res
          .status(409)
          .json({
            error: `Order cannot move from ${current.status} to ${patch.status}.`,
          });
        return;
      }
      if (
        patch.status === "Shipped" &&
        (!(patch.carrier || current.carrier) ||
          !(patch.trackingNumber || current.trackingNumber))
      ) {
        res
          .status(400)
          .json({
            error:
              "Set a carrier and tracking number before shipping this order.",
          });
        return;
      }
      if (patch.paymentStatus === "Paid" && current.handoffType !== "cod") {
        res
          .status(409)
          .json({
            error:
              "Online payment status can only be changed by verified payment records.",
          });
        return;
      }
      const author =
        process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || "Administrator";
      const order = await orderStore.updateAdmin(id, patch, author);
      res.json({ order });
    } catch (err) {
      logger.error({ err, id }, "Failed to update order");
      res.status(503).json({ error: "Order update is unavailable." });
    }
  },
);

const adminNoteSchema = z.object({ text: z.string().trim().min(1).max(5000) });
orderRouter.post(
  "/api/orders/:id/notes",
  verifyAdminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const parsed = adminNoteSchema.safeParse(req.body);
    if (!Number.isInteger(id) || id < 1 || !parsed.success) {
      res.status(400).json({ error: "Enter a valid order id and note." });
      return;
    }
    try {
      const author =
        process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || "Administrator";
      const order = await orderStore.addAdminNote(id, parsed.data.text, author);
      if (!order) {
        res.status(404).json({ error: `Order ${id} not found.` });
        return;
      }
      res.status(201).json({ order });
    } catch (err) {
      logger.error({ err, id }, "Failed to add internal order note");
      res.status(503).json({ error: "Order note could not be saved." });
    }
  },
);
