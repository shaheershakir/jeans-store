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

const CATEGORY_SEED = [
  { slug: 'stripes', name: 'Stripes', description: 'Breton, micro and block striped heavyweight tees.', sortOrder: 1 },
  { slug: 'fullsleeve', name: 'Fullsleeve', description: 'Full-sleeve tees built for layering and cool evenings.', sortOrder: 2 },
  { slug: 'drsleeve', name: 'Drsleeve', description: 'Drop-shoulder tees with a relaxed streetwear drape.', sortOrder: 3 },
  { slug: 'printed-tees', name: 'Printed Tees', description: 'Graphic and art-driven printed tees.', sortOrder: 4 },
  { slug: 'ringer-tees', name: 'Ringer Tees', description: 'Contrast ringer collars and cuffs with retro energy.', sortOrder: 5 },
  { slug: 'henley', name: 'Henley', description: 'Button-placket henleys in waffle and jersey knits.', sortOrder: 6 },
  { slug: 'waffle', name: 'Waffle', description: 'Thermal waffle knit tees and long sleeves with textured honeycomb weave.', sortOrder: 7 },
  { slug: 'trackpants', name: 'Trackpants', description: 'Tapered and relaxed trackpants for everyday movement.', sortOrder: 8 },
  { slug: 'sweatpants', name: 'Sweatpants', description: 'Heavyweight fleece sweatpants with a clean silhouette.', sortOrder: 9 }
]

export async function seedIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) {
    return false
  }

  const [productCount] = await db.select({ value: count() }).from(products)
  if (productCount && productCount.value > 0) {
    return false
  }

  console.log(`Seeding ${CATEGORY_SEED.length} categories...`)
  await db.insert(categories).values(CATEGORY_SEED).onConflictDoNothing()

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
