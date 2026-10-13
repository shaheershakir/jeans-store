/**
 * Centralized SKU Generation and Mapping for Admin Panel
 * Matches the backend format:
 *   CATEGORY-PRODUCT_TYPE-COLOR-SIZE  (e.g., STR-OVS-BLK-M)
 *
 * Collision Resolution Format:
 *   CATEGORY-PRODUCT_TYPE-P{PRODUCT_ID}-COLOR-SIZE  (e.g., STR-OVS-P012-BLK-M)
 */

export const CATEGORY_CODES: Record<string, string> = {
  stripes: 'STR',
  stripe: 'STR',
  fullsleeve: 'FSL',
  'full-sleeve': 'FSL',
  drsleeve: 'TQS',
  'dr-sleeve': 'TQS',
  'three-quarter': 'TQS',
  'three-quarter-sleeve': 'TQS',
  'printed-tees': 'PRT',
  'printed-tee': 'PRT',
  printed: 'PRT',
  'ringer-tees': 'RNG',
  'ringer-tee': 'RNG',
  ringer: 'RNG',
  henley: 'HEN',
  trackpants: 'TRK',
  trackpant: 'TRK',
  sweatpants: 'SWT',
  sweatpant: 'SWT'
}

export const PRODUCT_TYPE_CODES: Record<string, string> = {
  oversized: 'OVS',
  regular: 'REG',
  boxy: 'BOX',
  relaxed: 'RLX',
  straight: 'STR',
  slim: 'SLM',
  skinny: 'SKN',
  baggy: 'BAG',
  bootcut: 'BTC',
  wide: 'WID',
  tapered: 'TAP'
}

export const COLOR_CODES: Record<string, string> = {
  black: 'BLK',
  white: 'WHT',
  navy: 'NVY',
  'navy blue': 'NVY',
  grey: 'GRY',
  gray: 'GRY',
  blue: 'BLU',
  'dark blue': 'DBL',
  'light blue': 'LBL',
  green: 'GRN',
  'forest green': 'GRN',
  olive: 'OLV',
  red: 'RED',
  maroon: 'MRN',
  yellow: 'YLW',
  orange: 'ORG',
  purple: 'PRP',
  pink: 'PNK',
  brown: 'BRN',
  beige: 'BGE',
  cream: 'BGE',
  ecru: 'BGE',
  charcoal: 'CHR',
  lavender: 'LVD',
  sage: 'SGE',
  rust: 'RST',
  mustard: 'MST',
  multi: 'MLT',
  multicolor: 'MLT'
}

export const SIZE_CODES: Record<string, string> = {
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  xxl: 'XXL',
  xxs: 'XXS',
  '3xl': '3XL',
  xxxl: '3XL',
  '4xl': '4XL',
  free: 'FREE',
  onesize: 'OS'
}

function normalizeKey(val: string): string {
  return val.trim().toLowerCase().replace(/[^\w\s-]/g, '')
}

export function getCategoryCode(category?: string | null): string {
  if (!category) return 'PRT'
  const key = normalizeKey(category)
  if (CATEGORY_CODES[key]) return CATEGORY_CODES[key]
  for (const [k, code] of Object.entries(CATEGORY_CODES)) {
    if (key.includes(k) || k.includes(key)) return code
  }
  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'GEN').toUpperCase()
}

export function getProductTypeCode(fitOrType?: string | null): string {
  if (!fitOrType) return 'REG'
  const key = normalizeKey(fitOrType)
  if (PRODUCT_TYPE_CODES[key]) return PRODUCT_TYPE_CODES[key]
  for (const [k, code] of Object.entries(PRODUCT_TYPE_CODES)) {
    if (key.includes(k) || k.includes(key)) return code
  }
  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'REG').toUpperCase()
}

export function getColorCode(color?: string | null): string {
  if (!color) return 'BLK'
  const key = normalizeKey(color)
  if (COLOR_CODES[key]) return COLOR_CODES[key]
  for (const [k, code] of Object.entries(COLOR_CODES)) {
    if (key.includes(k)) return code
  }
  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'BLK').toUpperCase()
}

export function getSizeCode(size?: string | number | null): string {
  if (size === undefined || size === null || size === '') return 'M'
  const str = String(size).trim()
  const key = str.toLowerCase()
  if (SIZE_CODES[key]) return SIZE_CODES[key]
  if (/^\d+$/.test(str)) return str
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'M'
}

export function formatProductCode(productId: number | string): string {
  const num = parseInt(String(productId).replace(/\D/g, ''), 10)
  if (isNaN(num)) return 'P000'
  return `P${String(num).padStart(3, '0')}`
}

export interface SkuComponents {
  category: string
  productType?: string
  color: string
  size: string | number
  productId?: number | string
}

export function generateBaseSku(components: SkuComponents): string {
  const cat = getCategoryCode(components.category)
  const type = getProductTypeCode(components.productType)
  const col = getColorCode(components.color)
  const sz = getSizeCode(components.size)
  return `${cat}-${type}-${col}-${sz}`.toUpperCase()
}

export function generateProductScopedSku(components: SkuComponents): string {
  const cat = getCategoryCode(components.category)
  const type = getProductTypeCode(components.productType)
  const prod = formatProductCode(components.productId ?? 0)
  const col = getColorCode(components.color)
  const sz = getSizeCode(components.size)
  return `${cat}-${type}-${prod}-${col}-${sz}`.toUpperCase()
}

/**
 * Calls backend SKU preview API with local fallback if offline.
 */
export async function fetchBackendSkuPreview(components: SkuComponents): Promise<string> {
  try {
    const res = await fetch('http://localhost:4000/api/products/sku/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(components)
    })
    if (res.ok) {
      const data = (await res.json()) as { sku: string }
      if (data.sku) return data.sku
    }
  } catch {
    // Fall back to client calculation
  }
  return generateBaseSku(components)
}
