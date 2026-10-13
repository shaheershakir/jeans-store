import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { getDatabaseUrl, ensureSslMode, maskDatabaseUrl } from '../src/db/index.js'
import {
  generateBaseSku,
  generateProductScopedSku,
  getColorCode,
  getSizeCode
} from '../src/services/skuService.js'

interface ExistingProductRow {
  id: number
  store: string
  category: string
  name: string
  fit: string | null
  price: string
  price_num: number
  sizes: string[] | null
  color: string | null
  wash: string | null
}

interface VariantCandidate {
  productId: number
  category: string
  fit: string | null
  color: string
  size: string
  price: number
  stock: number
  reorderPoint: number
  weight: number
  barcode: string
  sku?: string
}

export async function runSkuMigration(): Promise<{
  success: boolean
  variantsCreated: number
  duplicatesResolved: number
  existingVariantsPreserved: number
}> {
  const rawUrl = getDatabaseUrl()
  if (!rawUrl) {
    console.warn('⚠️ DATABASE_URL is not set. Skipping Neon PostgreSQL migration.')
    return {
      success: true,
      variantsCreated: 0,
      duplicatesResolved: 0,
      existingVariantsPreserved: 0
    }
  }

  const databaseUrl = ensureSslMode(rawUrl)
  console.log(`🚀 Connecting to database: ${maskDatabaseUrl(databaseUrl)}`)
  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  console.log('📦 Step 1: Ensuring product_variants table exists...')
  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku VARCHAR(100) NOT NULL,
      size VARCHAR(50) NOT NULL,
      color VARCHAR(50) NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 15,
      reserved INTEGER NOT NULL DEFAULT 0,
      reorder_point INTEGER NOT NULL DEFAULT 5,
      weight INTEGER NOT NULL DEFAULT 250,
      barcode VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `

  console.log('🔍 Step 2: Checking existing products and variants...')
  const existingProducts = (await sql`
    SELECT id, store, category, name, fit, price, price_num, sizes, wash FROM products
  `) as unknown as ExistingProductRow[]

  console.log(`Found ${existingProducts.length} existing products in database.`)

  const existingVariants = (await sql`
    SELECT id, product_id, sku, size, color FROM product_variants
  `) as unknown as Array<{ id: number; product_id: number; sku: string; size: string; color: string }>

  console.log(`Found ${existingVariants.length} existing variants already in product_variants table.`)

  const existingProductVariantMap = new Map<number, Set<string>>()
  const skuUsage = new Map<string, number>() // sku -> product_id

  for (const v of existingVariants) {
    if (!existingProductVariantMap.has(v.product_id)) {
      existingProductVariantMap.set(v.product_id, new Set())
    }
    const comboKey = `${v.color.toLowerCase()}_${String(v.size).toUpperCase()}`
    existingProductVariantMap.get(v.product_id)!.add(comboKey)
    skuUsage.set(v.sku.toUpperCase(), v.product_id)
  }

  // Generate variants for products that have sizes defined but no variants in DB
  const candidates: VariantCandidate[] = []

  for (const p of existingProducts) {
    const rawSizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL']
    // Determine product color from wash or name
    let color = 'Black'
    if (p.wash) {
      if (p.wash.includes('/')) {
        const parts = p.wash.split('/')
        color = parts[parts.length - 1].trim()
      } else {
        color = p.wash
      }
    } else if (p.name.toLowerCase().includes('white')) {
      color = 'White'
    } else if (p.name.toLowerCase().includes('navy')) {
      color = 'Navy'
    } else if (p.name.toLowerCase().includes('grey') || p.name.toLowerCase().includes('gray')) {
      color = 'Grey'
    }

    const existingCombos = existingProductVariantMap.get(p.id) || new Set()

    for (const sz of rawSizes) {
      const comboKey = `${color.toLowerCase()}_${String(sz).toUpperCase()}`
      if (existingCombos.has(comboKey)) {
        // Variant already exists for this product, preserve it!
        continue
      }

      candidates.push({
        productId: p.id,
        category: p.category || 'printed-tees',
        fit: p.fit || 'Regular',
        color,
        size: sz,
        price: p.price_num || 999,
        stock: 20,
        reorderPoint: 5,
        weight: 250,
        barcode: `890${String(10000000000 + p.id * 1000 + candidates.length).slice(0, 10)}`
      })
    }
  }

  console.log(`Identified ${candidates.length} new variants to generate and insert.`)

  // Step 3: Duplicate detection and collision resolution
  let duplicatesResolved = 0

  for (const c of candidates) {
    const baseSku = generateBaseSku({
      category: c.category,
      productType: c.fit || 'Regular',
      color: c.color,
      size: c.size,
      productId: c.productId
    })

    const claimedBy = skuUsage.get(baseSku)
    if (claimedBy !== undefined && claimedBy !== c.productId) {
      // Collision detected! Use stable product-specific code
      const resolvedSku = generateProductScopedSku({
        category: c.category,
        productType: c.fit || 'Regular',
        productId: c.productId,
        color: c.color,
        size: c.size
      })
      console.log(`⚠️ Collision detected for SKU "${baseSku}" (owned by product ${claimedBy}). Resolving to "${resolvedSku}" for product ${c.productId}.`)
      c.sku = resolvedSku
      skuUsage.set(resolvedSku, c.productId)
      duplicatesResolved++
    } else {
      c.sku = baseSku
      skuUsage.set(baseSku, c.productId)
    }
  }

  // Step 4: Insert candidates in batch
  let variantsCreated = 0
  for (const c of candidates) {
    await sql`
      INSERT INTO product_variants (
        product_id, sku, size, color, price, stock, reserved, reorder_point, weight, barcode, status
      ) VALUES (
        ${c.productId},
        ${c.sku!},
        ${c.size},
        ${c.color},
        ${c.price},
        ${c.stock},
        0,
        ${c.reorderPoint},
        ${c.weight},
        ${c.barcode},
        'Active'
      )
    `
    variantsCreated++
  }

  console.log('🔒 Step 5: Applying unique constraint and composite indices...')
  // Detect any duplicates in database before applying unique index
  const duplicatesInDb = (await sql`
    SELECT sku, COUNT(*) as cnt
    FROM product_variants
    GROUP BY sku
    HAVING COUNT(*) > 1
  `) as unknown as Array<{ sku: string; cnt: string }>

  if (duplicatesInDb.length > 0) {
    throw new Error(`Cannot apply unique constraint: detected duplicate SKUs in database: ${JSON.stringify(duplicatesInDb)}`)
  }

  // Apply unique constraint if not exists
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_sku_unique'
      ) THEN
        ALTER TABLE product_variants ADD CONSTRAINT product_variants_sku_unique UNIQUE (sku);
      END IF;
    END $$;
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_color_size_idx
    ON product_variants (product_id, color, size);
  `

  console.log('✅ Migration successfully applied unique constraint and indices.')
  console.log(`📊 Summary: ${variantsCreated} variants created, ${duplicatesResolved} collisions resolved, ${existingVariants.length} existing variants preserved.`)

  return {
    success: true,
    variantsCreated,
    duplicatesResolved,
    existingVariantsPreserved: existingVariants.length
  }
}

// Always execute when run directly
runSkuMigration()
  .then((res) => {
    console.log('🎉 Migration execution complete:', res)
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  })

