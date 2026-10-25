import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "../db/index.js";
import {
  customers as customersTable,
  customerAddresses as customerAddressesTable,
  orderEvents as orderEventsTable,
  orderItems as orderItemsTable,
  orders as ordersTable,
  payments as paymentsTable,
  productImages as productImagesTable,
  products as productsTable,
  productVariants,
  shipments as shipmentsTable,
  type DbCustomer,
  type DbOrder,
  type DbOrderEvent,
  type DbOrderItem,
  type DbPayment,
  type DbShipment,
} from "@jeans-store/db";
import type { CalculatedOrder, Order } from "../schemas/order.js";
import type { DbExecutor } from "../db/types.js";
import { assetUrl } from "@jeans-store/shared";
import {
  resolveCoupon,
  recordCouponRedemption,
  releaseCouponRedemption,
  CouponError,
} from "../services/coupon.js";
import {
  confirmReservations,
  expireReservations,
  releaseReservations,
  reserveInventory,
  restockOrder,
  type ReservationItem,
} from "../services/inventory.js";
import { logger } from "../lib/logger.js";
import { calculatePricing, type PricedLine } from "../services/pricing.js";

export interface CreateOrderPaymentOptions {
  gateway: "razorpay" | "manual";
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  method?: string;
  status?: "Pending" | "Paid" | "Failed";
  expectedAmount?: number;
}

export type OrderAdminPatch = Partial<
  Pick<Order, "status" | "paymentStatus" | "carrier" | "trackingNumber">
>;

function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function toOrder(
  row: DbOrder,
  itemsRows: DbOrderItem[] = [],
  eventRows: DbOrderEvent[] = [],
  shipment?: DbShipment,
  payment?: DbPayment,
  customer?: DbCustomer,
  productImageMap?: Map<string, string>,
): Order {
  const items: Order["items"] = itemsRows.map((item) => {
    let img: string | undefined = undefined;
    if (item.imageKey) {
      img =
        item.imageKey.startsWith("http://") ||
        item.imageKey.startsWith("https://") ||
        item.imageKey.startsWith("/")
          ? item.imageKey
          : assetUrl(item.imageKey);
    }
    if (!img && item.productId && productImageMap) {
      img = productImageMap.get(item.productId);
    }
    if (!img) {
      img = (item as any).imageUrl ?? undefined;
    }

    return {
      id: item.productId ?? "",
      variantId: item.variantId ?? undefined,
      name: item.name,
      size: item.size,
      price: formatPrice(item.unitPrice),
      priceNum: item.unitPrice,
      sku: item.sku ?? undefined,
      quantity: item.quantity,
      weightGrams: item.weightGrams,
      img,
      lineTotal: item.lineTotal,
      discountAmount: item.discountAmount,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      taxableAmount: item.taxableAmount,
      variantLabel: item.variantLabel ?? undefined,
    };
  });

  const events = eventRows
    .filter((event) => event.kind === "status")
    .map((event) => ({
      id: String(event.id),
      status: event.status || "",
      note: event.note || "",
      at: event.createdAt.toISOString(),
      by: event.actorName || "System",
    }));

  const adminNotes = eventRows
    .filter((event) => event.kind === "note")
    .map((event) => ({
      id: String(event.id),
      text: event.note || "",
      at: event.createdAt.toISOString(),
      by: event.actorName || "Admin",
      internal: event.isInternal,
    }));

  return {
    id: row.id,
    userId: customer?.userId ?? undefined,
    orderNumber: row.orderNumber,
    store: "teesgarage",
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    address: row.address,
    apartment: row.apartment ?? undefined,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    notes: row.notes ?? undefined,
    items,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    shipping: row.shipping,
    taxTotal: row.taxTotal,
    total: row.total,
    weightGrams: row.weightGrams,
    couponCode: row.couponCode ?? undefined,
    status: row.status,
    paymentStatus: row.paymentStatus as Order["paymentStatus"],
    handoffType: row.handoffType as Order["handoffType"],
    paymentMethod: payment?.method,
    paymentId: payment?.gatewayPaymentId ?? undefined,
    razorpayOrderId: payment?.gatewayOrderId ?? undefined,
    razorpayPaymentId: payment?.gatewayPaymentId ?? undefined,
    carrier: shipment?.carrier ?? null,
    trackingNumber: shipment?.trackingNumber ?? null,
    shippedAt: shipment?.shippedAt ?? null,
    deliveredAt: shipment?.deliveredAt ?? null,
    adminNotes,
    events,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class OrderStore {
  private memoryOrders: Order[] = [];

  private async hydrateOrders(orderRows: DbOrder[]): Promise<Order[]> {
    if (orderRows.length === 0) return [];
    const orderIds = orderRows.map((row) => row.id);
    const customerIds = [...new Set(orderRows.map((row) => row.customerId))];

    const [allItems, allEvents, allShipments, allPayments, allCustomers] =
      await Promise.all([
        db!
          .select()
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, orderIds))
          .orderBy(orderItemsTable.id),
        db!
          .select()
          .from(orderEventsTable)
          .where(inArray(orderEventsTable.orderId, orderIds))
          .orderBy(orderEventsTable.createdAt),
        db!
          .select()
          .from(shipmentsTable)
          .where(inArray(shipmentsTable.orderId, orderIds))
          .orderBy(desc(shipmentsTable.createdAt)),
        db!
          .select()
          .from(paymentsTable)
          .where(inArray(paymentsTable.orderId, orderIds))
          .orderBy(desc(paymentsTable.createdAt)),
        db!
          .select()
          .from(customersTable)
          .where(inArray(customersTable.id, customerIds)),
      ]);

    const itemsByOrder = new Map<number, DbOrderItem[]>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    const eventsByOrder = new Map<number, DbOrderEvent[]>();
    for (const event of allEvents) {
      const list = eventsByOrder.get(event.orderId) ?? [];
      list.push(event);
      eventsByOrder.set(event.orderId, list);
    }
    const shipmentByOrder = new Map<number, DbShipment>();
    for (const shipment of allShipments) {
      if (!shipmentByOrder.has(shipment.orderId))
        shipmentByOrder.set(shipment.orderId, shipment);
    }
    const paymentByOrder = new Map<number, DbPayment>();
    for (const payment of allPayments) {
      if (payment.orderId === null) continue;
      const current = paymentByOrder.get(payment.orderId);
      // Prefer the settled attempt; payment attempts are ordered newest first,
      // so the first settled row wins without hiding a later retry failure.
      if (!current) paymentByOrder.set(payment.orderId, payment);
      else if (
        current.status !== "Paid" &&
        current.status !== "Refunded" &&
        (payment.status === "Paid" || payment.status === "Refunded")
      ) {
        paymentByOrder.set(payment.orderId, payment);
      }
    }
    const customerById = new Map<number, DbCustomer>(
      allCustomers.map((customer) => [customer.id, customer]),
    );
    const productIdsWithMissingImages = allItems
      .filter(
        (item) => item.productId && (!item.imageKey || !item.imageKey.trim()),
      )
      .map((item) => item.productId!);
    const uniqueProductIds = [...new Set(productIdsWithMissingImages)];

    const productImages =
      uniqueProductIds.length > 0
        ? await db!
            .select()
            .from(productImagesTable)
            .where(inArray(productImagesTable.productId, uniqueProductIds))
            .orderBy(productImagesTable.position)
        : [];

    const productImageMap = new Map<string, string>();
    for (const img of productImages) {
      if (!productImageMap.has(img.productId)) {
        const resolved =
          img.externalUrl || (img.storageKey ? assetUrl(img.storageKey) : "");
        if (resolved) productImageMap.set(img.productId, resolved);
      }
    }

    return orderRows.map((row) =>
      toOrder(
        row,
        itemsByOrder.get(row.id),
        eventsByOrder.get(row.id),
        shipmentByOrder.get(row.id),
        paymentByOrder.get(row.id),
        customerById.get(row.customerId),
        productImageMap,
      ),
    );
  }

  async list(): Promise<Order[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db
        .select()
        .from(ordersTable)
        .orderBy(desc(ordersTable.createdAt));
      return this.hydrateOrders(rows);
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return [...this.memoryOrders].reverse();
  }

  async listByCustomerEmail(email: string): Promise<Order[]> {
    const normalizedEmail = email.trim().toLowerCase();
    if (isDatabaseConfigured() && db) {
      const customerRows = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(sql`lower(${customersTable.email}) = ${normalizedEmail}`);
      const customerIds = customerRows.map((row) => row.id);
      const condition =
        customerIds.length > 0
          ? or(
              inArray(ordersTable.customerId, customerIds),
              sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}`,
            )
          : sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}`;

      const rows = await db
        .select()
        .from(ordersTable)
        .where(condition)
        .orderBy(desc(ordersTable.createdAt));
      return this.hydrateOrders(rows);
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return this.memoryOrders
      .filter(
        (order) => order.customerEmail.trim().toLowerCase() === normalizedEmail,
      )
      .reverse();
  }

  async listByUserId(userId: number, fallbackEmail?: string): Promise<Order[]> {
    const normalizedEmail = fallbackEmail?.trim().toLowerCase();
    if (isDatabaseConfigured() && db) {
      const customerRows = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(
          normalizedEmail
            ? or(
                eq(customersTable.userId, userId),
                sql`lower(${customersTable.email}) = ${normalizedEmail}`,
              )
            : eq(customersTable.userId, userId),
        );
      const customerIds = customerRows.map((row) => row.id);
      const condition =
        customerIds.length > 0
          ? or(
              inArray(ordersTable.customerId, customerIds),
              normalizedEmail
                ? sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}`
                : sql`1=0`,
            )
          : sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail ?? ""}`;
      const rows = await db
        .select()
        .from(ordersTable)
        .where(condition)
        .orderBy(desc(ordersTable.createdAt));
      return this.hydrateOrders(rows);
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return this.memoryOrders
      .filter(
        (order) =>
          order.userId === userId ||
          (normalizedEmail &&
            order.customerEmail.trim().toLowerCase() === normalizedEmail),
      )
      .reverse();
  }

  async getById(id: number): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, id));
      if (!row) return undefined;
      return (await this.hydrateOrders([row]))[0];
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return this.memoryOrders.find((order) => order.id === id);
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.orderNumber, orderNumber));
      if (!row) return undefined;
      return (await this.hydrateOrders([row]))[0];
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return this.memoryOrders.find((order) => order.orderNumber === orderNumber);
  }

  /**
   * Looks up an order by the gateway payment id. Razorpay verification can be
   * retried by the client (network drop after payment, page reload, duplicate
   * handler calls), so callers use this to return the already-committed order
   * instead of creating a second one or decrementing stock twice.
   */
  async getByRazorpayPaymentId(
    gatewayPaymentId: string,
  ): Promise<Order | undefined> {
    if (!gatewayPaymentId) return undefined;
    if (isDatabaseConfigured() && db) {
      const [payment] = await db
        .select({ orderId: paymentsTable.orderId })
        .from(paymentsTable)
        .where(eq(paymentsTable.gatewayPaymentId, gatewayPaymentId));
      if (!payment || payment.orderId === null) return undefined;
      return this.getById(payment.orderId);
    }
    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    return this.memoryOrders.find(
      (order) => order.razorpayPaymentId === gatewayPaymentId,
    );
  }

  private async upsertCustomer(
    executor: DbExecutor,
    input: CalculatedOrder & { userId?: number },
  ): Promise<number> {
    const email = input.customerEmail.trim().toLowerCase();
    let existing: typeof customersTable.$inferSelect | undefined;

    if (input.userId) {
      [existing] = await executor
        .select()
        .from(customersTable)
        .where(eq(customersTable.userId, input.userId));
    }

    if (!existing) {
      const [byEmail] = await executor
        .select()
        .from(customersTable)
        .where(sql`lower(${customersTable.email}) = ${email}`);
      if (byEmail) {
        if (input.userId && byEmail.userId && byEmail.userId !== input.userId) {
          throw new Error(
            "This email is already linked to another customer account.",
          );
        }
        existing = byEmail;
      }
    }

    let customerId: number;
    if (existing) {
      customerId = existing.id;
      await executor
        .update(customersTable)
        .set({
          name: input.customerName,
          phone: input.customerPhone,
          userId: input.userId ?? existing.userId,
          updatedAt: new Date(),
        })
        .where(eq(customersTable.id, existing.id));
    } else {
      const [created] = await executor
        .insert(customersTable)
        .values({
          userId: input.userId ?? null,
          name: input.customerName,
          email,
          phone: input.customerPhone,
        })
        .returning({ id: customersTable.id });
      customerId = created.id;
    }

    const existingAddresses = await executor
      .select({
        id: customerAddressesTable.id,
        line1: customerAddressesTable.line1,
        city: customerAddressesTable.city,
        state: customerAddressesTable.state,
        pincode: customerAddressesTable.pincode,
      })
      .from(customerAddressesTable)
      .where(eq(customerAddressesTable.customerId, customerId));

    const normalize = (val: string | null | undefined) =>
      (val ?? "").trim().toLowerCase();
    const targetLine1 = normalize(input.address);
    const targetCity = normalize(input.city);
    const targetState = normalize(input.state);
    const targetPincode = normalize(input.pincode);

    const addressExists = existingAddresses.some(
      (addr) =>
        normalize(addr.line1) === targetLine1 &&
        normalize(addr.city) === targetCity &&
        normalize(addr.state) === targetState &&
        normalize(addr.pincode) === targetPincode,
    );

    if (!addressExists) {
      await executor.insert(customerAddressesTable).values({
        customerId,
        label: "Home",
        line1: input.address,
        line2: input.apartment ?? null,
        landmark: input.landmark ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        phone: input.customerPhone,
        isDefault: existingAddresses.length === 0,
      });
    }

    return customerId;
  }

  /**
   * Re-reads every purchased variant from the database. Prices, tax rates,
   * names, sizes and images from the browser are never trusted for
   * persistence; only the variant id and quantity are accepted.
   */
  private async loadCatalogLines(
    executor: DbExecutor,
    items: CalculatedOrder["items"],
  ): Promise<
    Array<
      import("../services/pricing.js").PricedLineInput & { lineTotal: number }
    >
  > {
    const variantIds = [...new Set(items.map((item) => item.variantId))];
    if (variantIds.length === 0)
      throw new Error("An order needs at least one saved product variant.");

    const variantRows = await executor.execute(sql`
      SELECT v.id AS variant_id, v.product_id, v.sku, v.size, v.color, v.price AS variant_price,
             v.weight_grams AS variant_weight, v.status AS variant_status,
             p.name AS product_name, p.price AS product_price, p.tax_rate, p.weight_grams AS product_weight,
             p.is_free_size, p.category_id, p.status AS product_status
      FROM product_variants v
      INNER JOIN products p ON p.id = v.product_id
      WHERE v.id IN (${sql.join(
        variantIds.map((id) => sql`${id}`),
        sql`, `,
      )})
    `);
    const byVariant = new Map<number, Record<string, unknown>>();
    for (const row of variantRows.rows) {
      const record = row as Record<string, unknown>;
      byVariant.set(Number(record.variant_id), record);
    }

    const productIds = [
      ...new Set([...byVariant.values()].map((row) => String(row.product_id))),
    ];
    const imageRows = productIds.length
      ? await executor.execute(sql`
          SELECT product_id, storage_key, external_url
          FROM product_images
          WHERE product_id IN (${sql.join(
            productIds.map((id) => sql`${id}`),
            sql`, `,
          )})
          ORDER BY product_id, position
        `)
      : { rows: [] as Record<string, unknown>[] };
    const imageByProduct = new Map<string, string>();
    for (const raw of imageRows.rows) {
      const row = raw as Record<string, unknown>;
      const productId = String(row.product_id);
      if (imageByProduct.has(productId)) continue;
      const image = row.external_url
        ? String(row.external_url)
        : row.storage_key
          ? assetUrl(String(row.storage_key))
          : "";
      if (image) imageByProduct.set(productId, image);
    }

    return items.map((item) => {
      const row = byVariant.get(item.variantId);
      if (!row)
        throw new Error(`Variant ${item.variantId} is no longer available.`);
      if (String(row.product_status) !== "active") {
        throw new Error(
          `${String(row.product_name)} is not available for purchase.`,
        );
      }
      if (String(row.variant_status) !== "Active") {
        throw new Error(
          `Size ${String(row.size)} for ${String(row.product_name)} is no longer available.`,
        );
      }
      const productId = String(row.product_id);
      if (item.id && item.id !== productId) {
        throw new Error("A cart item does not belong to the selected product.");
      }
      const variantPrice = Number(row.variant_price);
      const unitPrice =
        Number.isFinite(variantPrice) && variantPrice > 0
          ? variantPrice
          : Number(row.product_price);
      const weight = Number(row.variant_weight ?? row.product_weight ?? 0);
      const quantity = Math.max(1, Math.min(50, Math.round(item.quantity)));
      return {
        productId,
        variantId: item.variantId,
        name: String(row.product_name),
        size: String(row.size),
        color: row.color ? String(row.color) : undefined,
        sku: row.sku ? String(row.sku) : undefined,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
        weightGrams: weight,
        img: imageByProduct.get(productId),
        categoryId: Number(row.category_id),
        isFreeSize: Boolean(row.is_free_size),
        taxRate: Number(row.tax_rate ?? 0),
        variantLabel: [row.color, row.size].filter(Boolean).join(" / "),
      };
    });
  }

  async create(
    input: CalculatedOrder & { userId?: number },
    options: { payment?: CreateOrderPaymentOptions } = {},
  ): Promise<Order> {
    const createdAt = new Date();
    const paymentPaid = options.payment?.status === "Paid";
    const status = paymentPaid ? "Confirmed" : "Pending";
    const paymentStatus = paymentPaid ? "Paid" : "Pending";

    if (isDatabaseConfigured() && db) {
      const orderId = await db.transaction(async (tx) => {
        const executor = tx as unknown as DbExecutor;
        const customerId = await this.upsertCustomer(executor, input);
        const catalogLines = await this.loadCatalogLines(executor, input.items);

        let couponId: number | null = null;
        let couponCode: string | null = null;
        let discount = 0;
        if (input.couponCode) {
          try {
            const resolved = await resolveCoupon(executor, {
              code: input.couponCode,
              customerId,
              items: catalogLines.map((line) => ({
                productId: line.productId,
                categoryId: line.categoryId,
                lineTotal: line.lineTotal,
              })),
              subtotal: catalogLines.reduce(
                (sum, line) => sum + line.lineTotal,
                0,
              ),
              forUpdate: true,
            });
            couponId = resolved.coupon.id;
            couponCode = resolved.code;
            discount = resolved.discount;
          } catch (error) {
            if (error instanceof CouponError) throw error;
            throw new Error(
              error instanceof Error
                ? error.message
                : "Unable to validate the discount code.",
            );
          }
        }

        const pricing = calculatePricing(
          catalogLines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            name: line.name,
            size: line.size,
            color: line.color,
            sku: line.sku,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            weightGrams: line.weightGrams,
            img: line.img,
            categoryId: line.categoryId,
            isFreeSize: line.isFreeSize,
            taxRate: line.taxRate,
            variantLabel: line.variantLabel,
          })),
          { discount, shipping: input.shipping },
        );

        if (
          options.payment?.expectedAmount !== undefined &&
          options.payment.expectedAmount !== pricing.total
        ) {
          throw new Error(
            "The captured payment amount no longer matches the server-calculated order total.",
          );
        }

        const [row] = await executor
          .insert(ordersTable)
          .values({
            orderNumber: input.orderNumber,
            customerId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail.trim().toLowerCase(),
            address: input.address,
            apartment: input.apartment ?? null,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            notes: input.notes ?? null,
            subtotal: pricing.subtotal,
            discountTotal: pricing.discountTotal,
            shipping: pricing.shipping,
            taxTotal: pricing.taxTotal,
            total: pricing.total,
            weightGrams: pricing.weightGrams,
            couponId,
            couponCode,
            status,
            paymentStatus,
            handoffType: input.handoffType,
          })
          .returning();

        for (const line of pricing.lines) {
          await executor.insert(orderItemsTable).values({
            orderId: row.id,
            productId: line.productId,
            variantId: line.variantId,
            sku: line.sku ?? null,
            name: line.name,
            size: line.size,
            color: line.color ?? null,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
            discountAmount: line.discountAmount,
            taxableAmount: line.taxableAmount,
            taxRate: line.taxRate,
            taxAmount: line.taxAmount,
            variantLabel: line.variantLabel || null,
            weightGrams: line.weightGrams,
            imageKey: line.img ?? null,
          });
        }

        const reservationItems: ReservationItem[] = pricing.lines.map(
          (line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            isFreeSize: Boolean(line.isFreeSize),
            sku: line.sku,
          }),
        );

        await expireReservations(executor, 50);

        const gatewayOrderId = options.payment?.gatewayOrderId ?? null;
        let confirmed = 0;
        if (gatewayOrderId) {
          confirmed = await confirmReservations(executor, {
            gatewayOrderId,
            orderId: row.id,
            expectedItems: reservationItems,
          });
        }
        if (confirmed === 0) {
          await reserveInventory(executor, {
            orderId: row.id,
            reservationKeyPrefix: `order:${row.id}`,
            items: reservationItems,
            ttlSeconds: paymentPaid ? 15 * 60 : 20 * 60,
            reason: paymentPaid
              ? "Order inventory reserved"
              : "Checkout inventory reserved",
          });
          // Manual, WhatsApp, email and COD orders are final at creation time.
          // Online payments without a gateway reference are treated the same way.
          // Only a Razorpay hold stays reserved until verification confirms it.
          if (paymentPaid || !gatewayOrderId) {
            await confirmReservations(executor, { orderId: row.id });
          }
        }

        await executor.insert(orderEventsTable).values({
          orderId: row.id,
          kind: "status",
          status,
          note: "Customer order placed",
          isInternal: false,
          actorName: "System",
          createdAt,
        });

        if (options.payment?.gateway === "razorpay") {
          const attached = await executor
            .update(paymentsTable)
            .set({
              orderId: row.id,
              orderNumber: row.orderNumber,
              gatewayPaymentId: options.payment.gatewayPaymentId ?? null,
              status: paymentStatus,
              settledAt: paymentPaid ? createdAt : null,
              verifiedAt: paymentPaid ? createdAt : null,
              failureReason: null,
              updatedAt: createdAt,
            })
            .where(
              and(
                eq(paymentsTable.gateway, "razorpay"),
                eq(paymentsTable.gatewayOrderId, gatewayOrderId ?? ""),
                or(
                  isNull(paymentsTable.orderId),
                  eq(paymentsTable.orderId, row.id),
                ),
              ),
            )
            .returning({ id: paymentsTable.id });

          if (attached.length === 0) {
            await executor.insert(paymentsTable).values({
              orderId: row.id,
              orderNumber: row.orderNumber,
              method: options.payment.method ?? "Razorpay",
              amount: pricing.total,
              status: paymentStatus,
              gateway: "razorpay",
              gatewayOrderId,
              gatewayPaymentId: options.payment.gatewayPaymentId ?? null,
              settledAt: paymentPaid ? createdAt : null,
              verifiedAt: paymentPaid ? createdAt : null,
            });
          }
        } else {
          await executor.insert(paymentsTable).values({
            orderId: row.id,
            orderNumber: row.orderNumber,
            method:
              input.paymentMethod ??
              (input.handoffType === "cod" ? "COD" : "Manual"),
            amount: pricing.total,
            status: paymentStatus,
            gateway: "manual",
            gatewayPaymentId: input.paymentId ?? null,
            settledAt: paymentPaid ? createdAt : null,
          });
        }

        if (couponId) {
          await recordCouponRedemption(executor, {
            couponId,
            orderId: row.id,
            customerId,
            amount: pricing.discountTotal,
          });
        }

        return row.id;
      });

      const created = await this.getById(orderId);
      if (!created)
        throw new Error("Order could not be loaded after creation.");
      return created;
    }

    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    const orderId = this.memoryOrders.length + 1;
    const priced = calculatePricing(
      input.items.map((item) => ({
        productId: item.id,
        variantId: item.variantId,
        name: item.name,
        size: item.size,
        color: (item as { color?: string }).color,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.priceNum,
        weightGrams: item.weightGrams ?? 0,
        img: item.img,
        taxRate: item.taxRate,
        variantLabel: item.variantLabel,
      })),
      { shipping: input.shipping },
    );
    const items: Order["items"] = priced.lines.map((line) => ({
      id: line.productId,
      variantId: line.variantId,
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
      taxRate: line.taxRate,
      taxAmount: line.taxAmount,
      taxableAmount: line.taxableAmount,
      variantLabel: line.variantLabel,
    }));
    const order: Order = {
      id: orderId,
      userId: input.userId ?? undefined,
      ...input,
      items,
      subtotal: priced.subtotal,
      discountTotal: priced.discountTotal,
      shipping: priced.shipping,
      taxTotal: priced.taxTotal,
      total: priced.total,
      weightGrams: priced.weightGrams,
      store: input.store || "teesgarage",
      status,
      paymentStatus,
      carrier: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      adminNotes: [],
      events: [
        {
          id: `evt-${createdAt.getTime()}`,
          status,
          note: "Customer order placed",
          at: createdAt.toISOString(),
          by: "System",
        },
      ],
      createdAt,
      updatedAt: createdAt,
    };

    this.memoryOrders.push(order);
    return order;
  }

  async updateAdmin(
    id: number,
    patch: OrderAdminPatch,
    author: string,
  ): Promise<Order | undefined> {
    const current = await this.getById(id);
    if (!current) return undefined;
    const now = new Date();
    const statusChanged =
      patch.status !== undefined && patch.status !== current.status;

    if (isDatabaseConfigured() && db) {
      // Restore inventory before recording a terminal status. If this fails, the
      // order stays in its previous state and the admin can retry; doing it the
      // other way round would leave a cancelled order with unreserved stock.
      if (
        statusChanged &&
        (patch.status === "Cancelled" || patch.status === "Returned")
      ) {
        await db.transaction(async (tx) => {
          const executor = tx as unknown as DbExecutor;
          await releaseReservations(executor, {
            orderId: id,
            reason: `Order ${patch.status?.toLowerCase()}`,
          });
          await restockOrder(
            executor,
            id,
            `Order ${patch.status?.toLowerCase()}`,
          );
          if (patch.status === "Cancelled") {
            await releaseCouponRedemption(executor, id);
          }
        });
      }

      if (statusChanged) {
        await db.insert(orderEventsTable).values({
          orderId: id,
          kind: "status",
          status: patch.status!,
          note: `Status changed from ${current.status} to ${patch.status}`,
          isInternal: false,
          actorName: author,
          createdAt: now,
        });
      }

      const values: Record<string, unknown> = { updatedAt: now };
      if (patch.status !== undefined) values.status = patch.status;
      if (patch.paymentStatus !== undefined)
        values.paymentStatus = patch.paymentStatus;
      await db.update(ordersTable).set(values).where(eq(ordersTable.id, id));

      if (patch.paymentStatus !== undefined) {
        const [latestPayment] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, id))
          .orderBy(desc(paymentsTable.createdAt));
        if (latestPayment) {
          await db
            .update(paymentsTable)
            .set({
              status: patch.paymentStatus,
              settledAt:
                patch.paymentStatus === "Paid"
                  ? (latestPayment.settledAt ?? now)
                  : null,
            })
            .where(eq(paymentsTable.id, latestPayment.id));
        } else {
          await db.insert(paymentsTable).values({
            orderId: id,
            method: "Manual",
            amount: current.total ?? 0,
            status: patch.paymentStatus,
            gateway: "manual",
            settledAt: patch.paymentStatus === "Paid" ? now : null,
          });
        }
      }

      const shipmentTouched =
        patch.carrier !== undefined ||
        patch.trackingNumber !== undefined ||
        patch.status === "Shipped" ||
        patch.status === "Delivered";

      if (shipmentTouched) {
        const [existingShipment] = await db
          .select()
          .from(shipmentsTable)
          .where(eq(shipmentsTable.orderId, id))
          .orderBy(desc(shipmentsTable.createdAt));
        const carrier = patch.carrier ?? existingShipment?.carrier ?? "Manual";
        const trackingNumber =
          patch.trackingNumber ??
          existingShipment?.trackingNumber ??
          `TG-${id}-${now.getTime()}`;
        const shipmentStatus =
          patch.status === "Delivered"
            ? "Delivered"
            : patch.status === "Shipped"
              ? "In Transit"
              : (existingShipment?.status ?? "Booked");
        const shippedAt =
          existingShipment?.shippedAt ??
          (patch.status === "Shipped" || patch.status === "Delivered"
            ? now
            : null);
        const deliveredAt =
          patch.status === "Delivered"
            ? now
            : (existingShipment?.deliveredAt ?? null);

        if (existingShipment) {
          await db
            .update(shipmentsTable)
            .set({
              carrier,
              trackingNumber,
              status: shipmentStatus,
              shippedAt,
              deliveredAt,
              updatedAt: now,
            })
            .where(eq(shipmentsTable.id, existingShipment.id));
        } else {
          const [byTracking] = await db
            .select()
            .from(shipmentsTable)
            .where(eq(shipmentsTable.trackingNumber, trackingNumber));
          if (byTracking) {
            await db
              .update(shipmentsTable)
              .set({
                orderId: id,
                carrier,
                status: shipmentStatus,
                shippedAt,
                deliveredAt,
                updatedAt: now,
              })
              .where(eq(shipmentsTable.id, byTracking.id));
          } else {
            await db.insert(shipmentsTable).values({
              orderId: id,
              carrier,
              trackingNumber,
              status: shipmentStatus,
              shippedAt,
              deliveredAt,
            });
          }
        }
      }

      return this.getById(id);
    }

    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    const events = statusChanged
      ? [
          ...current.events,
          {
            id: `evt-${now.getTime()}`,
            status: patch.status!,
            note: `Status changed from ${current.status} to ${patch.status}`,
            at: now.toISOString(),
            by: author,
          },
        ]
      : current.events;

    const updated: Order = {
      ...current,
      ...patch,
      events,
      updatedAt: now,
      shippedAt:
        patch.status === "Shipped" || patch.status === "Delivered"
          ? now
          : current.shippedAt,
      deliveredAt: patch.status === "Delivered" ? now : current.deliveredAt,
      carrier: patch.carrier ?? current.carrier,
      trackingNumber: patch.trackingNumber ?? current.trackingNumber,
    };
    this.memoryOrders = this.memoryOrders.map((order) =>
      order.id === id ? updated : order,
    );
    return updated;
  }

  async addAdminNote(
    id: number,
    text: string,
    author: string,
  ): Promise<Order | undefined> {
    const current = await this.getById(id);
    if (!current) return undefined;
    const now = new Date();

    if (isDatabaseConfigured() && db) {
      await db.insert(orderEventsTable).values({
        orderId: id,
        kind: "note",
        note: text,
        isInternal: true,
        actorName: author,
        createdAt: now,
      });
      return this.getById(id);
    }

    if (process.env.NODE_ENV === "production")
      throw new Error("Order database is not configured.");
    const adminNotes = [
      ...current.adminNotes,
      {
        id: `note-${now.getTime()}`,
        text,
        at: now.toISOString(),
        by: author,
        internal: true,
      },
    ];
    const updated = { ...current, adminNotes, updatedAt: now };
    this.memoryOrders = this.memoryOrders.map((order) =>
      order.id === id ? updated : order,
    );
    return updated;
  }
}

export const orderStore = new OrderStore();
