import { and, eq, sql } from 'drizzle-orm'
import { couponCategories, couponProducts, couponRedemptions, coupons, type DbCoupon } from '@jeans-store/db'
import type { DbExecutor } from '../db/types.js'

export class CouponError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'CouponError'
    this.statusCode = statusCode
  }
}

export interface CouponCartItem {
  productId: number
  categoryId?: number
  lineTotal: number
}

export interface CouponResolution {
  coupon: DbCoupon
  code: string
  discount: number
  eligibleSubtotal: number
}

/** Coupon codes are stored lowercase and compared case-insensitively. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toLowerCase()
}

function nowIsInsideWindow(coupon: DbCoupon, now: Date): boolean {
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) return false
  if (coupon.endsAt && coupon.endsAt.getTime() <= now.getTime()) return false
  return true
}

/**
 * Validates a coupon against the server-calculated cart and returns the
 * discount. When `forUpdate` is true the coupon row is locked for the duration
 * of the surrounding transaction, serialising usage-limit checks.
 */
export async function resolveCoupon(
  executor: DbExecutor,
  options: {
    code: string
    customerId?: number | null
    items: CouponCartItem[]
    subtotal: number
    forUpdate?: boolean
    now?: Date
  }
): Promise<CouponResolution> {
  const code = normalizeCouponCode(options.code)
  if (!code) throw new CouponError('Enter a discount code.')

  const baseQuery = executor
    .select()
    .from(coupons)
    .where(sql`lower(${coupons.code}) = ${code}`)
    .limit(1)
  const rows = options.forUpdate ? await baseQuery.for('update') : await baseQuery
  const coupon = rows[0]
  if (!coupon || !coupon.isActive) throw new CouponError('This discount code is not valid.')

  const now = options.now ?? new Date()
  if (!nowIsInsideWindow(coupon, now)) throw new CouponError('This discount code has expired.')

  if (options.subtotal < coupon.minOrderValue) {
    throw new CouponError(`This code requires a minimum order of ₹${coupon.minOrderValue.toLocaleString('en-IN')}.`)
  }

  if (coupon.usageLimit !== null) {
    const [usage] = await executor
      .select({ count: sql<number>`count(*)::int` })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.status, 'Redeemed')))
    if ((usage?.count ?? 0) >= coupon.usageLimit) {
      throw new CouponError('This discount code has reached its usage limit.', 409)
    }
  }

  if (options.customerId) {
    const [customerUsage] = await executor
      .select({ count: sql<number>`count(*)::int` })
      .from(couponRedemptions)
      .where(
        and(
          eq(couponRedemptions.couponId, coupon.id),
          eq(couponRedemptions.customerId, options.customerId),
          eq(couponRedemptions.status, 'Redeemed')
        )
      )
    if ((customerUsage?.count ?? 0) >= coupon.perCustomerLimit) {
      throw new CouponError('You have already used this discount code.', 409)
    }
  }

  const [productLinks, categoryLinks] = await Promise.all([
    executor
      .select({ productId: couponProducts.productId })
      .from(couponProducts)
      .where(eq(couponProducts.couponId, coupon.id)),
    executor
      .select({ categoryId: couponCategories.categoryId })
      .from(couponCategories)
      .where(eq(couponCategories.couponId, coupon.id))
  ])

  const allowedProducts = new Set(productLinks.map((row) => row.productId))
  const allowedCategories = new Set(categoryLinks.map((row) => row.categoryId))
  const hasRestrictions = allowedProducts.size > 0 || allowedCategories.size > 0

  const eligibleSubtotal = options.items.reduce((sum, item) => {
    const eligible =
      !hasRestrictions ||
      allowedProducts.has(item.productId) ||
      (item.categoryId !== undefined && allowedCategories.has(item.categoryId))
    return eligible ? sum + item.lineTotal : sum
  }, 0)

  if (eligibleSubtotal <= 0) {
    throw new CouponError('This discount code does not apply to the items in your cart.')
  }

  let discount = coupon.type === 'percentage' ? Math.round((eligibleSubtotal * coupon.value) / 100) : coupon.value

  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount)
  discount = Math.max(0, Math.min(discount, eligibleSubtotal, options.subtotal))

  if (discount <= 0) throw new CouponError('This discount code does not apply to your order.')

  return { coupon, code, discount, eligibleSubtotal }
}

/**
 * Records a successful redemption. The unique (coupon, order) index and the
 * unique order reference make retries safe.
 */
export async function recordCouponRedemption(
  executor: DbExecutor,
  input: { couponId: number; orderId: number; customerId?: number | null; amount: number }
): Promise<void> {
  await executor
    .insert(couponRedemptions)
    .values({
      couponId: input.couponId,
      orderId: input.orderId,
      customerId: input.customerId ?? null,
      amount: Math.max(0, Math.round(input.amount)),
      status: 'Redeemed'
    })
    .onConflictDoNothing()
}
