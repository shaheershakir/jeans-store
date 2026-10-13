import { db, isDatabaseConfigured } from './index.js'
import { products, productVariants } from './schema.js'
import { PRODUCTS } from '../data/products.js'
import { count } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function seedIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) {
    return false
  }

  try {
    const [result] = await db.select({ value: count() }).from(products)
    if (result && result.value > 0) {
      return false
    }

    console.log(`Seeding database with ${PRODUCTS.length} initial products...`)
    for (const p of PRODUCTS) {
      await db.insert(products).values({
        id: p.id,
        store: p.store || 'teesgarage',
        category: p.category || 'printed-tees',
        name: p.name,
        fit: p.fit,
        price: p.price,
        priceNum: p.priceNum,
        img: p.img,
        img2: p.img2,
        badge: p.badge,
        desc: p.desc,
        wash: p.wash,
        sizes: p.sizes ?? null,
        images: p.images ?? [],
        adminData: {
          status: p.badge === 'Draft' ? 'Draft' : 'Active',
          material: p.material ?? p.fabric ?? 'Cotton',
          pattern: p.pattern ?? '',
          weightGrams: p.category === 'trackpants' || p.category === 'sweatpants' ? 650 : 350
        }
      })

      const sizes = p.sizes?.length ? p.sizes : ['S', 'M', 'L', 'XL']
      const color = p.color || 'Black'
      const weight = p.category === 'trackpants' || p.category === 'sweatpants' ? 650 : 350
      for (const size of sizes) {
        await db.insert(productVariants).values({
          productId: p.id,
          sku: `${p.id}-${p.category}-${color}-${size}`.replace(/[^a-z0-9-]/gi, '').toUpperCase(),
          size: String(size),
          color,
          price: p.priceNum,
          stock: 20,
          reserved: 0,
          reorderPoint: 5,
          weight,
          status: 'Active'
        })
      }
    }
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 0) + 1, false)`)
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('product_variants', 'id'), COALESCE((SELECT MAX(id) FROM product_variants), 0) + 1, false)`)
    console.log('Database seeded successfully.')
    return true
  } catch (err) {
    console.error('Error during database seeding check:', err)
    return false
  }
}

// If run directly via CLI (tsx src/db/seed.ts)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedIfEmpty()
    .then((seeded) => {
      console.log(seeded ? 'Seed completed.' : 'Seed skipped or DB not configured.')
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
