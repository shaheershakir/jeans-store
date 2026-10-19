import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ProductStore, normalizeImageInputs } from '../src/store/productStore.js'
import { LocalStorageDriver, getStorage } from '../src/services/storage.js'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'
import type { Product } from '../src/schemas/product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Phase 1: Key-Based Image Storage & Product Images Roundtrip', () => {
  const uploadDir = path.resolve(__dirname, '../.local-uploads')

  after(async () => {
    // Clean up test files created in local uploads directory
    try {
      await fs.rm(uploadDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  test('LocalStorageDriver put, list, and delete operations', async () => {
    const driver = new LocalStorageDriver(uploadDir, 'http://localhost:4000/assets')
    const key = `products/test-${Date.now()}.webp`
    const payload = Buffer.from('RIFF....WEBPVP8 ...fake webp content')

    await driver.put(key, payload, 'image/webp')

    // Verify file exists on disk
    const diskPath = path.join(uploadDir, key)
    const exists = await fs.stat(diskPath).then(() => true).catch(() => false)
    assert.equal(exists, true, 'File should exist on disk in upload directory')

    // Verify list includes the key
    const listed: string[] = []
    for await (const item of driver.list('products/')) {
      listed.push(item.key)
    }
    assert.ok(listed.includes(key), 'driver.list should include uploaded key')

    // Verify delete removes file
    await driver.delete(key)
    const existsAfter = await fs.stat(diskPath).then(() => true).catch(() => false)
    assert.equal(existsAfter, false, 'File should be removed after delete')
  })

  test('normalizeImageInputs validates URLs and rejects base64 data: URLs', () => {
    // Rejects data: URLs
    assert.throws(
      () => {
        normalizeImageInputs('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', '')
      },
      /Base64 data: URLs are not allowed/
    )

    // Rejects non-HTTPS external URLs
    assert.throws(
      () => {
        normalizeImageInputs('http://insecure-site.com/image.jpg', '')
      },
      /must be a valid HTTPS URL/
    )

    // Accepts storage keys via ASSET_BASE_URL
    const sampleKey = 'products/f47ac10b-58cc-4372-a567-0e02b2c3d479.webp'
    const fullUrl = `https://storage.googleapis.com/test-bucket/${sampleKey}`
    process.env.ASSET_BASE_URL = 'https://storage.googleapis.com/test-bucket'

    const normalized = normalizeImageInputs(fullUrl, fullUrl, [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'
    ])

    assert.equal(normalized.length, 2)
    assert.equal(normalized[0].storageKey, sampleKey)
    assert.equal(normalized[0].externalUrl, null)
    assert.equal(normalized[0].position, 0)

    assert.equal(normalized[1].storageKey, null)
    assert.equal(normalized[1].externalUrl, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800')
    assert.equal(normalized[1].position, 1)
  })

  test('ProductStore create -> update -> read roundtrip with image dual-write and mapper fallback', async () => {
    const store = new ProductStore([])
    const runId = Date.now()

    const created = await store.create({
      store: 'teesgarage',
      category: 'printed-tees',
      name: `Key Image Graphic Tee ${runId}`,
      fit: 'Regular',
      price: '₹999',
      priceNum: 999,
      img: `https://storage.googleapis.com/test-bucket/products/primary-${runId}.webp`,
      img2: `https://storage.googleapis.com/test-bucket/products/hover-${runId}.webp`,
      images: [
        `https://storage.googleapis.com/test-bucket/products/primary-${runId}.webp`,
        `https://storage.googleapis.com/test-bucket/products/hover-${runId}.webp`,
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'
      ],
      desc: 'Tested with storage keys',
      variants: [{ color: 'White', size: 'M', price: 999 }]
    })

    assert.ok(created.id !== undefined)
    assert.equal(created.name, `Key Image Graphic Tee ${runId}`)
    assert.equal(created.img, `https://storage.googleapis.com/test-bucket/products/primary-${runId}.webp`)
    assert.equal(created.img2, `https://storage.googleapis.com/test-bucket/products/hover-${runId}.webp`)
    assert.equal(created.images.length, 3)

    // Update images
    const updated = await store.update(created.id, {
      img: `https://storage.googleapis.com/test-bucket/products/new-single-${runId}.webp`,
      img2: `https://storage.googleapis.com/test-bucket/products/new-single-${runId}.webp`,
      images: [`https://storage.googleapis.com/test-bucket/products/new-single-${runId}.webp`]
    })

    assert.ok(updated)
    assert.equal(updated.img, `https://storage.googleapis.com/test-bucket/products/new-single-${runId}.webp`)
    // img2 falls back to img when only one unique image exists
    assert.equal(updated.img2, `https://storage.googleapis.com/test-bucket/products/new-single-${runId}.webp`)
    assert.equal(updated.images.length, 1)

    // Verify reading by ID preserves the resolved images
    const fetched = await store.getById(created.id)
    assert.ok(fetched)
    assert.equal(fetched.img, updated.img)
    assert.equal(fetched.img2, updated.img2)
    assert.equal(fetched.images.length, 1)
  })
})
