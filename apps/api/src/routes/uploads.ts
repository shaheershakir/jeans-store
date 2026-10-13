import crypto from 'node:crypto'
import { Storage } from '@google-cloud/storage'
import { Router, type Request, type Response } from 'express'
import express from 'express'
import { verifyAdminAuth } from '../middleware/auth.js'

export const uploadRouter = Router()

const IMAGE_TYPES = {
  'image/jpeg': { extension: 'jpg', signature: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  'image/png': { extension: 'png', signature: (data: Buffer) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extension: 'webp', signature: (data: Buffer) => data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' }
} as const

const storage = new Storage({ projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_PROJECT_ID })

uploadRouter.post(
  '/api/uploads/products',
  verifyAdminAuth,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '10mb' }),
  async (req: Request, res: Response) => {
    const bucketName = process.env.GCS_PRODUCT_IMAGES_BUCKET?.trim()
    if (!bucketName) {
      res.status(503).json({ error: 'Product image storage is not configured.' })
      return
    }

    const contentType = req.headers['content-type']?.split(';')[0]?.toLowerCase() as keyof typeof IMAGE_TYPES | undefined
    const imageType = contentType ? IMAGE_TYPES[contentType] : undefined
    const bytes = req.body
    if (!imageType || !Buffer.isBuffer(bytes) || bytes.length === 0 || !imageType.signature(bytes)) {
      res.status(400).json({ error: 'Upload a valid JPEG, PNG, or WebP image.' })
      return
    }

    try {
      const objectName = `products/${crypto.randomUUID()}.${imageType.extension}`
      const file = storage.bucket(bucketName).file(objectName)
      await file.save(bytes, {
        resumable: false,
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable'
        }
      })
      res.status(201).json({
        url: `https://storage.googleapis.com/${encodeURIComponent(bucketName)}/${objectName.split('/').map(encodeURIComponent).join('/')}`,
        object: objectName
      })
    } catch (err) {
      req.log?.error({ err }, 'Product image upload failed')
      res.status(502).json({ error: 'Could not upload the image to Google Cloud Storage.' })
    }
  }
)
