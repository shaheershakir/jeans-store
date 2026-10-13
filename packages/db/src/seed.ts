import { db, isDatabaseConfigured } from './index.js'
import { products } from './schema.js'
import { count } from 'drizzle-orm'

export const INITIAL_PRODUCTS = [
  {
    id: 0,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Classic Breton Heavyweight Striped Tee',
    fit: 'Boxy',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    badge: 'Bestseller',
    desc: '260 GSM combed cotton featuring traditional Breton nautical stripes, sturdy 1.25" ribbed collar, and relaxed drop-shoulder drape.',
    wash: 'Ecru / Navy',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 1,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Vintage Skate Micro-Stripe Tee',
    fit: 'Relaxed',
    price: '₹1,249',
    priceNum: 1249,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Fine gauge horizontal micro-stripes knit from yarn-dyed ring-spun cotton. Pre-shrunk with a soft vintage silicone wash.',
    wash: 'Washed Black / Ash',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 2,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Bold Block Stripe Oversized Tee',
    fit: 'Oversized',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    badge: undefined,
    desc: 'Wide horizontal contrast block stripes with reinforced twin-needle hems and an ultra-relaxed streetwear silhouette.',
    wash: 'Forest Green / Cream',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  }
]

export async function seedIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) {
    return false
  }

  try {
    const [result] = await db.select({ value: count() }).from(products)
    if (result && result.value > 0) {
      return false
    }

    console.log(`Seeding database with ${INITIAL_PRODUCTS.length} initial products...`)
    for (const p of INITIAL_PRODUCTS) {
      await db.insert(products).values({
        id: p.id,
        store: p.store,
        category: p.category,
        name: p.name,
        fit: p.fit,
        price: p.price,
        priceNum: p.priceNum,
        img: p.img,
        img2: p.img2,
        badge: p.badge ?? null,
        desc: p.desc,
        wash: p.wash,
        sizes: p.sizes ?? null
      })
    }
    console.log('Database seeded successfully.')
    return true
  } catch (err) {
    console.error('Error during database seeding check:', err)
    return false
  }
}

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
