import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  customers as customersTable,
  customerAddresses as customerAddressesTable,
  orderEvents as orderEventsTable,
  orderItems as orderItemsTable,
  orders as ordersTable,
  payments as paymentsTable,
  productVariants,
  shipments as shipmentsTable,
  type DbCustomer,
  type DbOrder,
  type DbOrderEvent,
  type DbOrderItem,
  type DbPayment,
  type DbShipment
} from '@jeans-store/db'
import type { CalculatedOrder, Order } from '../schemas/order.js'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'

export type OrderAdminPatch = Partial<Pick<Order, 'status' | 'paymentStatus' | 'carrier' | 'trackingNumber'>>

function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

function toOrder(
  row: DbOrder,
  itemsRows: DbOrderItem[] = [],
  eventRows: DbOrderEvent[] = [],
  shipment?: DbShipment,
  payment?: DbPayment,
  customer?: DbCustomer
): Order {
  const items: Order['items'] = itemsRows.map((item) => ({
    id: item.productId ?? 0,
    variantId: item.variantId ?? undefined,
    name: item.name,
    size: item.size,
    price: formatPrice(item.unitPrice),
    priceNum: item.unitPrice,
    sku: item.sku ?? undefined,
    quantity: item.quantity,
    weightGrams: item.weightGrams,
    img: item.imageKey ? assetUrl(item.imageKey) : ((item as any).imageUrl ?? undefined)
  }))

  const events = eventRows
    .filter((event) => event.kind === 'status')
    .map((event) => ({
      id: String(event.id),
      status: event.status || '',
      note: event.note || '',
      at: event.createdAt.toISOString(),
      by: event.actorName || 'System'
    }))

  const adminNotes = eventRows
    .filter((event) => event.kind === 'note')
    .map((event) => ({
      id: String(event.id),
      text: event.note || '',
      at: event.createdAt.toISOString(),
      by: event.actorName || 'Admin',
      internal: event.isInternal
    }))

  return {
    id: row.id,
    userId: customer?.userId ?? undefined,
    orderNumber: row.orderNumber,
    store: 'teesgarage',
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
    couponCode: (row as any).couponCode ?? undefined,
    status: row.status,
    paymentStatus: row.paymentStatus as Order['paymentStatus'],
    handoffType: row.handoffType as Order['handoffType'],
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
    updatedAt: row.updatedAt
  }
}

class OrderStore {
  private memoryOrders: Order[] = []

  private async hydrateOrders(orderRows: DbOrder[]): Promise<Order[]> {
    if (orderRows.length === 0) return []
    const orderIds = orderRows.map((row) => row.id)
    const customerIds = [...new Set(orderRows.map((row) => row.customerId))]

    const [allItems, allEvents, allShipments, allPayments, allCustomers] = await Promise.all([
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
      db!.select().from(customersTable).where(inArray(customersTable.id, customerIds))
    ])

    const itemsByOrder = new Map<number, DbOrderItem[]>()
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }
    const eventsByOrder = new Map<number, DbOrderEvent[]>()
    for (const event of allEvents) {
      const list = eventsByOrder.get(event.orderId) ?? []
      list.push(event)
      eventsByOrder.set(event.orderId, list)
    }
    const shipmentByOrder = new Map<number, DbShipment>()
    for (const shipment of allShipments) {
      if (!shipmentByOrder.has(shipment.orderId)) shipmentByOrder.set(shipment.orderId, shipment)
    }
    const paymentByOrder = new Map<number, DbPayment>()
    for (const payment of allPayments) {
      if (!paymentByOrder.has(payment.orderId)) paymentByOrder.set(payment.orderId, payment)
    }
    const customerById = new Map<number, DbCustomer>(allCustomers.map((customer) => [customer.id, customer]))

    return orderRows.map((row) =>
      toOrder(
        row,
        itemsByOrder.get(row.id),
        eventsByOrder.get(row.id),
        shipmentByOrder.get(row.id),
        paymentByOrder.get(row.id),
        customerById.get(row.customerId)
      )
    )
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
      const customerRows = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(
          normalizedEmail
            ? or(eq(customersTable.userId, userId), sql`lower(${customersTable.email}) = ${normalizedEmail}`)
            : eq(customersTable.userId, userId)
        )
      const customerIds = customerRows.map((row) => row.id)
      const condition = customerIds.length > 0
        ? or(
            inArray(ordersTable.customerId, customerIds),
            normalizedEmail ? sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail}` : sql`1=0`
          )
        : sql`lower(${ordersTable.customerEmail}) = ${normalizedEmail ?? ''}`
      const rows = await db
        .select()
        .from(ordersTable)
        .where(condition)
        .orderBy(desc(ordersTable.createdAt))
      return this.hydrateOrders(rows)
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders
      .filter(
        (order) =>
          order.userId === userId ||
          (normalizedEmail && order.customerEmail.trim().toLowerCase() === normalizedEmail)
      )
      .reverse()
  }

  async getById(id: number): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id))
      if (!row) return undefined
      return (await this.hydrateOrders([row]))[0]
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.id === id)
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.orderNumber, orderNumber))
      if (!row) return undefined
      return (await this.hydrateOrders([row]))[0]
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    return this.memoryOrders.find((order) => order.orderNumber === orderNumber)
  }

  private async upsertCustomer(input: CalculatedOrder & { userId?: number }): Promise<number> {
    const email = input.customerEmail.trim().toLowerCase()
    let existing: typeof customersTable.$inferSelect | undefined

    if (input.userId) {
      ;[existing] = await db!
        .select()
        .from(customersTable)
        .where(eq(customersTable.userId, input.userId))
    }

    if (!existing) {
      const [byEmail] = await db!
        .select()
        .from(customersTable)
        .where(sql`lower(${customersTable.email}) = ${email}`)
      if (byEmail) {
        if (input.userId && byEmail.userId && byEmail.userId !== input.userId) {
          throw new Error('This email is already linked to another customer account.')
        }
        existing = byEmail
      }
    }

    let customerId: number
    if (existing) {
      customerId = existing.id
      await db!
        .update(customersTable)
        .set({
          name: input.customerName,
          phone: input.customerPhone,
          userId: input.userId ?? existing.userId,
          updatedAt: new Date()
        })
        .where(eq(customersTable.id, existing.id))
    } else {
      const [created] = await db!
        .insert(customersTable)
        .values({
          userId: input.userId ?? null,
          name: input.customerName,
          email,
          phone: input.customerPhone
        })
        .returning({ id: customersTable.id })
      customerId = created.id
    }

    const [existingAddress] = await db!
      .select({ id: customerAddressesTable.id })
      .from(customerAddressesTable)
      .where(eq(customerAddressesTable.customerId, customerId))

    if (!existingAddress) {
      await db!.insert(customerAddressesTable).values({
        customerId,
        label: 'Home',
        line1: input.address,
        line2: input.apartment ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        phone: input.customerPhone,
        isDefault: true
      })
    }

    return customerId
  }

  async create(input: CalculatedOrder & { userId?: number }): Promise<Order> {
    const createdAt = new Date()
    const status = input.handoffType === 'razorpay' ? 'Confirmed' : 'Pending'
    const paymentStatus = input.handoffType === 'razorpay' ? 'Paid' : 'Pending'
    const orderWeight = Number((input as { weightGrams?: number }).weightGrams ?? 0)

    if (isDatabaseConfigured() && db) {
      const decremented: Array<{ variantId: number; quantity: number }> = []
      let createdOrderId: number | null = null

      try {
        for (const item of input.items) {
          if (!item.variantId) throw new Error(`A saved product variant is required for ${item.name}.`)
          const [variant] = await db
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}`, updatedAt: createdAt })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} - ${productVariants.reserved} >= ${item.quantity}`
              )
            )
            .returning({ id: productVariants.id })
          if (!variant) throw new Error(`Insufficient stock for ${item.name} (${item.size}).`)
          decremented.push({ variantId: item.variantId, quantity: item.quantity })
        }

        const customerId = await this.upsertCustomer(input)

        const [row] = await db
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
            subtotal: input.subtotal,
            discountTotal: (input as { discountTotal?: number }).discountTotal ?? 0,
            shipping: input.shipping,
            taxTotal: (input as { taxTotal?: number }).taxTotal ?? 0,
            total: input.total,
            weightGrams: orderWeight,
            status,
            paymentStatus,
            handoffType: input.handoffType
          })
          .returning()

        createdOrderId = row.id

        for (const item of input.items) {
          const imageKey = item.img ? keyFromUrl(item.img) : null
          await db.insert(orderItemsTable).values({
            orderId: row.id,
            productId: item.id || null,
            variantId: item.variantId || null,
            sku: item.sku ?? null,
            name: item.name,
            size: item.size,
            unitPrice: item.priceNum,
            quantity: item.quantity,
            lineTotal: item.priceNum * item.quantity,
            weightGrams: item.weightGrams ?? 0,
            imageKey
          })
        }

        await db.insert(orderEventsTable).values({
          orderId: row.id,
          kind: 'status',
          status,
          note: 'Customer order placed',
          isInternal: false,
          actorName: 'System',
          createdAt
        })

        const method = input.paymentMethod ?? (input.handoffType === 'cod' ? 'COD' : input.handoffType === 'razorpay' ? 'Razorpay' : 'Manual')
        await db.insert(paymentsTable).values({
          orderId: row.id,
          method,
          amount: input.total,
          status: paymentStatus,
          gateway: input.handoffType === 'razorpay' ? 'razorpay' : 'manual',
          gatewayOrderId: input.razorpayOrderId ?? null,
          gatewayPaymentId: input.razorpayPaymentId ?? input.paymentId ?? null,
          settledAt: paymentStatus === 'Paid' ? createdAt : null
        })

        return (await this.getById(row.id))!
      } catch (error) {
        if (createdOrderId) {
          await db.delete(ordersTable).where(eq(ordersTable.id, createdOrderId)).catch(() => {})
        }
        for (const reserved of decremented.reverse()) {
          await db
            .update(productVariants)
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
      events: [
        {
          id: `evt-${createdAt.getTime()}`,
          status,
          note: 'Customer order placed',
          at: createdAt.toISOString(),
          by: 'System'
        }
      ],
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

    if (isDatabaseConfigured() && db) {
      if (statusChanged) {
        await db.insert(orderEventsTable).values({
          orderId: id,
          kind: 'status',
          status: patch.status!,
          note: `Status changed from ${current.status} to ${patch.status}`,
          isInternal: false,
          actorName: author,
          createdAt: now
        })
      }

      const values: Record<string, unknown> = { updatedAt: now }
      if (patch.status !== undefined) values.status = patch.status
      if (patch.paymentStatus !== undefined) values.paymentStatus = patch.paymentStatus
      await db.update(ordersTable).set(values).where(eq(ordersTable.id, id))

      if (patch.paymentStatus !== undefined) {
        const [latestPayment] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, id))
          .orderBy(desc(paymentsTable.createdAt))
        if (latestPayment) {
          await db
            .update(paymentsTable)
            .set({
              status: patch.paymentStatus,
              settledAt: patch.paymentStatus === 'Paid' ? latestPayment.settledAt ?? now : null
            })
            .where(eq(paymentsTable.id, latestPayment.id))
        } else {
          await db.insert(paymentsTable).values({
            orderId: id,
            method: 'Manual',
            amount: current.total ?? 0,
            status: patch.paymentStatus,
            gateway: 'manual',
            settledAt: patch.paymentStatus === 'Paid' ? now : null
          })
        }
      }

      const shipmentTouched =
        patch.carrier !== undefined ||
        patch.trackingNumber !== undefined ||
        patch.status === 'Shipped' ||
        patch.status === 'Delivered'

      if (shipmentTouched) {
        const [existingShipment] = await db
          .select()
          .from(shipmentsTable)
          .where(eq(shipmentsTable.orderId, id))
          .orderBy(desc(shipmentsTable.createdAt))
        const carrier = patch.carrier ?? existingShipment?.carrier ?? 'Manual'
        const trackingNumber = patch.trackingNumber ?? existingShipment?.trackingNumber ?? `TG-${id}-${now.getTime()}`
        const shipmentStatus =
          patch.status === 'Delivered'
            ? 'Delivered'
            : patch.status === 'Shipped'
              ? 'In Transit'
              : existingShipment?.status ?? 'Booked'
        const shippedAt =
          existingShipment?.shippedAt ??
          (patch.status === 'Shipped' || patch.status === 'Delivered' ? now : null)
        const deliveredAt = patch.status === 'Delivered' ? now : existingShipment?.deliveredAt ?? null

        if (existingShipment) {
          await db
            .update(shipmentsTable)
            .set({ carrier, trackingNumber, status: shipmentStatus, shippedAt, deliveredAt, updatedAt: now })
            .where(eq(shipmentsTable.id, existingShipment.id))
        } else {
          await db.insert(shipmentsTable).values({
            orderId: id,
            carrier,
            trackingNumber,
            status: shipmentStatus,
            shippedAt,
            deliveredAt
          })
        }
      }

      return this.getById(id)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const events = statusChanged
      ? [
          ...current.events,
          {
            id: `evt-${now.getTime()}`,
            status: patch.status!,
            note: `Status changed from ${current.status} to ${patch.status}`,
            at: now.toISOString(),
            by: author
          }
        ]
      : current.events

    const updated: Order = {
      ...current,
      ...patch,
      events,
      updatedAt: now,
      shippedAt: patch.status === 'Shipped' || patch.status === 'Delivered' ? now : current.shippedAt,
      deliveredAt: patch.status === 'Delivered' ? now : current.deliveredAt,
      carrier: patch.carrier ?? current.carrier,
      trackingNumber: patch.trackingNumber ?? current.trackingNumber
    }
    this.memoryOrders = this.memoryOrders.map((order) => (order.id === id ? updated : order))
    return updated
  }

  async addAdminNote(id: number, text: string, author: string): Promise<Order | undefined> {
    const current = await this.getById(id)
    if (!current) return undefined
    const now = new Date()

    if (isDatabaseConfigured() && db) {
      await db.insert(orderEventsTable).values({
        orderId: id,
        kind: 'note',
        note: text,
        isInternal: true,
        actorName: author,
        createdAt: now
      })
      return this.getById(id)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Order database is not configured.')
    const adminNotes = [
      ...current.adminNotes,
      { id: `note-${now.getTime()}`, text, at: now.toISOString(), by: author, internal: true }
    ]
    const updated = { ...current, adminNotes, updatedAt: now }
    this.memoryOrders = this.memoryOrders.map((order) => (order.id === id ? updated : order))
    return updated
  }
}

export const orderStore = new OrderStore()
