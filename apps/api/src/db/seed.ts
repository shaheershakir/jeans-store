import { count, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from './index.js'
import {
  categories,
  products,
  productVariants,
  storeSettings
} from '@jeans-store/db'
import { PRODUCTS } from '../data/products.js'
import { ProductStore } from '../store/productStore.js'
import { DEFAULT_NAV_ITEMS, navigationStore } from '../store/navStore.js'
import { DEFAULT_HOMEPAGE_CONFIG, homepageStore } from '../store/homepageStore.js'
import { DEFAULT_SHIPPING_RATES, saveShippingRates } from '../services/shipping.js'
import type { CreateProduct } from '../schemas/product.js'

const PARENT_CATEGORIES = [
  { slug: 't-shirts', name: 'T-Shirts', description: 'Curated collection of heavyweight and casual tees.', sortOrder: 1, parentId: null },
  { slug: 'bottomwear', name: 'Bottomwear', description: 'Denim jeans, trackpants, and fleece sweatpants built for movement and comfort.', sortOrder: 2, parentId: null }
]

const SUBCATEGORIES: { parentSlug: string; slug: string; name: string; description: string; sortOrder: number }[] = [
  // T-Shirts subcategories
  { parentSlug: 't-shirts', slug: 'stripes', name: 'Stripes', description: 'Breton, micro and block striped heavyweight tees.', sortOrder: 1 },
  { parentSlug: 't-shirts', slug: 'fullsleeve', name: 'Fullsleeve', description: 'Full-sleeve tees built for layering and cool evenings.', sortOrder: 2 },
  { parentSlug: 't-shirts', slug: 'drsleeve', name: 'Drsleeve', description: 'Drop-shoulder tees with a relaxed streetwear drape.', sortOrder: 3 },
  { parentSlug: 't-shirts', slug: 'printed-tees', name: 'Printed Tees', description: 'Graphic and art-driven printed tees.', sortOrder: 4 },
  { parentSlug: 't-shirts', slug: 'ringer-tees', name: 'Ringer Tees', description: 'Contrast ringer collars and cuffs with retro energy.', sortOrder: 5 },
  { parentSlug: 't-shirts', slug: 'henley', name: 'Henley', description: 'Button-placket henleys in waffle and jersey knits.', sortOrder: 6 },
  { parentSlug: 't-shirts', slug: 'waffle', name: 'Waffle', description: 'Thermal waffle knit tees and long sleeves with textured honeycomb weave.', sortOrder: 7 },

  // Bottomwear subcategories
  { parentSlug: 'bottomwear', slug: 'jeans', name: 'Jeans', description: 'Premium heavyweight denim in raw and washed silhouettes.', sortOrder: 1 },
  { parentSlug: 'bottomwear', slug: 'trackpants', name: 'Trackpants', description: 'Tapered and relaxed trackpants for everyday movement.', sortOrder: 2 },
  { parentSlug: 'bottomwear', slug: 'sweatpants', name: 'Sweatpants', description: 'Heavyweight fleece sweatpants with a clean silhouette.', sortOrder: 3 }
]

export async function seedIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) {
    return false
  }

  const [productCount] = await db.select({ value: count() }).from(products)
  if (productCount && productCount.value > 0) {
    return false
  }

  console.log('Seeding parent categories...')
  for (const parent of PARENT_CATEGORIES) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(sql`lower(${categories.slug}) = lower(${parent.slug})`)
    if (existing.length > 0) {
      await db
        .update(categories)
        .set({ name: parent.name, description: parent.description, sortOrder: parent.sortOrder, parentId: null })
        .where(sql`lower(${categories.slug}) = lower(${parent.slug})`)
    } else {
      await db.insert(categories).values(parent)
    }
  }

  const parentRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const parentMap = new Map(parentRows.map((r) => [r.slug.toLowerCase(), r.id]))

  console.log(`Seeding ${SUBCATEGORIES.length} subcategories...`)
  for (const sub of SUBCATEGORIES) {
    const parentId = parentMap.get(sub.parentSlug.toLowerCase()) ?? null
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(sql`lower(${categories.slug}) = lower(${sub.slug})`)
    if (existing.length > 0) {
      await db
        .update(categories)
        .set({ name: sub.name, description: sub.description, sortOrder: sub.sortOrder, parentId })
        .where(sql`lower(${categories.slug}) = lower(${sub.slug})`)
    } else {
      await db.insert(categories).values({
        slug: sub.slug,
        name: sub.name,
        description: sub.description,
        sortOrder: sub.sortOrder,
        parentId
      })
    }
  }

  console.log('Seeding store settings...')
  await db
    .insert(storeSettings)
    .values({
      id: 'default',
      storeName: 'TEESGARAGE',
      supportEmail: 'hello@teesgarage.in',
      supportPhone: '+91 98765 43210',
      address: 'Kochi, Kerala, India',
      currency: 'INR',
      orderPrefix: 'TG'
    })
    .onConflictDoNothing({ target: storeSettings.id })

  const store = new ProductStore([])
  console.log(`Seeding ${PRODUCTS.length} products from the source catalog...`)
  for (let index = 0; index < PRODUCTS.length; index++) {
    const product = PRODUCTS[index]
    const { id, createdAt: _createdAt, variants: _variants, ...input } = product
    await store.create(input as CreateProduct, id)
    if ((index + 1) % 5 === 0 || index === PRODUCTS.length - 1) {
      console.log(`  seeded ${index + 1}/${PRODUCTS.length}`)
    }
  }

  console.log('Seeding shipping zones and methods...')
  await saveShippingRates(DEFAULT_SHIPPING_RATES)

  console.log('Seeding homepage sections...')
  await homepageStore.save(DEFAULT_HOMEPAGE_CONFIG)

  console.log('Seeding navigation...')
  await navigationStore.bulkSave(DEFAULT_NAV_ITEMS)

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1), true)`
  )
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('product_variants', 'id'), COALESCE((SELECT MAX(id) FROM product_variants), 1), true)`
  )

  console.log('Database seeded successfully.')
  return true
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedIfEmpty()
    .then((seeded) => {
      console.log(seeded ? 'Seed completed.' : 'Seed skipped: database already has products or is not configured.')
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
