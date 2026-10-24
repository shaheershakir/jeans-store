/**
 * Centralized SKU Generation and Mapping Service
 *
 * Implements the standard SKU format:
 *   CATEGORY-PRODUCT_TYPE-COLOR-SIZE  (e.g., STR-OVS-BLK-M)
 *
 * Collision Resolution Format:
 *   CATEGORY-PRODUCT_TYPE-P{PRODUCT_ID}-COLOR-SIZE  (e.g., STR-OVS-P012-BLK-M)
 */

export const CATEGORY_CODES: Record<string, string> = {
  // Primary store categories
  stripes: 'STR',
  stripe: 'STR',
  'striped-tees': 'STR',
  'striped-t-shirt': 'STR',
  'striped-t-shirts': 'STR',

  fullsleeve: 'FSL',
  'full-sleeve': 'FSL',
  'full-sleeve-tees': 'FSL',
  'full-sleeve-t-shirt': 'FSL',

  drsleeve: 'TQS',
  'dr-sleeve': 'TQS',
  'three-quarter': 'TQS',
  'three-quarter-sleeve': 'TQS',
  'three-quarter-sleeves': 'TQS',

  'printed-tees': 'PRT',
  'printed-tee': 'PRT',
  printed: 'PRT',
  'printed-t-shirt': 'PRT',

  'ringer-tees': 'RNG',
  'ringer-tee': 'RNG',
  ringer: 'RNG',

  henley: 'HEN',
  'henley-tees': 'HEN',
  'henley-t-shirt': 'HEN',

  waffle: 'WFL',
  'waffle-tees': 'WFL',
  'waffle-knit': 'WFL',
  'waffle-t-shirt': 'WFL',

  trackpants: 'TRK',
  trackpant: 'TRK',
  track: 'TRK',

  sweatpants: 'SWT',
  sweatpant: 'SWT',
  sweats: 'SWT',

  't-shirts': 'TSH',
  tees: 'TSH',

  hoodies: 'HOD',
  hoodie: 'HOD',
  jeans: 'JNS',
  jean: 'JNS'
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
  standard: 'REG',
  classic: 'REG',
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
  multicolor: 'MLT',
  raw: 'RAW',
  indigo: 'IND'
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

/**
 * Normalizes text to lowercase alphanumeric without extra punctuation.
 */
function normalizeKey(val: string): string {
  return val.trim().toLowerCase().replace(/[^\w\s-]/g, '')
}

/**
 * Resolves category abbreviation code.
 */
export function getCategoryCode(category?: string | null): string {
  if (!category) return 'PRT'
  const key = normalizeKey(category)
  if (CATEGORY_CODES[key]) return CATEGORY_CODES[key]

  // Check partial key matches
  for (const [k, code] of Object.entries(CATEGORY_CODES)) {
    if (key.includes(k) || k.includes(key)) {
      return code
    }
  }

  // Fallback: take first 3 letters uppercase
  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'GEN').toUpperCase()
}

/**
 * Resolves product type / fit abbreviation code.
 */
export function getProductTypeCode(fitOrType?: string | null): string {
  if (!fitOrType) return 'REG'
  const key = normalizeKey(fitOrType)
  if (PRODUCT_TYPE_CODES[key]) return PRODUCT_TYPE_CODES[key]

  for (const [k, code] of Object.entries(PRODUCT_TYPE_CODES)) {
    if (key.includes(k) || k.includes(key)) {
      return code
    }
  }

  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'REG').toUpperCase()
}

/**
 * Resolves color abbreviation code.
 */
export function getColorCode(color?: string | null): string {
  if (!color) return 'BLK'
  const key = normalizeKey(color)
  if (COLOR_CODES[key]) return COLOR_CODES[key]

  // Handle slashes or multi-color names like "Ecru / Navy" or "Washed Black"
  for (const [k, code] of Object.entries(COLOR_CODES)) {
    if (key.includes(k)) {
      return code
    }
  }

  const cleaned = key.replace(/[^a-z]/g, '')
  return (cleaned.slice(0, 3) || 'BLK').toUpperCase()
}

/**
 * Resolves size abbreviation code.
 */
export function getSizeCode(size?: string | number | null): string {
  if (size === undefined || size === null || size === '') return 'M'
  const str = String(size).trim()
  const key = str.toLowerCase()
  if (SIZE_CODES[key]) return SIZE_CODES[key]

  // Numeric waist sizes (e.g. 28, 30, 32, 34, 36)
  if (/^\d+$/.test(str)) {
    return str
  }

  return str.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'M'
}

/**
 * Formats a product ID into a stable product code.
 * Numeric IDs keep their padded form (12 -> P012); UUIDs use the last six
 * alphanumeric characters (…-000000000012 -> P000012), which stays unique for
 * the deterministic seed IDs and avoids SKU collisions for random UUIDs.
 */
export function formatProductCode(productId: number | string): string {
  const raw = String(productId).trim()
  if (/^\d+$/.test(raw)) {
    return `P${raw.padStart(3, '0')}`
  }
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '')
  if (!clean) {
    return 'P000'
  }
  return `P${clean.slice(-6).toUpperCase()}`
}

export interface SkuComponents {
  category: string
  productType?: string
  color: string
  size: string | number
  productId?: number | string
}

/**
 * Generates the pure 4-part SKU:
 * CATEGORY-PRODUCT_TYPE-COLOR-SIZE
 */
export function generateBaseSku(components: SkuComponents): string {
  const cat = getCategoryCode(components.category)
  const type = getProductTypeCode(components.productType)
  const col = getColorCode(components.color)
  const sz = getSizeCode(components.size)
  return `${cat}-${type}-${col}-${sz}`.toUpperCase()
}

/**
 * Generates the 5-part SKU with product code for collision resolution:
 * CATEGORY-PRODUCT_TYPE-P012-COLOR-SIZE
 */
export function generateProductScopedSku(components: SkuComponents): string {
  const cat = getCategoryCode(components.category)
  const type = getProductTypeCode(components.productType)
  const prod = formatProductCode(components.productId ?? 0)
  const col = getColorCode(components.color)
  const sz = getSizeCode(components.size)
  return `${cat}-${type}-${prod}-${col}-${sz}`.toUpperCase()
}

/**
 * Checks if a candidate SKU is already claimed by any other product.
 * Returns the final SKU (either 4-part, or 5-part if collision occurs).
 */
export function resolveSkuWithCollisionCheck(
  components: SkuComponents,
  isSkuClaimedByOtherProduct: (sku: string) => boolean
): string {
  const baseSku = generateBaseSku(components)

  // If base SKU is not taken by another product, use it
  if (!isSkuClaimedByOtherProduct(baseSku)) {
    return baseSku
  }

  // Collision detected! Use stable product-specific code
  return generateProductScopedSku(components)
}
