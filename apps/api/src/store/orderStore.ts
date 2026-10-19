import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  orders as ordersTable,
  productVariants,
  orderItems as orderItemsTable,
  orderEvents as orderEventsTable,
  type DbOrder,
  type DbOrderItem,
  type DbOrderEvent
} from '../db/schema.js'
import type { CalculatedOrder, Order } from '../schemas/order.js'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'

export type OrderAdminPatch = Partial<Pick<Order, 'status' | 'paymentStatus' | 'carrier' | 'trackingNumber'>>

function toOrder(row: DbOrder, itemsRows?: DbOrderItem[], eventRows?: DbOrderEvent[]): Order {
  let items: Order['items'] = (row.items as Order['items']) || []
  if (itemsRows && itemsRows.length > 0) {
    items = itemsRows.map((it) => ({
      id: it.productId ?? 0,
      variantId: it.variantId ?? undefined,
      name: it.name,
      fit: it.fit ?? undefined,
      size: it.size,
      price: `₹${it.unitPrice.toLocaleString('en-IN')}`,
      priceNum: it.unitPrice,
      sku: it.sku ?? undefined,
      quantity: it.quantity,
      img: it.imageKey ? assetUrl(it.imageKey) : (it.imageUrl ?? undefined)
    }))
  }

  let events = row.events || []
  let adminNotes = row.adminNotes || []

  if (eventRows && eventRows.length > 0) {
    const statusEvents = eventRows
      .filter((e) => e.kind === 'status')
      .map((e) => ({
        id: String(e.id),
        status: e.status || '',
        note: e.note || '',
        at: e.createdAt.toISOString(),
        by: e.actor || 'System'
      }))
    if (statusEvents.length > 0) {
      events = statusEvents
    }

    const noteEvents = eventRows
      .filter((e) => e.kind === 'note')
      .map((e) => ({
        id: String(e.id),
        text: e.note || '',
        at: e.createdAt.toISOString(),
        by: e.actor || 'Admin',
        internal: e.isInternal
      }))
    if (noteEvents.length > 0) {
      adminNotes = noteEvents
    }
  }

  return {
    id: row.id,
    userId: row.userId ?? undefined,
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
    items,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    paymentStatus: row.paymentStatus as Order['paymentStatus'],
    handoffType: row.handoffType as Order['handoffType'],
    razorpayOrderId: row.razorpayOrderId ?? undefined,
    razorpayPaymentId: row.razorpayPaymentId ?? undefined,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    adminNotes,
    events,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

class OrderStore {
  private memoryOrders: Order[] = []
  private memoryOrderItems: Map<number, DbOrderItem[]> = new Map()
  private memoryOrderEvents: Map<number, DbOrderEvent[]> = new Map()

  private async hydrateOrders(orderRows: DbOrder[]): Promise<Order[]> {
    if (orderRows.length === 0) return []
    if (!isDatabaseConfigured() || !db) {
      return orderRows.map((r) =>
        toOrder(r, this.memoryOrderItems.get(r.id), this.memoryOrderEvents.get(r.id))
      )
    }

    const orderIds = orderRows.map((r) => r.id)
    const [allItems, allEvents] = await Promise.all([
      db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds)),
      db
        .select()
        .from(orderEventsTable)
        .where(inArray(orderEventsTable.orderId, orderIds))
        .orderBy(orderEventsTable.createdAt)
    ])

    const itemsByOrder = new Map<number, DbOrderItem[]>()
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) || []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }

    const eventsByOrder = new Map<number, DbOrderEvent[]>()
    for (const event of allEvents) {
      const list = eventsByOrder.get(event.orderId) || []
      list.push(event)
      eventsByOrder.set(event.orderId, list)
    }

    return orderRows.map((r) => toOrder(r, itemsByOrder.get(r.id), eventsByOrder.get(r.id)))
  }

  async list(): Promise<Order[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
      return this.hydrateOrders(rows)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return [...this.memoryOrders].reverse()
  }

  async listByCustomerEmail(email: string): Promise<Order[]> {
    const normalizedEmail = email.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const rows = await db
        .select()
        .from(ordersTable)
        .where(sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}`)
        .orderBy(desc(ordersTable.createdAt))
      return this.hydrateOrders(rows)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders
      .filter((order) => order.customerEmail.trim().toLowerCase() === normalizedEmail)
      .reverse()
  }

  async listByUserId(userId: number, fallbackEmail?: string): Promise<Order[]> {
    const normalizedEmail = fallbackEmail?.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const condition = normalizedEmail
        ? or(eq(ordersTable.userId, userId), sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}`)
        : eq(ordersTable.userId, userId)
      const rows = await db
        .select()
        .from(ordersTable)
        .where(condition)
        .orderBy(desc(ordersTable.createdAt))
      return this.hydrateOrders(rows)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders
      .filter((order) => order.userId === userId || (normalizedEmail && order.customerEmail.trim().toLowerCase() === normalizedEmail))
      .reverse()
  }

  async getById(id: number): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id))
      if (!row) return undefined
      const [items, events] = await Promise.all([
        db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)),
        db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId, id)).orderBy(orderEventsTable.createdAt)
      ])
      return toOrder(row, items, events)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.id === id)
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.orderNumber, orderNumber))
      if (!row) return undefined
      const [items, events] = await Promise.all([
        db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, row.id)),
        db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId, row.id)).orderBy(orderEventsTable.createdAt)
      ])
      return toOrder(row, items, events)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.orderNumber === orderNumber)
  }

  async create(input: CalculatedOrder & { userId?: number }): Promise<Order> {
    const createdAt = new Date()
    const status = input.handoffType === 'razorpay' ? 'Confirmed' : 'Pending'
    const paymentStatus = input.handoffType === 'razorpay' ? 'Paid' : 'Pending'
    const events = [{ id: `evt-${createdAt.getTime()}`, status, note: 'Customer order placed', at: createdAt.toISOString(), by: 'System' }]

    if (isDatabaseConfigured() && db) {
      const decremented: Array<{ variantId: number; quantity: number }> = []
      let createdOrderId: number | null = null

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
            userId: input.userId ?? null,
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
            razorpayOrderId: input.razorpayOrderId ?? null,
            razorpayPaymentId: input.razorpayPaymentId ?? null,
            adminNotes: [],
            events
          })
          .returning()

        createdOrderId = row.id

        // Dual-write to order_items
        const createdItems: DbOrderItem[] = []
        for (const item of input.items) {
          const imageKey = item.img ? keyFromUrl(item.img) : null
          const imageUrl = (!imageKey && item.img && item.img.startsWith('http')) ? item.img : null
          const [createdItem] = await db
            .insert(orderItemsTable)
            .values({
              orderId: row.id,
              productId: item.id || null,
              variantId: item.variantId || null,
              sku: item.sku ?? null,
              name: item.name,
              fit: item.fit ?? null,
              size: item.size,
              color: (item as any).color ?? null,
              unitPrice: item.priceNum,
              quantity: item.quantity,
              imageKey,
              imageUrl
            })
            .returning()
          if (createdItem) createdItems.push(createdItem)
        }

        // Dual-write to order_events
        const [createdEvent] = await db
          .insert(orderEventsTable)
          .values({
            orderId: row.id,
            kind: 'status',
            status,
            note: 'Customer order placed',
            isInternal: false,
            actor: 'System',
            createdAt
          })
          .returning()

        return toOrder(row, createdItems, createdEvent ? [createdEvent] : [])
      } catch (error) {
        if (createdOrderId) {
          await db.delete(ordersTable).where(eq(ordersTable.id, createdOrderId)).catch(() => {})
        }
        for (const reserved of decremented.reverse()) {
          await db.update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${reserved.quantity}`, updatedAt: new Date() })
            .where(eq(productVariants.id, reserved.variantId))
        }
        throw error
      }
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const orderId = this.memoryOrders.length + 1
    const order: Order = {
      id: orderId,
      userId: input.userId ?? undefined,
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

    const memoryItems: DbOrderItem[] = input.items.map((it, idx) => {
      const imageKey = it.img ? keyFromUrl(it.img) : null
      const imageUrl = (!imageKey && it.img && it.img.startsWith('http')) ? it.img : null
      return {
        id: idx + 1,
        orderId,
        productId: it.id || null,
        variantId: it.variantId || null,
        sku: it.sku ?? null,
        name: it.name,
        fit: it.fit ?? null,
        size: it.size,
        color: (it as any).color ?? null,
        unitPrice: it.priceNum,
        quantity: it.quantity,
        imageKey,
        imageUrl
      }
    })
    this.memoryOrderItems.set(orderId, memoryItems)

    const memoryEvents: DbOrderEvent[] = [
      {
        id: 1,
        orderId,
        kind: 'status',
        status,
        note: 'Customer order placed',
        isInternal: false,
        actor: 'System',
        createdAt
      }
    ]
    this.memoryOrderEvents.set(orderId, memoryEvents)

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
      if (statusChanged) {
        await db.insert(orderEventsTable).values({
          orderId: id,
          kind: 'status',
          status: patch.status!,
          note: `Status changed from ${current.status} to ${patch.status}`,
          isInternal: false,
          actor: author,
          createdAt: now
        })
      }

      const [row] = await db.update(ordersTable).set(values).where(eq(ordersTable.id, id)).returning()
      if (!row) return undefined

      const [items, eventRows] = await Promise.all([
        db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)),
        db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId, id)).orderBy(orderEventsTable.createdAt)
      ])
      return toOrder(row, items, eventRows)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    if (statusChanged) {
      const existingEvents = this.memoryOrderEvents.get(id) || []
      existingEvents.push({
        id: existingEvents.length + 1,
        orderId: id,
        kind: 'status',
        status: patch.status!,
        note: `Status changed from ${current.status} to ${patch.status}`,
        isInternal: false,
        actor: author,
        createdAt: now
      })
      this.memoryOrderEvents.set(id, existingEvents)
    }

    const updated: Order = {
      ...current,
      ...patch,
      events,
      updatedAt: now,
      shippedAt: patch.status === 'Shipped' ? now : current.shippedAt,
      deliveredAt: patch.status === 'Delivered' ? now : current.deliveredAt
    }
    this.memoryOrders = this.memoryOrders.map((order) => (order.id === id ? updated : order))
    return updated
  }

  async addAdminNote(id: number, text: string, author: string): Promise<Order | undefined> {
    const current = await this.getById(id)
    if (!current) return undefined
    const now = new Date()
    const note = { id: `note-${now.getTime()}`, text, at: now.toISOString(), by: author, internal: true }
    const adminNotes = [...current.adminNotes, note]

    if (isDatabaseConfigured() && db) {
      await db.insert(orderEventsTable).values({
        orderId: id,
        kind: 'note',
        note: text,
        isInternal: true,
        actor: author,
        createdAt: now
      })

      const [row] = await db.update(ordersTable).set({ adminNotes, updatedAt: now }).where(eq(ordersTable.id, id)).returning()
      if (!row) return undefined

      const [items, eventRows] = await Promise.all([
        db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id)),
        db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId, id)).orderBy(orderEventsTable.createdAt)
      ])
      return toOrder(row, items, eventRows)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const existingEvents = this.memoryOrderEvents.get(id) || []
    existingEvents.push({
      id: existingEvents.length + 1,
      orderId: id,
      kind: 'note',
      status: null,
      note: text,
      isInternal: true,
      actor: author,
      createdAt: now
    })
    this.memoryOrderEvents.set(id, existingEvents)

    const updated = { ...current, adminNotes, updatedAt: now }
    this.memoryOrders = this.memoryOrders.map((order) => (order.id === id ? updated : order))
    return updated
  }
}

export const orderStore = new OrderStore()
