import { db, isDatabaseConfigured } from './index.js'
import { categories, storeSettings } from './schema.js'

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

/**
 * Seeds the reference/configuration tables only. The canonical product seed
 * lives in apps/api/src/db/seed.ts because it imports the source catalog.
 */
export async function seedIfEmpty(): Promise<boolean> {
  if (!isDatabaseConfigured() || !db) {
    return false
  }

  await db.insert(categories).values(CATEGORY_SEED).onConflictDoNothing({ target: categories.slug })
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

  console.log('Reference data seeded. Run the API seed for the product catalog.')
  return true
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
