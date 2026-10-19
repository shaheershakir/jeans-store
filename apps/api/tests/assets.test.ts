import test from 'node:test'
import assert from 'node:assert/strict'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'

test('Asset URL and Storage Key helpers', async (t) => {
  await t.test('assetUrl formats storage keys with base URL', () => {
    const customBase = 'https://cdn.teesgarage.in'
    assert.equal(
      assetUrl('products/tee-1.webp', customBase),
      'https://cdn.teesgarage.in/products/tee-1.webp'
    )
    assert.equal(
      assetUrl('/products/tee-1.webp', customBase),
      'https://cdn.teesgarage.in/products/tee-1.webp'
    )
    // Custom base with trailing slash
    assert.equal(
      assetUrl('products/tee-1.webp', 'https://cdn.teesgarage.in/'),
      'https://cdn.teesgarage.in/products/tee-1.webp'
    )
    // Full external URLs remain untouched
    assert.equal(
      assetUrl('https://images.unsplash.com/photo-1234', customBase),
      'https://images.unsplash.com/photo-1234'
    )
    // URL-encoded path handling
    assert.equal(
      assetUrl('products/my photo.webp', customBase),
      'https://cdn.teesgarage.in/products/my%20photo.webp'
    )
    assert.equal(
      assetUrl('products/already%20encoded.webp', customBase),
      'https://cdn.teesgarage.in/products/already%20encoded.webp'
    )
    assert.equal(assetUrl(''), '')
  })

  await t.test('keyFromUrl extracts key from matching URLs', () => {
    const customBase = 'https://cdn.teesgarage.in'

    // Matches customBase
    assert.equal(
      keyFromUrl('https://cdn.teesgarage.in/products/item-123.webp', customBase),
      'products/item-123.webp'
    )

    // Matches legacy GCS URLs
    assert.equal(
      keyFromUrl('https://storage.googleapis.com/teesgarage-media/products/photo-uuid.jpg'),
      'products/photo-uuid.jpg'
    )

    // Decodes encoded paths
    assert.equal(
      keyFromUrl('https://storage.googleapis.com/teesgarage-media/products/photo%20with%20spaces.jpg'),
      'products/photo with spaces.jpg'
    )

    // Matches local assets endpoint
    assert.equal(
      keyFromUrl('http://localhost:4000/assets/products/local.png'),
      'products/local.png'
    )
    assert.equal(
      keyFromUrl('/assets/products/local.png'),
      'products/local.png'
    )

    // External URLs (Unsplash, external domains) return null
    assert.equal(
      keyFromUrl('https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800'),
      null
    )
    assert.equal(
      keyFromUrl('https://example.com/images/tee.jpg', customBase),
      null
    )

    // Empty or non-string inputs return null
    assert.equal(keyFromUrl(''), null)
    assert.equal(keyFromUrl(null), null)
    assert.equal(keyFromUrl(undefined), null)
  })
})
