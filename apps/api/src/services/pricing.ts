/**
 * Single source of truth for checkout arithmetic.
 *
 * Money is stored as integer INR throughout the project. Razorpay is the only
 * boundary that converts to paise.
 *
 * Contract:
 *   lineTotal     = unitPrice * quantity
 *   discountAmt   = allocation of the order-level discount to this line
 *   taxableAmount = lineTotal - discountAmount
 *   taxAmount     = round(taxableAmount * taxRate)   (taxRate is a fraction)
 *   taxTotal      = sum(taxAmount)
 *   subtotal      = sum(lineTotal)
 *   total         = subtotal - discountTotal + shipping + taxTotal
 */
export interface PricedLineInput {
  productId: number
  variantId: number
  name: string
  size: string
  color?: string
  sku?: string
  quantity: number
  unitPrice: number
  weightGrams: number
  img?: string
  categoryId?: number
  isFreeSize?: boolean
  taxRate?: number
  variantLabel?: string
}

export interface PricedLine extends PricedLineInput {
  price: string
  taxRate: number
  lineTotal: number
  discountAmount: number
  taxableAmount: number
  taxAmount: number
  variantLabel: string
}

export interface PricingResult {
  lines: PricedLine[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  shipping: number
  total: number
  weightGrams: number
}

function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

function normalizeTaxRate(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  // Values above 1 are legacy percentages (18 = 18%). The canonical storage is
  // a fraction after migration 0007.
  const fraction = value > 1 ? value / 100 : value
  return Math.min(Math.max(fraction, 0), 1)
}

export function buildPricedLines(inputs: PricedLineInput[]): PricedLine[] {
  return inputs.map((input) => {
    const unitPrice = Math.max(0, Math.round(input.unitPrice))
    const quantity = Math.max(1, Math.round(input.quantity))
    const taxRate = normalizeTaxRate(input.taxRate)
    const lineTotal = unitPrice * quantity
    return {
      ...input,
      quantity,
      unitPrice,
      taxRate,
      lineTotal,
      discountAmount: 0,
      taxableAmount: lineTotal,
      taxAmount: Math.round(lineTotal * taxRate),
      price: formatPrice(unitPrice),
      variantLabel: input.variantLabel ?? [input.color, input.size].filter(Boolean).join(' / ')
    }
  })
}

/**
 * Allocates an order-level discount across lines proportionally to line value.
 * The allocation always sums exactly to the capped discount amount.
 */
export function allocateDiscount(lines: PricedLine[], requestedDiscount: number): PricedLine[] {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const discountTotal = Math.min(Math.max(0, Math.round(requestedDiscount)), subtotal)

  if (discountTotal === 0 || subtotal === 0) {
    return lines.map((line) => ({
      ...line,
      discountAmount: 0,
      taxableAmount: line.lineTotal,
      taxAmount: Math.round(line.lineTotal * line.taxRate),
      variantLabel: line.variantLabel
    }))
  }

  const allocations = lines.map((line, index) => {
    const exact = (line.lineTotal / subtotal) * discountTotal
    return { index, amount: Math.floor(exact), remainder: exact - Math.floor(exact) }
  })

  let allocated = allocations.reduce((sum, item) => sum + item.amount, 0)
  const byRemainder = [...allocations].sort((a, b) => b.remainder - a.remainder)
  for (const item of byRemainder) {
    if (allocated >= discountTotal) break
    allocations[item.index].amount += 1
    allocated += 1
  }

  return lines.map((line, index) => {
    const discountAmount = Math.min(allocations[index].amount, line.lineTotal)
    const taxableAmount = line.lineTotal - discountAmount
    return {
      ...line,
      discountAmount,
      taxableAmount,
      taxAmount: Math.round(taxableAmount * line.taxRate)
    }
  })
}

export function calculatePricing(
  inputs: PricedLineInput[],
  options: { discount?: number; shipping?: number } = {}
): PricingResult {
  const baseLines = buildPricedLines(inputs)
  const discountTotal = Math.min(
    Math.max(0, Math.round(options.discount ?? 0)),
    baseLines.reduce((sum, line) => sum + line.lineTotal, 0)
  )
  const lines = allocateDiscount(baseLines, discountTotal)
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const taxTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0)
  const shipping = Math.max(0, Math.round(options.shipping ?? 0))
  return {
    lines,
    subtotal,
    discountTotal,
    taxTotal,
    shipping,
    total: subtotal - discountTotal + shipping + taxTotal,
    weightGrams: lines.reduce((sum, line) => sum + line.weightGrams * line.quantity, 0)
  }
}

/** Server-side invariant used by tests and order persistence. */
export function reconcileOrderTotal(input: {
  subtotal: number
  discountTotal: number
  shipping: number
  taxTotal: number
  total: number
}): boolean {
  return input.total === input.subtotal - input.discountTotal + input.shipping + input.taxTotal
}
