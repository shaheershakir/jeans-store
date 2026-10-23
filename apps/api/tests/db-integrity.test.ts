import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { testDatabaseEnabled } from './setup-env.js'

/**
 * Integration tests against a disposable PostgreSQL database.
 *
 * They are skipped unless TEST_DATABASE_URL is set. setup-env.ts refuses to
 * point DATABASE_URL at the application database, so these tests can never
 * mutate the shared catalogue by accident.
 *
 * Prepare the database with the canonical migrations before running:
 *   TEST_DATABASE_URL=postgresql://... npm --workspace @jeans-store/api test
 */

let sequence = 0
function unique(prefix: string): string {
  sequence += 1
  return `${prefix}-${Date.now()}-${process.pid}-${sequence}`
}

const skip = testDatabaseEnabled ? false : 'Set TEST_DATABASE_URL to run database integration tests.'

describe('Database integrity (requires TEST_DATABASE_URL)', () => {
  after(() => {
    // Each test removes its own fixtures so a shared disposable database stays usable.
  })

  test('concurrent checkouts cannot oversell stock', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { reserveInventory, releaseReservations, ReservationUnavailableError } = await import('../src/services/inventory.js')
    const executor = db as unknown as import('../src/db/types.js').DbExecutor

    const suffix = unique('oversell')
    const category = await db.execute(sql`INSERT INTO categories (slug, name) VALUES (${suffix}, ${suffix}) RETURNING id`)
    const categoryId = Number((category.rows[0] as { id: number }).id)
    const product = await db.execute(sql`
      INSERT INTO products (category_id, slug, name, description, price, weight_grams)
      VALUES (${categoryId}, ${suffix}, ${'Oversell Tee'}, ${'Test fixture'}, ${999}, ${200})
      RETURNING id
    `)
    const productId = Number((product.rows[0] as { id: number }).id)
    const variant = await db.execute(sql`
      INSERT INTO product_variants (product_id, sku, size, color, stock, status)
      VALUES (${productId}, ${suffix}, ${'M'}, ${'Black'}, ${5}, ${'Active'})
      RETURNING id
    `)
    const variantId = Number((variant.rows[0] as { id: number }).id)

    try {
      const outcomes = await Promise.all(
        Array.from({ length: 10 }, async (_, index) => {
          try {
            await db.transaction(async (tx) => {
              await reserveInventory(tx as unknown as typeof executor, {
                gatewayOrderId: `${suffix}-gw-${index}`,
                reservationKeyPrefix: `${suffix}-res-${index}`,
                items: [{ productId, variantId, quantity: 1 }],
                ttlSeconds: 60
              })
            })
            return 'reserved' as const
          } catch (error) {
            if (error instanceof ReservationUnavailableError) return 'rejected' as const
            throw error
          }
        })
      )

      assert.equal(outcomes.filter((outcome) => outcome === 'reserved').length, 5)
      assert.equal(outcomes.filter((outcome) => outcome === 'rejected').length, 5)

      const afterReserve = await db.execute(sql`
        SELECT stock, reserved FROM product_variants WHERE id = ${variantId}
      `)
      assert.deepEqual(
        { stock: Number((afterReserve.rows[0] as { stock: number }).stock), reserved: Number((afterReserve.rows[0] as { reserved: number }).reserved) },
        { stock: 5, reserved: 5 }
      )

      for (let index = 0; index < 10; index += 1) {
        if (outcomes[index] === 'reserved') {
          await releaseReservations(executor, {
            gatewayOrderId: `${suffix}-gw-${index}`,
            reason: 'test cleanup'
          })
        }
      }

      const afterRelease = await db.execute(sql`
        SELECT stock, reserved FROM product_variants WHERE id = ${variantId}
      `)
      assert.deepEqual(
        { stock: Number((afterRelease.rows[0] as { stock: number }).stock), reserved: Number((afterRelease.rows[0] as { reserved: number }).reserved) },
        { stock: 5, reserved: 0 }
      )
    } finally {
      await db.execute(sql`DELETE FROM inventory_movements WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM inventory_reservations WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM product_variants WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM products WHERE id = ${productId}`)
      await db.execute(sql`DELETE FROM categories WHERE id = ${categoryId}`)
    }
  })

  test('confirming a reservation decrements both stock and reserved exactly once', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { reserveInventory, confirmReservations } = await import('../src/services/inventory.js')
    const executor = db as unknown as import('../src/db/types.js').DbExecutor

    const suffix = unique('confirm')
    const category = await db.execute(sql`INSERT INTO categories (slug, name) VALUES (${suffix}, ${suffix}) RETURNING id`)
    const categoryId = Number((category.rows[0] as { id: number }).id)
    const product = await db.execute(sql`
      INSERT INTO products (category_id, slug, name, description, price, weight_grams)
      VALUES (${categoryId}, ${suffix}, ${'Confirm Tee'}, ${'Test fixture'}, ${999}, ${200})
      RETURNING id
    `)
    const productId = Number((product.rows[0] as { id: number }).id)
    const variant = await db.execute(sql`
      INSERT INTO product_variants (product_id, sku, size, color, stock, status)
      VALUES (${productId}, ${suffix}, ${'M'}, ${'Black'}, ${5}, ${'Active'})
      RETURNING id
    `)
    const variantId = Number((variant.rows[0] as { id: number }).id)

    try {
      await reserveInventory(executor, {
        gatewayOrderId: `${suffix}-gw`,
        reservationKeyPrefix: `${suffix}-res`,
        items: [{ productId, variantId, quantity: 2 }],
        ttlSeconds: 60
      })

      const first = await confirmReservations(executor, { gatewayOrderId: `${suffix}-gw` })
      const second = await confirmReservations(executor, { gatewayOrderId: `${suffix}-gw` })

      assert.equal(first, 1)
      assert.equal(second, 0, 'confirming twice must not decrement stock twice')

      const row = await db.execute(sql`SELECT stock, reserved FROM product_variants WHERE id = ${variantId}`)
      assert.deepEqual(
        { stock: Number((row.rows[0] as { stock: number }).stock), reserved: Number((row.rows[0] as { reserved: number }).reserved) },
        { stock: 3, reserved: 0 }
      )
    } finally {
      await db.execute(sql`DELETE FROM inventory_movements WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM inventory_reservations WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM product_variants WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM products WHERE id = ${productId}`)
      await db.execute(sql`DELETE FROM categories WHERE id = ${categoryId}`)
    }
  })

  test('cancelling a pending hold does not inflate stock, while a confirmed sale restocks once', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const {
      reserveInventory,
      confirmReservations,
      releaseReservations,
      restockOrder
    } = await import('../src/services/inventory.js')
    const executor = db as unknown as import('../src/db/types.js').DbExecutor

    const suffix = unique('restock')
    const category = await db.execute(sql`INSERT INTO categories (slug, name) VALUES (${suffix}, ${suffix}) RETURNING id`)
    const categoryId = Number((category.rows[0] as { id: number }).id)
    const product = await db.execute(sql`
      INSERT INTO products (category_id, slug, name, description, price, weight_grams)
      VALUES (${categoryId}, ${suffix}, ${'Restock Tee'}, ${'Test fixture'}, ${999}, ${200})
      RETURNING id
    `)
    const productId = Number((product.rows[0] as { id: number }).id)
    const variant = await db.execute(sql`
      INSERT INTO product_variants (product_id, sku, size, color, stock, status)
      VALUES (${productId}, ${suffix}, ${'M'}, ${'Black'}, ${5}, ${'Active'})
      RETURNING id
    `)
    const variantId = Number((variant.rows[0] as { id: number }).id)
    const customer = await db.execute(sql`
      INSERT INTO customers (name, email) VALUES (${'Restock Test'}, ${`${suffix}@example.test`}) RETURNING id
    `)
    const customerId = Number((customer.rows[0] as { id: number }).id)
    const order = await db.execute(sql`
      INSERT INTO orders
        (order_number, customer_id, customer_name, customer_phone, customer_email,
         address, city, state, pincode, subtotal, shipping, total)
      VALUES
        (${suffix}, ${customerId}, ${'Restock Test'}, ${'9999999999'}, ${`${suffix}@example.test`},
         ${'1 Test Street'}, ${'Mumbai'}, ${'Maharashtra'}, ${'400050'}, ${1998}, ${0}, ${1998})
      RETURNING id
    `)
    const orderId = Number((order.rows[0] as { id: number }).id)
    await db.execute(sql`
      INSERT INTO order_items (order_id, product_id, variant_id, name, size, unit_price, quantity, line_total, taxable_amount)
      VALUES (${orderId}, ${productId}, ${variantId}, ${'Restock Tee'}, ${'M'}, ${999}, ${2}, ${1998}, ${1998})
    `)

    try {
      await reserveInventory(executor, {
        orderId,
        reservationKeyPrefix: `${suffix}-pending`,
        items: [{ productId, variantId, quantity: 2 }],
        ttlSeconds: 60
      })
      await releaseReservations(executor, { orderId, reason: 'pending cancel' })
      assert.equal(await restockOrder(executor, orderId, 'pending cancel'), 0)

      let row = await db.execute(sql`SELECT stock, reserved FROM product_variants WHERE id = ${variantId}`)
      assert.deepEqual(
        { stock: Number((row.rows[0] as { stock: number }).stock), reserved: Number((row.rows[0] as { reserved: number }).reserved) },
        { stock: 5, reserved: 0 },
        'releasing a hold must not add stock'
      )

      await reserveInventory(executor, {
        orderId,
        reservationKeyPrefix: `${suffix}-confirmed`,
        items: [{ productId, variantId, quantity: 2 }],
        ttlSeconds: 60
      })
      await confirmReservations(executor, { orderId })

      row = await db.execute(sql`SELECT stock, reserved FROM product_variants WHERE id = ${variantId}`)
      assert.deepEqual(
        { stock: Number((row.rows[0] as { stock: number }).stock), reserved: Number((row.rows[0] as { reserved: number }).reserved) },
        { stock: 3, reserved: 0 }
      )

      assert.equal(await restockOrder(executor, orderId, 'confirmed cancel'), 1)
      assert.equal(await restockOrder(executor, orderId, 'confirmed cancel'), 0, 'restocking is idempotent')

      row = await db.execute(sql`SELECT stock, reserved FROM product_variants WHERE id = ${variantId}`)
      assert.deepEqual(
        { stock: Number((row.rows[0] as { stock: number }).stock), reserved: Number((row.rows[0] as { reserved: number }).reserved) },
        { stock: 5, reserved: 0 }
      )
    } finally {
      await db.execute(sql`DELETE FROM order_items WHERE order_id = ${orderId}`)
      await db.execute(sql`DELETE FROM inventory_movements WHERE order_id = ${orderId}`)
      await db.execute(sql`DELETE FROM inventory_reservations WHERE order_id = ${orderId}`)
      await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`)
      await db.execute(sql`DELETE FROM customers WHERE id = ${customerId}`)
      await db.execute(sql`DELETE FROM product_variants WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM products WHERE id = ${productId}`)
      await db.execute(sql`DELETE FROM categories WHERE id = ${categoryId}`)
    }
  })

  test('duplicate Razorpay webhooks are recorded and applied once', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { processRazorpayWebhook } = await import('../src/services/payments.js')

    const suffix = unique('webhook')
    const gatewayOrderId = `${suffix}-order`
    const eventId = `${suffix}-event`

    await db.execute(sql`
      INSERT INTO payments (order_number, amount, currency, gateway, gateway_order_id, method, status)
      VALUES (${suffix}, ${500}, ${'INR'}, ${'razorpay'}, ${gatewayOrderId}, ${'Razorpay'}, ${'Pending'})
    `)

    try {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: { entity: { id: `${suffix}-pay`, order_id: gatewayOrderId, amount: 50000 } }
        }
      }

      const first = await processRazorpayWebhook(payload, { eventId, eventType: 'payment.captured' })
      const second = await processRazorpayWebhook(payload, { eventId, eventType: 'payment.captured' })

      assert.equal(first.duplicate, false)
      assert.equal(first.status, 'Unmatched', 'captured money without an order is retained for reconciliation')
      assert.equal(second.duplicate, true)
      assert.equal(second.status, 'Unmatched')

      const events = await db.execute(sql`
        SELECT count(*)::int AS count, min(attempts)::int AS attempts
        FROM payment_events WHERE provider = 'razorpay' AND event_id = ${eventId}
      `)
      assert.deepEqual(
        {
          count: Number((events.rows[0] as { count: number }).count),
          attempts: Number((events.rows[0] as { attempts: number }).attempts)
        },
        { count: 1, attempts: 1 }
      )

      const payment = await db.execute(sql`
        SELECT status FROM payments WHERE gateway = 'razorpay' AND gateway_order_id = ${gatewayOrderId}
      `)
      assert.equal(String((payment.rows[0] as { status: string }).status), 'Paid')
    } finally {
      await db.execute(sql`DELETE FROM payment_events WHERE provider = 'razorpay' AND event_id = ${eventId}`)
      await db.execute(sql`DELETE FROM payments WHERE gateway = 'razorpay' AND gateway_order_id = ${gatewayOrderId}`)
    }
  })

  test('a usage-limited coupon cannot be redeemed twice concurrently', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { resolveCoupon, recordCouponRedemption, CouponError } = await import('../src/services/coupon.js')
    const executor = db as unknown as import('../src/db/types.js').DbExecutor

    const suffix = unique('coupon')
    const code = `${suffix}-code`
    const coupon = await db.execute(sql`
      INSERT INTO coupons (code, type, value, usage_limit, per_customer_limit)
      VALUES (${code}, ${'fixed'}, ${100}, ${1}, ${1})
      RETURNING id
    `)
    const couponId = Number((coupon.rows[0] as { id: number }).id)
    const customer = await db.execute(sql`
      INSERT INTO customers (name, email) VALUES (${'Coupon Test'}, ${`${suffix}@example.test`}) RETURNING id
    `)
    const customerId = Number((customer.rows[0] as { id: number }).id)

    const orderIds: number[] = []
    try {
      for (let index = 0; index < 2; index += 1) {
        const order = await db.execute(sql`
          INSERT INTO orders
            (order_number, customer_id, customer_name, customer_phone, customer_email,
             address, city, state, pincode, subtotal, shipping, total)
          VALUES
            (${`${suffix}-${index}`}, ${customerId}, ${'Coupon Test'}, ${'9999999999'},
             ${`${suffix}@example.test`}, ${'1 Test Street'}, ${'Mumbai'}, ${'Maharashtra'},
             ${'400050'}, ${1000}, ${0}, ${1000})
          RETURNING id
        `)
        orderIds.push(Number((order.rows[0] as { id: number }).id))
      }

      const attempts = await Promise.all(
        orderIds.map(async (orderId, index) => {
          try {
            await db.transaction(async (tx) => {
              const txExecutor = tx as unknown as typeof executor
              const resolved = await resolveCoupon(txExecutor, {
                code: code.toUpperCase(),
                customerId: null,
                items: [{ productId: index + 1, lineTotal: 1000 }],
                subtotal: 1000,
                forUpdate: true
              })
              await recordCouponRedemption(txExecutor, {
                couponId: resolved.coupon.id,
                orderId,
                amount: resolved.discount
              })
            })
            return 'redeemed' as const
          } catch (error) {
            if (error instanceof CouponError && error.statusCode === 409) return 'limited' as const
            throw error
          }
        })
      )

      assert.deepEqual(attempts.sort(), ['limited', 'redeemed'])
      const redemptions = await db.execute(sql`
        SELECT count(*)::int AS count FROM coupon_redemptions WHERE coupon_id = ${couponId}
      `)
      assert.equal(Number((redemptions.rows[0] as { count: number }).count), 1)
    } finally {
      await db.execute(sql`DELETE FROM coupon_redemptions WHERE coupon_id = ${couponId}`)
      for (const orderId of orderIds) await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`)
      await db.execute(sql`DELETE FROM customers WHERE id = ${customerId}`)
      await db.execute(sql`DELETE FROM coupons WHERE id = ${couponId}`)
    }
  })

  test('refunds cannot exceed the captured payment amount', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { createRefund, RefundError } = await import('../src/services/refunds.js')

    const suffix = unique('refund')
    const customer = await db.execute(sql`
      INSERT INTO customers (name, email) VALUES (${'Refund Test'}, ${`${suffix}@example.test`}) RETURNING id
    `)
    const customerId = Number((customer.rows[0] as { id: number }).id)
    const order = await db.execute(sql`
      INSERT INTO orders
        (order_number, customer_id, customer_name, customer_phone, customer_email,
         address, city, state, pincode, subtotal, shipping, total, payment_status, status)
      VALUES
        (${suffix}, ${customerId}, ${'Refund Test'}, ${'9999999999'}, ${`${suffix}@example.test`},
         ${'1 Test Street'}, ${'Mumbai'}, ${'Maharashtra'}, ${'400050'}, ${500}, ${0}, ${500},
         ${'Paid'}, ${'Confirmed'})
      RETURNING id
    `)
    const orderId = Number((order.rows[0] as { id: number }).id)
    const payment = await db.execute(sql`
      INSERT INTO payments (order_id, order_number, amount, currency, gateway, method, status, gateway_payment_id)
      VALUES (${orderId}, ${suffix}, ${500}, ${'INR'}, ${'razorpay'}, ${'Razorpay'}, ${'Paid'}, ${`${suffix}-pay`})
      RETURNING id
    `)
    const paymentId = Number((payment.rows[0] as { id: number }).id)

    try {
      const first = await createRefund({ orderId, amount: 400, reason: 'test' })
      assert.equal(first.amount, 400)

      await assert.rejects(
        () => createRefund({ orderId, amount: 200, reason: 'over limit' }),
        (error: unknown) => error instanceof RefundError && error.statusCode === 409
      )

      const idempotent = await createRefund({ orderId, amount: 100, idempotencyKey: `${suffix}-key` })
      const replay = await createRefund({ orderId, amount: 100, idempotencyKey: `${suffix}-key` })
      assert.equal(replay.id, idempotent.id, 'replayed refund creation returns the original row')

      const refunded = await db.execute(sql`SELECT amount_refunded FROM payments WHERE id = ${paymentId}`)
      assert.equal(Number((refunded.rows[0] as { amount_refunded: number }).amount_refunded), 0)
    } finally {
      await db.execute(sql`DELETE FROM refunds WHERE order_id = ${orderId}`)
      await db.execute(sql`DELETE FROM order_events WHERE order_id = ${orderId}`)
      await db.execute(sql`DELETE FROM payments WHERE id = ${paymentId}`)
      await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`)
      await db.execute(sql`DELETE FROM customers WHERE id = ${customerId}`)
    }
  })

  test('server re-reads catalog prices and preserves historical item snapshots', { skip }, async () => {
    const { db } = await import('@jeans-store/db')
    const { sql } = await import('drizzle-orm')
    const { orderStore } = await import('../src/store/orderStore.js')

    const suffix = unique('price')
    const category = await db.execute(
      sql`INSERT INTO categories (slug, name) VALUES (${suffix}, ${suffix}) RETURNING id`
    )
    const categoryId = Number((category.rows[0] as { id: number }).id)
    const product = await db.execute(sql`
      INSERT INTO products (category_id, slug, name, description, price, tax_rate, weight_grams, status)
      VALUES (${categoryId}, ${suffix}, ${'Price Snapshot Tee'}, ${'Test fixture'}, ${1500}, ${0.05}, ${200}, ${'active'})
      RETURNING id
    `)
    const productId = Number((product.rows[0] as { id: number }).id)
    const variant = await db.execute(sql`
      INSERT INTO product_variants (product_id, sku, size, color, stock, status)
      VALUES (${productId}, ${suffix}, ${'M'}, ${'Black'}, ${5}, ${'Active'})
      RETURNING id
    `)
    const variantId = Number((variant.rows[0] as { id: number }).id)
    let orderId: number | null = null
    let customerId: number | null = null

    try {
      const created = await orderStore.create({
        orderNumber: suffix,
        customerName: 'Price Snapshot Test',
        customerPhone: '9999999999',
        customerEmail: `${suffix}@example.test`,
        address: '1 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        handoffType: 'cod',
        items: [
          {
            id: productId,
            variantId,
            name: 'Tampered name',
            size: 'M',
            price: '₹1',
            priceNum: 1,
            quantity: 1,
            lineTotal: 1,
            taxRate: 0,
            taxAmount: 0,
            discountAmount: 0,
            taxableAmount: 1,
            variantLabel: 'Black / M',
            isFreeSize: false
          }
        ],
        subtotal: 1,
        discountTotal: 0,
        shipping: 0,
        taxTotal: 0,
        total: 1
      })

      orderId = created.id
      assert.equal(created.items[0].priceNum, 1500, 'catalog price replaces the tampered browser price')
      assert.equal(created.items[0].lineTotal, 1500)
      assert.equal(created.total, 1575, 'total is rebuilt from catalog price and catalog tax rate')

      const customer = await db.execute(sql`SELECT customer_id FROM orders WHERE id = ${orderId}`)
      customerId = Number((customer.rows[0] as { customer_id: number }).customer_id)

      await db.execute(sql`UPDATE products SET price = ${2000} WHERE id = ${productId}`)
      const reloaded = await orderStore.getById(orderId)
      assert.equal(reloaded?.items[0].priceNum, 1500, 'historical order items keep their snapshot price')
      assert.equal(reloaded?.total, 1575)
    } finally {
      if (orderId !== null) {
        await db.execute(sql`DELETE FROM inventory_movements WHERE order_id = ${orderId}`)
        await db.execute(sql`DELETE FROM inventory_reservations WHERE order_id = ${orderId}`)
        await db.execute(sql`DELETE FROM order_items WHERE order_id = ${orderId}`)
        await db.execute(sql`DELETE FROM order_events WHERE order_id = ${orderId}`)
        await db.execute(sql`DELETE FROM payments WHERE order_id = ${orderId}`)
        await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`)
      }
      if (customerId !== null) {
        await db.execute(sql`DELETE FROM customer_addresses WHERE customer_id = ${customerId}`)
        await db.execute(sql`DELETE FROM customers WHERE id = ${customerId}`)
      }
      await db.execute(sql`DELETE FROM product_variants WHERE product_id = ${productId}`)
      await db.execute(sql`DELETE FROM products WHERE id = ${productId}`)
      await db.execute(sql`DELETE FROM categories WHERE id = ${categoryId}`)
    }
  })
})
