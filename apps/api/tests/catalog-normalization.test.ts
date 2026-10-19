import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { ProductStore } from '../src/store/productStore.js'
import type { Product } from '../src/schemas/product.js'

describe('Phase 2: Catalog Normalization & Schema V2', () => {
  const app = buildApp({ enableLogging: false })

  const mockSeed: Product[] = [
    {
      id: 101,
      store: 'teesgarage',
      category: 'stripes',
      name: 'Classic Vintage Stripes Tee',
      price: '₹999',
      priceNum: 999,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: '100% cotton yarn-dyed stripes',
      status: 'active',
      adminData: { status: 'Active' }
    },
    {
      id: 102,
      store: 'teesgarage',
      category: 'printed-tees',
      name: 'Draft Graphic Tee',
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Unreleased graphic tee in draft mode',
      status: 'draft',
      adminData: { status: 'Draft' }
    },
    {
      id: 103,
      store: 'teesgarage',
      category: 'fullsleeve',
      name: 'Archived Heavyweight Tee',
      price: '₹1,499',
      priceNum: 1499,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Discontinued winter collection',
      status: 'archived',
      adminData: { status: 'Archived' }
    }
  ]

  test('GET /api/categories returns 13 seeded categories including jeans', async () => {
    const res = await request(app).get('/api/categories')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.categories))
    assert.ok(res.body.categories.includes('stripes'))
    assert.ok(res.body.categories.includes('fullsleeve'))
    assert.ok(res.body.categories.includes('drsleeve'))
    assert.ok(res.body.categories.includes('jeans'), 'Categories must include jeans')
    assert.ok(res.body.categories.length >= 13)
  })

  test('Category validation rejects unknown category with 400', async () => {
    const store = new ProductStore([])
    await assert.rejects(
      async () => {
        await store.create({
          store: 'teesgarage',
          category: 'invalid-category-xyz',
          name: 'Invalid Category Tee',
          price: '₹999',
          priceNum: 999,
          img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
          img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
          desc: 'Test description'
        } as any)
      },
      /Unknown category "invalid-category-xyz"/
    )
  })

  test('Category validation allows valid categories and sets categoryId', async () => {
    const store = new ProductStore([])
    const product = await store.create({
      store: 'teesgarage',
      category: 'jeans',
      name: 'Raw Selvedge Denim Jeans',
      price: '₹2,999',
      priceNum: 2999,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Heavyweight raw selvedge denim'
    })

    assert.equal(product.category, 'jeans')
    assert.equal(typeof product.categoryId, 'number')
    assert.ok(product.categoryId! > 0)
  })

  test('Slug generation produces clean unique slugs and handles collisions', async () => {
    const store = new ProductStore([])
    const p1 = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name: 'Retro Striped Tee',
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Striped tee'
    })

    assert.equal(p1.slug, 'retro-striped-tee')

    const p2 = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name: 'Retro Striped Tee',
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Duplicate name'
    })

    assert.equal(p2.slug, 'retro-striped-tee-2')

    // Find by slug
    const found = await store.getBySlug('retro-striped-tee')
    assert.ok(found)
    assert.equal(found?.id, p1.id)
  })

  test('Descriptive attributes are packed into attributes JSON and returned in toProduct', async () => {
    const store = new ProductStore([])
    const created = await store.create({
      store: 'teesgarage',
      category: 'fullsleeve',
      name: 'Premium Waffle Knit Henley',
      price: '₹1,599',
      priceNum: 1599,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Comfortable waffle knit',
      fabric: '100% Combed Cotton',
      material: 'Waffle Knit',
      neckType: 'Henley Collar',
      sleeveLength: 'Full Sleeve',
      pattern: 'Solid Waffle',
      buttons: '3-button placket'
    } as any)

    assert.equal(created.attributes?.fabric, '100% Combed Cotton')
    assert.equal(created.attributes?.material, 'Waffle Knit')
    assert.equal(created.attributes?.neckType, 'Henley Collar')
    assert.equal(created.attributes?.sleeveLength, 'Full Sleeve')
    assert.equal(created.attributes?.buttons, '3-button placket')

    // Update attributes
    const updated = await store.update(created.id, {
      fabric: '100% Organic Pima Cotton',
      trimColor: 'Navy Contrast'
    } as any)

    assert.ok(updated)
    assert.equal(updated?.attributes?.fabric, '100% Organic Pima Cotton')
    assert.equal(updated?.attributes?.trimColor, 'Navy Contrast')
    assert.equal(updated?.attributes?.material, 'Waffle Knit', 'Preserves unmodified attributes')
  })

  test('Status synchronization between status column and adminData.status', async () => {
    const store = new ProductStore([])

    // Active
    const pActive = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name: 'Active Tee',
      price: '₹899',
      priceNum: 899,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Active product',
      status: 'active'
    })
    assert.equal(pActive.status, 'active')
    assert.equal(pActive.adminData?.status, 'Active')

    // Draft
    const pDraft = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name: 'Draft Tee',
      price: '₹899',
      priceNum: 899,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Draft product',
      status: 'draft'
    })
    assert.equal(pDraft.status, 'draft')
    assert.equal(pDraft.adminData?.status, 'Draft')

    // Archived via update
    const pArchived = await store.update(pActive.id, { status: 'archived' })
    assert.equal(pArchived?.status, 'archived')
    assert.equal(pArchived?.adminData?.status, 'Archived')
  })

  test('Storefront product list excludes draft and archived products, admin list includes all', async () => {
    const store = new ProductStore(mockSeed)

    // Storefront query
    const storefrontProducts = await store.list({ status: 'active' })
    assert.equal(storefrontProducts.length, 1)
    assert.equal(storefrontProducts[0].name, 'Classic Vintage Stripes Tee')

    // Admin query
    const adminProducts = await store.list({ includeAllStatuses: true })
    assert.equal(adminProducts.length, 3)
    assert.ok(adminProducts.some((p) => p.status === 'draft'))
    assert.ok(adminProducts.some((p) => p.status === 'archived'))
  })
})
