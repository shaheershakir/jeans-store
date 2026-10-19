import 'dotenv/config'
import { Storage } from '@google-cloud/storage'

async function verifyGcs() {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'clothing-store-511300'
  const bucketName = process.env.GCS_PRODUCT_IMAGES_BUCKET || 'clothing-store-bucket'

  console.log(`Connecting to GCS (Project: ${projectId}, Bucket: ${bucketName})...`)
  const storage = new Storage({ projectId })
  const bucket = storage.bucket(bucketName)

  const [exists] = await bucket.exists()
  if (!exists) {
    throw new Error(`Bucket "${bucketName}" does not exist in project "${projectId}".`)
  }
  console.log(`✓ Bucket "${bucketName}" exists and is accessible.`)

  const testKey = `test/ping-${Date.now()}.txt`
  const file = bucket.file(testKey)
  const content = `GCS integration verified at ${new Date().toISOString()}`

  console.log(`Uploading test file: ${testKey}...`)
  await file.save(Buffer.from(content), {
    resumable: false,
    metadata: {
      contentType: 'text/plain',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  })
  console.log('✓ Upload successful.')

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${testKey}`
  console.log(`Testing public HTTP fetch from: ${publicUrl}...`)
  const res = await fetch(publicUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch uploaded file via public HTTP: ${res.status} ${res.statusText}`)
  }
  const fetched = await res.text()
  console.log(`✓ Public read verified: "${fetched.trim()}"`)

  console.log('Cleaning up test file...')
  await file.delete()
  console.log('✓ Cleanup successful. GCS is fully functional and ready!')
}

verifyGcs().catch((err) => {
  console.error('❌ GCS verification failed:', err)
  process.exit(1)
})
