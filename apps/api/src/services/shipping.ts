import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  shippingMethods,
  shippingZoneRegions,
  shippingZones
} from '../db/schema.js'

export const shippingRateSchema = z.object({
  baseWeightGrams: z.number().int().min(1).max(100_000),
  baseCharge: z.number().int().min(0).max(100_000),
  additionalWeightGrams: z.number().int().min(1).max(100_000),
  additionalCharge: z.number().int().min(0).max(100_000),
  estimatedDaysMin: z.number().int().min(1).max(100).optional(),
  estimatedDaysMax: z.number().int().min(1).max(100).optional(),
  exactDeliveryDate: z.string().optional()
})

export type ShippingRate = z.infer<typeof shippingRateSchema>

export const shippingRatesSchema = z.object({
  kerala: shippingRateSchema,
  restOfIndia: shippingRateSchema
})

export type ShippingRates = z.infer<typeof shippingRatesSchema>

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

function toRate(method: {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
  exactDeliveryDate: string | null
}): ShippingRate {
  return {
    baseWeightGrams: method.baseWeightGrams,
    baseCharge: method.baseCharge,
    additionalWeightGrams: method.additionalWeightGrams,
    additionalCharge: method.additionalCharge,
    estimatedDaysMin: method.estimatedDaysMin ?? undefined,
    estimatedDaysMax: method.estimatedDaysMax ?? undefined,
    exactDeliveryDate: method.exactDeliveryDate ?? undefined
  }
}

export async function getShippingRates(): Promise<ShippingRates> {
  if (isDatabaseConfigured() && db) {
    const [zones, regions, methods] = await Promise.all([
      db.select().from(shippingZones).where(eq(shippingZones.isActive, true)),
      db.select().from(shippingZoneRegions),
      db.select().from(shippingMethods).where(eq(shippingMethods.isActive, true))
    ])

    if (zones.length === 0 || methods.length === 0) {
      return structuredClone(DEFAULT_SHIPPING_RATES)
    }

    const regionsByZone = new Map<number, string[]>()
    for (const region of regions) {
      const list = regionsByZone.get(region.zoneId) ?? []
      list.push(region.region.toLowerCase())
      regionsByZone.set(region.zoneId, list)
    }

    const keralaZone =
      zones.find((zone) => (regionsByZone.get(zone.id) ?? []).includes('kerala')) ??
      zones.find((zone) => zone.name.toLowerCase().includes('kerala'))
    const defaultZone =
      zones.find((zone) => zone.isDefault) ??
      zones.find((zone) => zone.id !== keralaZone?.id) ??
      zones[0]

    const standardFor = (zoneId?: number) => {
      if (!zoneId) return undefined
      const zoneMethods = methods.filter((method) => method.zoneId === zoneId)
      return zoneMethods.find((method) => method.name.toLowerCase() === 'standard') ?? zoneMethods[0]
    }

    const keralaMethod = standardFor(keralaZone?.id)
    const restMethod = standardFor(defaultZone?.id)

    return {
      kerala: keralaMethod ? toRate(keralaMethod) : structuredClone(DEFAULT_SHIPPING_RATES.kerala),
      restOfIndia: restMethod ? toRate(restMethod) : structuredClone(DEFAULT_SHIPPING_RATES.restOfIndia)
    }
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Shipping database is not configured.')
  return structuredClone(memoryRates)
}

async function ensureZone(name: string, isDefault: boolean): Promise<number> {
  const [existing] = await db!.select({ id: shippingZones.id }).from(shippingZones).where(eq(shippingZones.name, name))
  if (existing) {
    await db!
      .update(shippingZones)
      .set({ isDefault, isActive: true })
      .where(eq(shippingZones.id, existing.id))
    return existing.id
  }
  const [created] = await db!
    .insert(shippingZones)
    .values({ name, isDefault, isActive: true })
    .returning({ id: shippingZones.id })
  return created.id
}

async function upsertStandardMethod(zoneId: number, rate: ShippingRate): Promise<void> {
  await db!
    .insert(shippingMethods)
    .values({
      zoneId,
      name: 'Standard',
      baseWeightGrams: rate.baseWeightGrams,
      baseCharge: rate.baseCharge,
      additionalWeightGrams: rate.additionalWeightGrams,
      additionalCharge: rate.additionalCharge,
      estimatedDaysMin: rate.estimatedDaysMin ?? null,
      estimatedDaysMax: rate.estimatedDaysMax ?? null,
      exactDeliveryDate: rate.exactDeliveryDate ?? null,
      codAvailable: false,
      isActive: true,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [shippingMethods.zoneId, shippingMethods.name],
      set: {
        baseWeightGrams: rate.baseWeightGrams,
        baseCharge: rate.baseCharge,
        additionalWeightGrams: rate.additionalWeightGrams,
        additionalCharge: rate.additionalCharge,
        estimatedDaysMin: rate.estimatedDaysMin ?? null,
        estimatedDaysMax: rate.estimatedDaysMax ?? null,
        exactDeliveryDate: rate.exactDeliveryDate ?? null,
        isActive: true,
        updatedAt: new Date()
      }
    })
}

export async function saveShippingRates(rates: ShippingRates): Promise<void> {
  if (isDatabaseConfigured() && db) {
    const keralaZoneId = await ensureZone('Kerala', false)
    const restZoneId = await ensureZone('Rest of India', true)

    await db
      .insert(shippingZoneRegions)
      .values({ zoneId: keralaZoneId, region: 'Kerala' })
      .onConflictDoNothing()

    await Promise.all([
      upsertStandardMethod(keralaZoneId, rates.kerala),
      upsertStandardMethod(restZoneId, rates.restOfIndia)
    ])
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
