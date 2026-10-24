import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateBaseSku,
  generateProductScopedSku,
  formatProductCode,
  getCategoryCode,
  getProductTypeCode,
  getColorCode,
  getSizeCode,
  resolveSkuWithCollisionCheck
} from '../src/services/skuService.js'
import { ProductStore } from '../src/store/productStore.js'
import { PRODUCTS } from '../src/data/products.js'

describe('SKU Generation Format & Mapping Rules', () => {
  test('generates exact SKUs from user specification table', () => {
    // 1. Striped Oversized T-shirt, Black, M -> STR-OVS-BLK-M
    const sku1 = generateBaseSku({ category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M' })
    assert.equal(sku1, 'STR-OVS-BLK-M')

    // 2. Striped Oversized T-shirt, Black, L -> STR-OVS-BLK-L
    const sku2 = generateBaseSku({ category: 'stripes', productType: 'Oversized', color: 'Black', size: 'L' })
    assert.equal(sku2, 'STR-OVS-BLK-L')

    // 3. Printed T-shirt, White, M -> PRT-REG-WHT-M
    const sku3 = generateBaseSku({ category: 'printed-tees', productType: 'Regular', color: 'White', size: 'M' })
    assert.equal(sku3, 'PRT-REG-WHT-M')

    // 4. Full Sleeve T-shirt, Navy, XL -> FSL-REG-NVY-XL
    const sku4 = generateBaseSku({ category: 'fullsleeve', productType: 'Regular', color: 'Navy', size: 'XL' })
    assert.equal(sku4, 'FSL-REG-NVY-XL')

    // 5. Henley T-shirt, Black, M -> HEN-REG-BLK-M
    const sku5 = generateBaseSku({ category: 'henley', productType: 'Regular', color: 'Black', size: 'M' })
    assert.equal(sku5, 'HEN-REG-BLK-M')

    // 6. Trackpants, Black, L -> TRK-REG-BLK-L
    const sku6 = generateBaseSku({ category: 'trackpants', productType: 'Regular', color: 'Black', size: 'L' })
    assert.equal(sku6, 'TRK-REG-BLK-L')

    // 7. Sweatpants, Grey, M -> SWT-REG-GRY-M
    const sku7 = generateBaseSku({ category: 'sweatpants', productType: 'Regular', color: 'Grey', size: 'M' })
    assert.equal(sku7, 'SWT-REG-GRY-M')
  })

  test('supports all required store categories', () => {
    assert.equal(getCategoryCode('stripes'), 'STR')
    assert.equal(getCategoryCode('fullsleeve'), 'FSL')
    assert.equal(getCategoryCode('full-sleeve'), 'FSL')
    assert.equal(getCategoryCode('drsleeve'), 'TQS')
    assert.equal(getCategoryCode('three-quarter-sleeve'), 'TQS')
    assert.equal(getCategoryCode('printed-tees'), 'PRT')
    assert.equal(getCategoryCode('ringer-tees'), 'RNG')
    assert.equal(getCategoryCode('henley'), 'HEN')
    assert.equal(getCategoryCode('trackpants'), 'TRK')
    assert.equal(getCategoryCode('sweatpants'), 'SWT')
    assert.equal(getCategoryCode('t-shirts'), 'TSH')
    assert.equal(getCategoryCode('hoodies'), 'HOD')
    assert.equal(getCategoryCode('jeans'), 'JNS')
  })

  test('supports product types and fits with REG default', () => {
    assert.equal(getProductTypeCode('Oversized'), 'OVS')
    assert.equal(getProductTypeCode('Regular'), 'REG')
    assert.equal(getProductTypeCode('Boxy'), 'BOX')
    assert.equal(getProductTypeCode('Relaxed'), 'RLX')
    assert.equal(getProductTypeCode('Straight'), 'STR')
    assert.equal(getProductTypeCode('Slim'), 'SLM')
    assert.equal(getProductTypeCode('Skinny'), 'SKN')
    assert.equal(getProductTypeCode('Baggy'), 'BAG')
    assert.equal(getProductTypeCode('Bootcut'), 'BTC')
    assert.equal(getProductTypeCode('Wide'), 'WID')
    assert.equal(getProductTypeCode(undefined), 'REG')
  })

  test('supports consistent color abbreviations', () => {
    assert.equal(getColorCode('Black'), 'BLK')
    assert.equal(getColorCode('White'), 'WHT')
    assert.equal(getColorCode('Navy'), 'NVY')
    assert.equal(getColorCode('Navy Blue'), 'NVY')
    assert.equal(getColorCode('Grey'), 'GRY')
    assert.equal(getColorCode('Gray'), 'GRY')
    assert.equal(getColorCode('Blue'), 'BLU')
    assert.equal(getColorCode('Green'), 'GRN')
    assert.equal(getColorCode('Olive'), 'OLV')
    assert.equal(getColorCode('Red'), 'RED')
    assert.equal(getColorCode('Beige'), 'BGE')
  })

  test('supports letter and numeric size codes', () => {
    assert.equal(getSizeCode('XS'), 'XS')
    assert.equal(getSizeCode('S'), 'S')
    assert.equal(getSizeCode('M'), 'M')
    assert.equal(getSizeCode('L'), 'L')
    assert.equal(getSizeCode('XL'), 'XL')
    assert.equal(getSizeCode('XXL'), 'XXL')
    assert.equal(getSizeCode(28), '28')
    assert.equal(getSizeCode(32), '32')
    assert.equal(getSizeCode('34'), '34')
  })
})

describe('Duplicate SKU Handling & Collision Resolution', () => {
  test('uses standard 4-part SKU when no collision exists', () => {
    const sku = resolveSkuWithCollisionCheck(
      { category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M', productId: 1 },
      () => false // not claimed by any other product
    )
    assert.equal(sku, 'STR-OVS-BLK-M')
  })

  test('resolves collision using stable product code when base SKU is taken', () => {
    // When STR-OVS-BLK-M is already claimed by another product
    const isClaimed = (candidateSku: string) => candidateSku === 'STR-OVS-BLK-M'

    const sku = resolveSkuWithCollisionCheck(
      { category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M', productId: 12 },
      isClaimed
    )
    // Resolves to stable product-specific code: STR-OVS-P012-BLK-M
    assert.equal(sku, 'STR-OVS-P012-BLK-M')
  })

  test('generates properly padded product scoped SKU', () => {
    assert.equal(
      generateProductScopedSku({ category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M', productId: 1 }),
      'STR-OVS-P001-BLK-M'
    )
    assert.equal(
      generateProductScopedSku({ category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M', productId: 12 }),
      'STR-OVS-P012-BLK-M'
    )
    assert.equal(
      generateProductScopedSku({ category: 'stripes', productType: 'Oversized', color: 'Black', size: 'M', productId: 105 }),
      'STR-OVS-P105-BLK-M'
    )
  })

  test('derives stable, collision-resistant product codes from UUID ids', () => {
    assert.equal(
      generateProductScopedSku({
        category: 'stripes',
        productType: 'Oversized',
        color: 'Black',
        size: 'M',
        productId: '00000000-0000-4000-8000-000000000012'
      }),
      'STR-OVS-P000012-BLK-M'
    )
    const codes = new Set(
      Array.from({ length: 100 }, (_, index) =>
        generateProductScopedSku({
          category: 'stripes',
          productType: 'Oversized',
          color: 'Black',
          size: 'M',
          productId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
        })
      )
    )
    assert.equal(codes.size, 100, 'seed UUIDs must not collide on product codes')
  })
})

describe('ProductStore Variant Operations & Concurrency Safety', () => {
  const store = new ProductStore(PRODUCTS.slice(0, 5))

  test('creates a product with auto-generated variant SKUs', async () => {
    const product = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name: 'Test Striped Tee Alpha',
      fit: 'Oversized',
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
      img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      desc: 'Test description',
      variants: [
        { color: 'Black', size: 'M', price: 1299 },
        { color: 'Black', size: 'L', price: 1299 }
      ]
    })

    assert.ok(product.id !== undefined)
    assert.equal(product.variants?.length, 2)
    const mVariant = product.variants?.find((v) => v.size === 'M')
    const lVariant = product.variants?.find((v) => v.size === 'L')
    assert.ok(mVariant, 'Variant M should exist')
    assert.ok(lVariant, 'Variant L should exist')
    assert.ok(mVariant.sku.startsWith('STR-OVS-'))
    assert.ok(mVariant.sku.endsWith('-BLK-M'))
    assert.ok(lVariant.sku.endsWith('-BLK-L'))
  })

  test('prevents duplicate variants for the same product', async () => {
    await assert.rejects(
      async () => {
        await store.create({
          store: 'teesgarage',
          category: 'stripes',
          name: 'Invalid Duplicate Tee',
          fit: 'Oversized',
          price: '₹1,299',
          priceNum: 1299,
          img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
          img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
          desc: 'Test duplicate error',
          variants: [
            { color: 'Black', size: 'M', price: 1299 },
            { color: 'Black', size: 'M', price: 1299 } // Duplicate!
          ]
        })
      },
      /Duplicate variant/
    )
  })

  test('resolves collision between different products sharing identical attributes', async () => {
    const p1 = await store.create({
      store: 'teesgarage',
      category: 'henley',
      name: 'Henley Tee Version 1',
      fit: 'Regular',
      price: '₹1,199',
      priceNum: 1199,
      img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
      img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      desc: 'Version 1',
      variants: [{ color: 'Navy', size: 'XL', price: 1199 }]
    })

    const p2 = await store.create({
      store: 'teesgarage',
      category: 'henley',
      name: 'Henley Tee Version 2',
      fit: 'Regular',
      price: '₹1,199',
      priceNum: 1199,
      img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
      img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      desc: 'Version 2 with identical attributes',
      variants: [{ color: 'Navy', size: 'XL', price: 1199 }]
    })

    const sku1 = p1.variants![0].sku
    const sku2 = p2.variants![0].sku

    // Must not be identical!
    assert.notEqual(sku1, sku2)
    // Each SKU is either the shared standard code or carries its own product code.
    assert.ok(
      sku1 === 'HEN-REG-NVY-XL' || sku1.includes(formatProductCode(p1.id)),
      'first SKU should be standard or product-scoped'
    )
    assert.ok(
      sku2 === 'HEN-REG-NVY-XL' || sku2.includes(formatProductCode(p2.id)),
      'second SKU should be standard or product-scoped'
    )
  })

  test('preserves existing variant SKUs on product update and generates new SKU only for new variant', async () => {
    const original = await store.create({
      store: 'teesgarage',
      category: 'trackpants',
      name: 'Original Trackpants',
      fit: 'Regular',
      price: '₹1,499',
      priceNum: 1499,
      img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
      img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      desc: 'Trackpants',
      variants: [{ color: 'Black', size: 'L', price: 1499 }]
    })

    const originalSku = original.variants![0].sku
    const originalVariantId = original.variants![0].id

    // Update product: keep variant 0, add variant 1
    const updated = await store.update(original.id, {
      name: 'Updated Trackpants Name',
      variants: [
        {
          id: originalVariantId,
          sku: originalSku,
          color: 'Black',
          size: 'L',
          price: 1599,
          stock: 35
        },
        {
          color: 'Black',
          size: 'XL', // New variant
          price: 1599,
          stock: 10
        }
      ]
    })

    assert.equal(updated?.variants?.length, 2)
    // Original SKU preserved!
    assert.equal(updated?.variants?.[0].sku, originalSku)
    // New variant gets generated SKU
    assert.ok(updated?.variants?.[1].sku.includes('TRK-REG-'))
    assert.ok(updated?.variants?.[1].sku.endsWith('-BLK-XL'))
  })

  test('allows searching products by variant SKU', async () => {
    const list = await store.list({ sku: 'HEN-REG-NVY-XL' })
    assert.ok(list.length > 0)
    assert.ok(list.some((p) => p.variants?.some((v) => v.sku === 'HEN-REG-NVY-XL')))
  })

  test('concurrent creation handles collision safety without crashing or duplicate SKUs', async () => {
    const promises = Array.from({ length: 5 }, (_, idx) =>
      store.create({
        store: 'teesgarage',
        category: 'sweatpants',
        name: `Concurrent Sweatpants ${idx}`,
        fit: 'Regular',
        price: '₹1,399',
        priceNum: 1399,
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
        img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
        desc: 'Concurrent test',
        variants: [{ color: 'Grey', size: 'M', price: 1399 }]
      })
    )

    const results = await Promise.all(promises)
    const skus = results.map((r) => r.variants![0].sku)
    const uniqueSkus = new Set(skus)

    // All SKUs created must be unique across all 5 products!
    assert.equal(uniqueSkus.size, 5, `Expected 5 unique SKUs, got: ${JSON.stringify(skus)}`)
  })
})
