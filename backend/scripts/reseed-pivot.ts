import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { getDatabaseUrl, ensureSslMode, maskDatabaseUrl } from '../src/db/index.js'
import { products as productsTable, navigationItems as navTable } from '../src/db/schema.js'
import { PRODUCTS } from '../src/data/products.js'
import { DEFAULT_NAV_ITEMS } from '../src/store/navStore.js'

async function reseedPivot() {
  const rawUrl = getDatabaseUrl()
  if (!rawUrl) {
    console.error('❌ Database URL is not set in DATABASE_URL.')
    process.exit(1)
  }

  const databaseUrl = ensureSslMode(rawUrl)
  console.log(`🚀 Connecting to database: ${maskDatabaseUrl(databaseUrl)}`)

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  console.log('🔄 Cleaning old products (removing all jeans and legacy items)...')
  await db.delete(productsTable)

  console.log(`📦 Inserting ${PRODUCTS.length} new T-Shirt & Bottomwear products into database...`)
  for (const p of PRODUCTS) {
    await db.insert(productsTable).values({
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
      sizes: p.sizes ?? null
    })
  }

  console.log('🔄 Updating navigation_items table with the 8 new nav items...')
  await db.delete(navTable)
  for (const nav of DEFAULT_NAV_ITEMS) {
    await db.insert(navTable).values({
      id: nav.id,
      label: nav.label,
      href: nav.href,
      type: nav.type,
      targetValue: nav.targetValue ?? null,
      badge: nav.badge ?? null,
      order: nav.order,
      isActive: nav.isActive,
      openInNewTab: nav.openInNewTab
    })
  }

  console.log('🔍 Verifying updated database contents:')
  const dbProducts = await db.select().from(productsTable)
  console.log(`✅ Products in DB: ${dbProducts.length}`)
  console.log('   Categories present:', Array.from(new Set(dbProducts.map(p => p.category))))

  const dbNavs = await db.select().from(navTable)
  console.log(`✅ Navigation items in DB: ${dbNavs.length}`)
  for (const n of dbNavs) {
    console.log(`   - [${n.order}] ${n.label} -> ${n.href} (${n.targetValue})`)
  }

  console.log('\n🎉 DB migration & reseed complete! All jeans removed, T-Shirts and Bottomwear populated.')
}

reseedPivot()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reseed error:', err)
    process.exit(1)
  })
