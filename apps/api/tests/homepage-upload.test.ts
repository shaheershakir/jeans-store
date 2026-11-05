import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { homepageStore } from '../src/store/homepageStore.js'

describe('Homepage Picture Upload & GCS/Storage Integration', () => {
  const app = buildApp({ enableLogging: false })
  const adminKey = process.env.ADMIN_API_KEY || 'local_dev_admin_key'

  test('POST /api/uploads/homepage requires admin authentication', async () => {
    const fakeWebp = Buffer.from('RIFF....WEBPVP8 ...valid webp content')
    const res = await request(app)
      .post('/api/uploads/homepage')
      .set('Content-Type', 'image/webp')
      .send(fakeWebp)

    assert.equal(res.status, 401, 'Unauthenticated upload should be rejected with 401')
  })

  test('POST /api/uploads/homepage rejects invalid image content or mime type', async () => {
    const invalidData = Buffer.from('this is not an image')
    const res = await request(app)
      .post('/api/uploads/homepage')
      .set('x-admin-key', adminKey)
      .set('Content-Type', 'text/plain')
      .send(invalidData)

    assert.equal(res.status, 400, 'Invalid image format should return 400')
  })

  test('POST /api/uploads/homepage accepts valid WebP image and returns storage key and url', async () => {
    // Valid WEBP header: RIFF + 4 bytes + WEBP
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // 'WEBP'
      0x56, 0x50, 0x38, 0x20  // 'VP8 '
    ])

    const res = await request(app)
      .post('/api/uploads/homepage')
      .set('x-admin-key', adminKey)
      .set('Content-Type', 'image/webp')
      .send(validWebp)

    assert.equal(res.status, 201, `Upload failed with status ${res.status}: ${JSON.stringify(res.body)}`)
    assert.ok(res.body.key, 'Response must include storage key')
    assert.ok(res.body.key.startsWith('homepage/'), 'Key must be prefixed with homepage/')
    assert.ok(res.body.key.endsWith('.webp'), 'Key must end with .webp')
    assert.ok(res.body.url, 'Response must include public image url')
    assert.ok(res.body.url.includes(res.body.key) || res.body.url.includes('storage.googleapis.com'), 'URL must reference the image')
  })

  test('POST /api/uploads/homepage accepts valid JPEG image', async () => {
    // Valid JPEG header: 0xFF, 0xD8, 0xFF
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])

    const res = await request(app)
      .post('/api/uploads/homepage')
      .set('x-admin-key', adminKey)
      .set('Content-Type', 'image/jpeg')
      .send(validJpeg)

    assert.equal(res.status, 201)
    assert.ok(res.body.key.startsWith('homepage/'))
    assert.ok(res.body.key.endsWith('.jpg'))
  })

  test('PUT /api/homepage saves uploaded hero picture URL and GET /api/homepage returns it', async () => {
    const testImageUrl = 'https://storage.googleapis.com/clothing-store-bucket/homepage/test-hero-image.webp'

    const current = await homepageStore.get()
    const updated = {
      ...current,
      hero: {
        ...current.hero,
        imageUrl: testImageUrl
      }
    }

    const saveRes = await request(app)
      .put('/api/homepage')
      .set('x-admin-key', adminKey)
      .send({ config: updated })

    assert.equal(saveRes.status, 200, `Save failed with: ${JSON.stringify(saveRes.body)}`)
    assert.equal(saveRes.body.config.hero.imageUrl, testImageUrl)

    const getRes = await request(app).get('/api/homepage')
    assert.equal(getRes.status, 200)
    assert.equal(getRes.body.config.hero.imageUrl, testImageUrl)
  })
})
