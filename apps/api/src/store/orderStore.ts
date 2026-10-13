import { and, desc, eq, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { orders as ordersTable, productVariants, type DbOrder } from '../db/schema.js'
import type { CalculatedOrder, Order } from '../schemas/order.js'

export type OrderAdminPatch = Partial<Pick<Order, 'status' | 'paymentStatus' | 'carrier' | 'trackingNumber'>>

function toOrder(row: DbOrder): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    store: row.store,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    address: row.address,
    apartment: row.apartment ?? undefined,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    notes: row.notes ?? undefined,
    items: row.items as Order['items'],
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    paymentStatus: row.paymentStatus as Order['paymentStatus'],
    handoffType: row.handoffType as Order['handoffType'],
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    adminNotes: row.adminNotes,
    events: row.events,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

class OrderStore {
  private memoryOrders: Order[] = []

  async list(): Promise<Order[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
      return rows.map(toOrder)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return [...this.memoryOrders].reverse()
  }

  async getById(id: number): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id))
      return row ? toOrder(row) : undefined
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.id === id)
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.orderNumber, orderNumber))
      return row ? toOrder(row) : undefined
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.orderNumber === orderNumber)
  }

  async create(input: CalculatedOrder): Promise<Order> {
    const createdAt = new Date()
    const status = input.handoffType === 'razorpay' ? 'Confirmed' : 'Pending'
    const paymentStatus = input.handoffType === 'razorpay' ? 'Paid' : 'Pending'
    const events = [{ id: `evt-${createdAt.getTime()}`, status, note: 'Customer order placed', at: createdAt.toISOString(), by: 'System' }]
    if (isDatabaseConfigured() && db) {
      const decremented: Array<{ variantId: number; quantity: number }> = []
      try {
        for (const item of input.items) {
          if (!item.variantId) throw new Error(`A saved product variant is required for ${item.name}.`)
          const [variant] = await db
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}`, updatedAt: createdAt })
            .where(and(
              eq(productVariants.id, item.variantId),
              sql`${productVariants.stock} - ${productVariants.reserved} >= ${item.quantity}`
            ))
            .returning({ id: productVariants.id })
          if (!variant) throw new Error(`Insufficient stock for ${item.name} (${item.size}).`)
          decremented.push({ variantId: item.variantId, quantity: item.quantity })
        }

        const [row] = await db
          .insert(ordersTable)
          .values({
            orderNumber: input.orderNumber,
            store: input.store || 'teesgarage',
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            address: input.address,
            apartment: input.apartment ?? null,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            notes: input.notes ?? null,
            items: input.items,
            subtotal: input.subtotal,
            shipping: input.shipping,
            total: input.total,
            status,
            paymentStatus,
            handoffType: input.handoffType,
            adminNotes: [],
            events
          })
          .returning()
        return toOrder(row)
      } catch (error) {
        for (const reserved of decremented.reverse()) {
          await db.update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${reserved.quantity}`, updatedAt: new Date() })
            .where(eq(productVariants.id, reserved.variantId))
        }
        throw error
      }
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const order: Order = {
      id: this.memoryOrders.length + 1,
      ...input,
      store: input.store || 'teesgarage',
      status,
      paymentStatus,
      carrier: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
      adminNotes: [],
      events,
      createdAt,
      updatedAt: createdAt
    }
    this.memoryOrders.push(order)
    return order
  }

  async updateAdmin(id: number, patch: OrderAdminPatch, author: string): Promise<Order | undefined> {
    const current = await this.getById(id)
    if (!current) return undefined
    const now = new Date()
    const statusChanged = patch.status !== undefined && patch.status !== current.status
    const events = statusChanged
      ? [...current.events, { id: `evt-${now.getTime()}`, status: patch.status!, note: `Status changed from ${current.status} to ${patch.status}`, at: now.toISOString(), by: author }]
      : current.events
    const values: Record<string, unknown> = { ...patch, events, updatedAt: now }
    if (patch.status === 'Shipped') values.shippedAt = now
    if (patch.status === 'Delivered') values.deliveredAt = now

    if (isDatabaseConfigured() && db) {
      const [row] = await db.update(ordersTable).set(values).where(eq(ordersTable.id, id)).returning()
      return row ? toOrder(row) : undefined
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const updated: Order = { ...current, ...patch, events, updatedAt: now,
      shippedAt: patch.status === 'Shipped' ? now : current.shippedAt,
      deliveredAt: patch.status === 'Delivered' ? now : current.deliveredAt }
    this.memoryOrders = this.memoryOrders.map((order) => order.id === id ? updated : order)
    return updated
  }

  async addAdminNote(id: number, text: string, author: string): Promise<Order | undefined> {
    const current = await this.getById(id)
    if (!current) return undefined
    const now = new Date()
    const note = { id: `note-${now.getTime()}`, text, at: now.toISOString(), by: author, internal: true }
    const adminNotes = [...current.adminNotes, note]
    if (isDatabaseConfigured() && db) {
      const [row] = await db.update(ordersTable).set({ adminNotes, updatedAt: now }).where(eq(ordersTable.id, id)).returning()
      return row ? toOrder(row) : undefined
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const updated = { ...current, adminNotes, updatedAt: now }
    this.memoryOrders = this.memoryOrders.map((order) => order.id === id ? updated : order)
    return updated
  }
}

export const orderStore = new OrderStore()
