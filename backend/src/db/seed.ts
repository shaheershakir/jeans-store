import { db, isDatabaseConfigured } from './index.js'
import { products } from './schema.js'
import { PRODUCTS } from '../data/products.js'
import { count } from 'drizzle-orm'

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
        name: p.name,
        fit: p.fit,
        price: p.price,
        priceNum: p.priceNum,
        img: p.img,
        img2: p.img2,
        badge: p.badge,
        desc: p.desc,
        wash: p.wash
      })
    }
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
