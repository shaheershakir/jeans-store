import { eq, desc } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { orders as ordersTable, type DbOrder } from '../db/schema.js'
import type { CreateOrder, Order } from '../schemas/order.js'

function toOrder(row: DbOrder): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
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
    handoffType: row.handoffType as 'whatsapp' | 'email',
    createdAt: row.createdAt
  }
}

class OrderStore {
  private memoryOrders: Order[] = []

  async list(): Promise<Order[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
      return rows.map(toOrder)
    }
    return [...this.memoryOrders].reverse()
  }

  async getById(id: number): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, id))
      return row ? toOrder(row) : undefined
    }
    return this.memoryOrders.find((o) => o.id === id)
  }

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.orderNumber, orderNumber))
      return row ? toOrder(row) : undefined
    }
    return this.memoryOrders.find((o) => o.orderNumber === orderNumber)
  }

  async create(input: CreateOrder): Promise<Order> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .insert(ordersTable)
        .values({
          orderNumber: input.orderNumber,
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
          handoffType: input.handoffType,
          status: 'pending'
        })
        .returning()
      return toOrder(row)
    }

    const id = this.memoryOrders.length + 1
    const order: Order = {
      id,
      ...input,
      status: 'pending',
      createdAt: new Date()
    }
    this.memoryOrders.push(order)
    return order
  }
}

export const orderStore = new OrderStore()
