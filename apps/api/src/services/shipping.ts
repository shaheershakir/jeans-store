import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, isDatabaseConfigured } from '../db/index.js'
import { shippingSettings, type ShippingRates } from '../db/schema.js'

export const shippingRateSchema = z.object({
  baseWeightGrams: z.number().int().min(1).max(100_000),
  baseCharge: z.number().int().min(1).max(100_000),
  additionalWeightGrams: z.number().int().min(1).max(100_000),
  additionalCharge: z.number().int().min(1).max(100_000),
  estimatedDaysMin: z.number().int().min(1).max(100).optional(),
  estimatedDaysMax: z.number().int().min(1).max(100).optional(),
  exactDeliveryDate: z.string().optional()
})

export const shippingRatesSchema = z.object({
  kerala: shippingRateSchema,
  restOfIndia: shippingRateSchema
})

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  kerala: {
    baseWeightGrams: 500,
    baseCharge: 60,
    additionalWeightGrams: 500,
    additionalCharge: 20,
    estimatedDaysMin: 2,
    estimatedDaysMax: 5
  },
  restOfIndia: {
    baseWeightGrams: 500,
    baseCharge: 90,
    additionalWeightGrams: 500,
    additionalCharge: 30,
    estimatedDaysMin: 7,
    estimatedDaysMax: 14
  }
}

export function isKeralaDestination(state?: string, pincode?: string): boolean {
  const cleanPin = pincode ? pincode.replace(/\D/g, '') : ''
  if (cleanPin.length === 6) {
    return /^(67|68|69)/.test(cleanPin)
  }
  if (state && state.trim().toLowerCase() === 'kerala') {
    return true
  }
  return false
}

export function getDeliveryEstimation(state: string, rates: ShippingRates, pincode?: string) {
  const isKerala = isKeralaDestination(state, pincode)
  const rate = isKerala ? rates.kerala : rates.restOfIndia
  return {
    minDays: rate.estimatedDaysMin ?? (isKerala ? 2 : 7),
    maxDays: rate.estimatedDaysMax ?? (isKerala ? 5 : 14),
    exactDeliveryDate: rate.exactDeliveryDate || undefined,
    zone: isKerala ? ('kerala' as const) : ('restOfIndia' as const)
  }
}

let memoryRates: ShippingRates = structuredClone(DEFAULT_SHIPPING_RATES)

export async function getShippingRates(): Promise<ShippingRates> {
  if (isDatabaseConfigured() && db) {
    const [row] = await db.select().from(shippingSettings).where(eq(shippingSettings.id, 'delivery'))
    return row?.rates ?? structuredClone(DEFAULT_SHIPPING_RATES)
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Shipping database is not configured.')
  return structuredClone(memoryRates)
}

export async function saveShippingRates(rates: ShippingRates): Promise<void> {
  if (isDatabaseConfigured() && db) {
    await db
      .insert(shippingSettings)
      .values({ id: 'delivery', rates, updatedAt: new Date() })
      .onConflictDoUpdate({ target: shippingSettings.id, set: { rates, updatedAt: new Date() } })
    return
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Shipping database is not configured.')
  memoryRates = structuredClone(rates)
}

export function calculateShipping(weightGrams: number, state: string, rates: ShippingRates, pincode?: string): number {
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) throw new Error('A valid shipment weight is required.')
  const isKerala = isKeralaDestination(state, pincode)
  const rate = isKerala ? rates.kerala : rates.restOfIndia
  const additionalUnits = Math.ceil(Math.max(0, weightGrams - rate.baseWeightGrams) / rate.additionalWeightGrams)
  return rate.baseCharge + additionalUnits * rate.additionalCharge
}
