import type { Color, Fit, Gender, Material, Rise, Wash } from '@/lib/types'

/** Representative apparel products for local development previews only. */
export interface ProductSpec {
  name: string
  category: string
  brand: string
  fit: Fit
  wash: Wash
  color: Color
  gender: Gender
  rise: Rise
  material: Material
  basePrice: number
  blurb: string
}

export const PRODUCT_SPECS: ProductSpec[] = [
  { name: 'Breton Contrast Stripe Tee', category: 'stripes', brand: 'TEESGARAGE', fit: 'Regular', wash: 'Raw', color: 'Navy', gender: 'Unisex', rise: 'Mid', material: 'Cotton', basePrice: 1199, blurb: 'Yarn-dyed cotton with a clean contrast stripe and a comfortable everyday fit.' },
  { name: 'Heavy Cotton Fullsleeve Tee', category: 'fullsleeve', brand: 'TEESGARAGE', fit: 'Regular', wash: 'Raw', color: 'Black', gender: 'Unisex', rise: 'Mid', material: 'Cotton', basePrice: 1399, blurb: 'A sturdy long-sleeve cotton tee with a soft hand feel and ribbed cuffs.' },
  { name: 'Drop Shoulder Drsleeve Tee', category: 'drsleeve', brand: 'TEESGARAGE', fit: 'Oversized', wash: 'Raw', color: 'Grey', gender: 'Unisex', rise: 'Mid', material: 'Jersey', basePrice: 1299, blurb: 'Relaxed drop-shoulder construction in breathable cotton jersey.' },
  { name: 'Everyday Graphic Printed Tee', category: 'printed-tees', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Raw', color: 'White', gender: 'Unisex', rise: 'Mid', material: 'Cotton', basePrice: 1199, blurb: 'A soft cotton tee finished with a durable screen-printed graphic.' },
  { name: 'Vintage Ringer Tee', category: 'ringer-tees', brand: 'TEESGARAGE', fit: 'Regular', wash: 'Raw', color: 'White', gender: 'Unisex', rise: 'Mid', material: 'Jersey', basePrice: 1249, blurb: 'A vintage-inspired tee with contrast rib binding at the neck and sleeves.' },
  { name: 'Waffle Knit Henley', category: 'henley', brand: 'TEESGARAGE', fit: 'Regular', wash: 'Raw', color: 'Olive', gender: 'Unisex', rise: 'Mid', material: 'Waffle Knit', basePrice: 1499, blurb: 'Textured waffle cotton with a three-button placket and an easy regular fit.' },
  { name: 'Performance Trackpants', category: 'trackpants', brand: 'TEESGARAGE', fit: 'Tapered' as Fit, wash: 'Raw', color: 'Black', gender: 'Unisex', rise: 'Mid', material: 'Cotton Stretch', basePrice: 1699, blurb: 'Lightweight stretch trackpants with a tapered leg, elastic waist, and secure pockets.' },
  { name: 'French Terry Sweatpants', category: 'sweatpants', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Raw', color: 'Grey', gender: 'Unisex', rise: 'Mid', material: 'French Terry', basePrice: 1799, blurb: 'Midweight French terry sweatpants with a brushed-soft feel and relaxed shape.' },
]

export function alternateColor(color: Color): Color {
  switch (color) {
    case 'Black': return 'Navy'
    case 'White': return 'Black'
    case 'Grey': return 'Navy'
    case 'Navy': return 'White'
    case 'Olive': return 'Black'
    default: return 'Black'
  }
}
