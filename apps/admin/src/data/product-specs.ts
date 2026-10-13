import type { Color, Fit, Gender, Material, Rise, Wash } from '@/lib/types'

/**
 * Hand-authored catalog of 36 products. The seed generator expands each
 * spec into a product with multiple variants (size × color).
 */
export interface ProductSpec {
  name: string
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
  { name: 'Iconic Mid-Rise Straight Fit', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Vintage Wash', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 1999, blurb: 'The dependable everyday pair. Mid-rise straight leg in a soft vintage indigo wash with subtle whiskering.' },
  { name: 'Everyday Slim Stretch Indigo', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Stone Wash', color: 'Dark Blue', gender: 'Men', rise: 'Mid', material: 'Cotton Stretch', basePrice: 2299, blurb: '2% stretch denim that moves with you. Clean slim profile from thigh to ankle.' },
  { name: 'Ankle-Length Skinny Blue', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Stone Wash', color: 'Blue', gender: 'Women', rise: 'Mid', material: 'Cotton Stretch', basePrice: 2199, blurb: 'Hug-from-hip-to-hem skinny with a cropped ankle-length hem for sneakers.' },
  { name: 'Relaxed Classic Black', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Raw', color: 'Black', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 1999, blurb: 'Sulphur-dyed matte black with a relaxed thigh and straight leg. Fades to soft charcoal.' },
  { name: 'High-Rise Bootcut Flare', brand: 'TEESGARAGE', fit: 'Bootcut', wash: 'Dark Wash', color: 'Dark Blue', gender: 'Women', rise: 'High', material: 'Cotton Stretch', basePrice: 2499, blurb: 'Flattering high rise with a slight flare from the knee — the retro profile done right.' },
  { name: 'Light Wash Casual Slim', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Stone Wash', color: 'Light Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 1899, blurb: 'A weekend-easy light blue wash, slim without being tight.' },
  { name: 'Selvedge 14oz Raw Straight', brand: 'INDIGO WORKS', fit: 'Straight', wash: 'Raw', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Selvedge Denim', basePrice: 3499, blurb: 'Unwashed 14oz selvedge from a Japanese-style mill. Built to break in slowly and uniquely.' },
  { name: 'Grey Distressed Utility Straight', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Distressed', color: 'Grey', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2099, blurb: 'Slate-grey straight with reinforced utility seams and light hand-distressing.' },
  { name: 'Mid-Rise Skinny Black', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Raw', color: 'Black', gender: 'Women', rise: 'Mid', material: 'Cotton Stretch', basePrice: 2199, blurb: 'True-to-size skinny in rigid-look stretch black.' },
  { name: 'Relaxed Taper Street Denim', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Stone Wash', color: 'Grey', gender: 'Men', rise: 'Low', material: 'Cotton', basePrice: 1999, blurb: 'Low-rise relaxed fit that tapers through the leg. Skate-ready, street-approved.' },
  { name: 'Acid Washed Retro Bootcut', brand: 'RETRO DENIM CO.', fit: 'Bootcut', wash: 'Acid Wash', color: 'Light Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2399, blurb: 'A full-throttle 80s acid wash with a modest bootcut flare.' },
  { name: 'Acid Wash Statement Slim', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Acid Wash', color: 'Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2299, blurb: 'High-rise slim with marbled acid-wash splatter across the thighs.' },
  { name: 'Comfort Washed Grey Straight', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Stone Wash', color: 'Grey', gender: 'Men', rise: 'Mid', material: 'Cotton Stretch', basePrice: 1799, blurb: 'Overdyed slate grey, washed for softness. Straight leg with all-day comfort.' },
  { name: 'Cargo Workwear Relaxed', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Distressed', color: 'Dark Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2499, blurb: 'Relaxed cargo with deep welt pockets, workwear stitching and a dark distressed wash.' },
  { name: 'High-Rise Skinny White', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Raw', color: 'White', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2099, blurb: 'Crisp high-rise white skinny. Fully opaque, structured cotton.' },
  { name: 'Dark Indigo Slim Everyday', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Dark Wash', color: 'Dark Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2199, blurb: 'Office-ready dark indigo slim. Minimal fading keeps it sharp.' },
  { name: 'Classic Stone Wash Straight', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Stone Wash', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 1799, blurb: 'The classic stone-washed straight in mid blue. Vintage softness, honest fit.' },
  { name: 'High-Rise Vintage Bootcut', brand: 'RETRO DENIM CO.', fit: 'Bootcut', wash: 'Vintage Wash', color: 'Light Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2499, blurb: 'High-waisted 70s bootcut with a sun-faded vintage blue wash.' },
  { name: 'Relaxed Skate Fit Baggy Denim', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Distressed', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2199, blurb: 'Generous leg room with authentic sun-bleached fading and a lived-in feel.' },
  { name: 'Slim Fit Structured Black', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Raw', color: 'Black', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2199, blurb: 'A sharp, structured black slim with a clean matte finish. Zero shine.' },
  { name: 'Ripped Distressed Skinny Blue', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Distressed', color: 'Blue', gender: 'Women', rise: 'High', material: 'Cotton Stretch', basePrice: 2299, blurb: 'High-rise skinny with artfully placed rips and frayed knee details.' },
  { name: 'Comfort Stretch Straight Black', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Dark Wash', color: 'Black', gender: 'Men', rise: 'Mid', material: 'Cotton Stretch', basePrice: 1999, blurb: 'Fade-resistant black straight with stretch comfort for long days.' },
  { name: 'Office Fit Dark Bootcut', brand: 'TEESGARAGE', fit: 'Bootcut', wash: 'Dark Wash', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2299, blurb: 'A subtle bootcut in a clean dark wash — jeans that pass for formal.' },
  { name: 'Wide Leg Indigo High-Rise', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Vintage Wash', color: 'Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2599, blurb: 'Dramatic wide leg cut from mid-weight cotton. Flowing, modern, comfortable.' },
  { name: 'Ice Wash Vintage Slim', brand: 'RETRO DENIM CO.', fit: 'Slim', wash: 'Acid Wash', color: 'Grey', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2399, blurb: 'Icy grey acid wash with heavy marbling. A retro statement made modern.' },
  { name: 'High-Rise Mid Blue Straight', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Stone Wash', color: 'Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2199, blurb: 'A clean high-rise straight in an everyday mid-blue wash.' },
  { name: 'Stretch Skinny Light Grey', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Distressed', color: 'Grey', gender: 'Women', rise: 'Mid', material: 'Cotton Stretch', basePrice: 2099, blurb: 'Mid-grey skinny with a soft stretch hand-feel and cropped hem.' },
  { name: 'Washed Black Relaxed Fit', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Vintage Wash', color: 'Black', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2099, blurb: 'Garment-washed black relaxed fit that eases into soft charcoal.' },
  { name: 'High-Rise Stretch Bootcut Black', brand: 'TEESGARAGE', fit: 'Bootcut', wash: 'Raw', color: 'Black', gender: 'Women', rise: 'High', material: 'Cotton Stretch', basePrice: 2499, blurb: 'Flared bootcut in black with a forgiving four-way stretch.' },
  { name: 'Raw Selvedge Slim 14oz', brand: 'INDIGO WORKS', fit: 'Slim', wash: 'Raw', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Selvedge Denim', basePrice: 3799, blurb: 'Rigid 14oz selvedge slim for the raw-denim die-hard. Fades to electric blue.' },
  { name: 'Tencel Breeze Light Straight', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Stone Wash', color: 'Light Blue', gender: 'Men', rise: 'Mid', material: 'Tencel Denim', basePrice: 2399, blurb: 'Breathable Tencel blend for humid days. Light, fluid, barely there.' },
  { name: 'Cloud Stretch Relaxed Indigo', brand: 'TEESGARAGE', fit: 'Relaxed', wash: 'Stone Wash', color: 'Blue', gender: 'Men', rise: 'Mid', material: 'Cotton Stretch', basePrice: 2199, blurb: 'Eight-way stretch relaxed fit — the most comfortable denim in the range.' },
  { name: 'Night Blue Dark Skinny', brand: 'TEESGARAGE', fit: 'Skinny', wash: 'Dark Wash', color: 'Dark Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2299, blurb: 'A deep, almost-black indigo skinny with a polished dark wash.' },
  { name: 'Faded Acid Wash Bootcut', brand: 'RETRO DENIM CO.', fit: 'Bootcut', wash: 'Acid Wash', color: 'Blue', gender: 'Women', rise: 'High', material: 'Cotton', basePrice: 2499, blurb: 'Vintage acid wash bootcut with dreamy faded marble tones.' },
  { name: 'Destroyed Straight Grey', brand: 'TEESGARAGE', fit: 'Straight', wash: 'Distressed', color: 'Grey', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 1999, blurb: 'Heavy destruction, slubby grey fabric and a straight leg that means business.' },
  { name: 'Combat Cargo Slim Black', brand: 'TEESGARAGE', fit: 'Slim', wash: 'Distressed', color: 'Black', gender: 'Men', rise: 'Mid', material: 'Cotton', basePrice: 2499, blurb: 'Slim combat cut with side cargo pockets and a tough dyed-black finish.' },
]

/** Alternate colorway used to expand each product into two color variants. */
export function alternateColor(color: Color): Color {
  switch (color) {
    case 'Black':
      return 'Blue'
    case 'White':
      return 'Black'
    case 'Grey':
      return 'Dark Blue'
    case 'Light Blue':
      return 'Blue'
    default:
      return 'Black'
  }
}