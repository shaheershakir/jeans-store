import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { ProductStore, slugify } from '../src/store/productStore.js'
import { isDatabaseConfigured } from '../src/db/index.js'

describe('Phase 2: Catalog Normalization & Schema V2', () => {
  const app = buildApp({ enableLogging: false })

  test('GET /api/categories returns the seeded product categories', async () => {
    const res = await request(app).get('/api/categories')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.categories))
    assert.ok(res.body.categories.includes('stripes'))
    assert.ok(res.body.categories.includes('fullsleeve'))
    assert.ok(res.body.categories.includes('drsleeve'))
    assert.ok(res.body.categories.includes('waffle'))
    assert.ok(res.body.categories.length >= 9)
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
      category: 'waffle',
      name: `Waffle Knit Henley ${Date.now()}`,
      price: '₹1,599',
      priceNum: 1599,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Textured waffle knit henley'
    })

    assert.equal(product.category, 'waffle')
    assert.equal(typeof product.categoryId, 'number')
    assert.ok(product.categoryId! > 0)
  })

  test('Slug generation produces clean unique slugs and handles collisions', async () => {
    const store = new ProductStore([])
    const name = `Retro Striped Tee ${Date.now()}`
    const expectedSlug = slugify(name)
    const p1 = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name,
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Striped tee'
    })

    assert.equal(p1.slug, expectedSlug)

    const p2 = await store.create({
      store: 'teesgarage',
      category: 'stripes',
      name,
      price: '₹1,299',
      priceNum: 1299,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Duplicate name'
    })

    assert.equal(p2.slug, `${expectedSlug}-2`)

    // Find by slug
    const found = await store.getBySlug(expectedSlug)
    assert.ok(found)
    assert.equal(found?.id, p1.id)
  })

  const skipAttributes = isDatabaseConfigured()
    ? 'Free-form attributes are only persisted by the in-memory store; the SQL schema has no attributes column.'
    : false
  test('Descriptive attributes are packed into attributes JSON and returned in toProduct', { skip: skipAttributes }, async () => {
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
    const store = new ProductStore([])
    const prefix = `Status Filter ${Date.now()}`
    const base = {
      store: 'teesgarage' as const,
      category: 'stripes',
      price: '₹899',
      priceNum: 899,
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      desc: 'Status filter fixture'
    }
    const active = await store.create({ ...base, name: `${prefix} Active`, status: 'active' })
    await store.create({ ...base, name: `${prefix} Draft`, status: 'draft' })
    await store.create({ ...base, name: `${prefix} Archived`, status: 'archived' })

    // Storefront query
    const storefrontProducts = await store.list({ status: 'active', q: prefix })
    assert.equal(storefrontProducts.length, 1)
    assert.equal(storefrontProducts[0].name, active.name)

    // Admin query
    const adminProducts = await store.list({ includeAllStatuses: true, q: prefix })
    assert.equal(adminProducts.length, 3)
    assert.ok(adminProducts.some((p) => p.status === 'draft'))
    assert.ok(adminProducts.some((p) => p.status === 'archived'))
  })
})
