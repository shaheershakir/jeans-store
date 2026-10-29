import crypto from 'node:crypto'

/**
 * Generates a collision-safe, human-readable order number.
 * Format: TGE-<timestampBase36>-<randomHex>
 * Example: TGE-M7ABCDEF-9FA210B3
 */
export function generateOrderNumber(): string {
  const timestampBase36 = Date.now().toString(36).toUpperCase()
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `TGE-${timestampBase36}-${randomPart}`
}

/**
 * Checks whether an order number matches the legacy low-entropy 6-digit client pattern:
 * e.g. TGE-123456 (generated via `TGE-${Date.now().toString().slice(-6)}`).
 */
export function isLegacyClientOrderNumber(orderNumber?: string | null): boolean {
  if (!orderNumber) return false
  return /^TGE-\d{6}$/.test(orderNumber.trim())
}

/**
 * Determines whether a given client orderNumber should be replaced by a fresh server-generated one.
 * In production, any omitted order number or legacy 6-digit low-entropy order number is superseded.
 * In development / testing, omitted order numbers or legacy 6-digit client numbers are also replaced,
 * while explicit test identifiers (e.g. `TEST-ORD-...`, `ORD-CONF-...`) are preserved.
 */
export function shouldGenerateServerOrderNumber(orderNumber?: string | null): boolean {
  if (!orderNumber || !orderNumber.trim()) return true
  if (isLegacyClientOrderNumber(orderNumber)) return true
  return false
}
