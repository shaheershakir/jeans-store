import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Storage as GcsStorage } from '@google-cloud/storage'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { assetUrl } from '@jeans-store/shared'
import { logger } from '../lib/logger.js'

export interface ObjectStorage {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
  list(prefix: string): AsyncIterable<{ key: string; updatedAt: Date }>
  getUrl(key: string): string
}

export class GcsStorageDriver implements ObjectStorage {
  private storage: GcsStorage
  private bucketName: string

  constructor(bucketName: string, projectId?: string) {
    this.bucketName = bucketName
    this.storage = new GcsStorage({ projectId })
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    const file = this.storage.bucket(this.bucketName).file(key)
    await file.save(bytes, {
      resumable: false,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    })
  }

  async delete(key: string): Promise<void> {
    try {
      await this.storage.bucket(this.bucketName).file(key).delete()
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code
      if (code !== 404) throw err
    }
  }

  async *list(prefix: string): AsyncIterable<{ key: string; updatedAt: Date }> {
    const [files] = await this.storage.bucket(this.bucketName).getFiles({ prefix })
    for (const file of files) {
      const updated = file.metadata.updated ? new Date(file.metadata.updated) : new Date()
      yield { key: file.name, updatedAt: updated }
    }
  }

  getUrl(key: string): string {
    if (process.env.ASSET_BASE_URL || process.env.NEXT_PUBLIC_ASSET_BASE_URL) {
      return assetUrl(key)
    }
    const cleanKey = key.split('/').map(encodeURIComponent).join('/')
    return `https://storage.googleapis.com/${encodeURIComponent(this.bucketName)}/${cleanKey}`
  }
}

export class S3StorageDriver implements ObjectStorage {
  private client: S3Client
  private bucket: string

  constructor(options: {
    bucket: string
    endpoint?: string
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
    forcePathStyle?: boolean
  }) {
    this.bucket = options.bucket
    this.client = new S3Client({
      endpoint: options.endpoint || undefined,
      region: options.region || 'auto',
      forcePathStyle: options.forcePathStyle ?? false,
      credentials: options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey
          }
        : undefined
    })
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    )
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    )
  }

  async *list(prefix: string): AsyncIterable<{ key: string; updatedAt: Date }> {
    let continuationToken: string | undefined
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        })
      )
      for (const item of res.Contents || []) {
        if (item.Key) {
          yield { key: item.Key, updatedAt: item.LastModified || new Date() }
        }
      }
      continuationToken = res.NextContinuationToken
    } while (continuationToken)
  }

  getUrl(key: string): string {
    return assetUrl(key)
  }
}

export class LocalStorageDriver implements ObjectStorage {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), '.local-uploads')
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  async put(key: string, bytes: Buffer, _contentType: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key)
    await fsp.mkdir(path.dirname(fullPath), { recursive: true })
    await fsp.writeFile(fullPath, bytes)
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key)
    try {
      await fsp.unlink(fullPath)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code !== 'ENOENT') throw err
    }
  }

  async *list(prefix: string): AsyncIterable<{ key: string; updatedAt: Date }> {
    if (!fs.existsSync(this.baseDir)) return

    async function* walk(dir: string, currentPrefix: string): AsyncIterable<{ key: string; updatedAt: Date }> {
      const entries = await fsp.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        const rel = path.relative(currentPrefix, full).replace(/\\/g, '/')
        if (entry.isDirectory()) {
          yield* walk(full, currentPrefix)
        } else if (entry.isFile()) {
          const stats = await fsp.stat(full)
          yield { key: rel, updatedAt: stats.mtime }
        }
      }
    }

    const startDir = path.join(this.baseDir, prefix)
    if (fs.existsSync(startDir)) {
      const stat = await fsp.stat(startDir)
      if (stat.isDirectory()) {
        yield* walk(startDir, this.baseDir)
      } else {
        yield { key: prefix, updatedAt: stat.mtime }
      }
    } else {
      for await (const item of walk(this.baseDir, this.baseDir)) {
        if (item.key.startsWith(prefix)) {
          yield item
        }
      }
    }
  }

  getUrl(key: string): string {
    return assetUrl(key)
  }
}

let activeStorage: ObjectStorage | null = null

export function getStorageProvider(): 'gcs' | 's3' | 'local' {
  const explicit = process.env.STORAGE_PROVIDER?.trim().toLowerCase()
  if (explicit === 'gcs' || explicit === 's3' || explicit === 'local') {
    return explicit
  }
  if (process.env.GCS_PRODUCT_IMAGES_BUCKET?.trim()) {
    return 'gcs'
  }
  if (process.env.STORAGE_BUCKET?.trim() && process.env.STORAGE_ACCESS_KEY_ID?.trim()) {
    return 's3'
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Product image storage is not configured for production.')
  }
  return 'local'
}

export function getStorage(): ObjectStorage {
  if (activeStorage) return activeStorage

  const provider = getStorageProvider()
  switch (provider) {
    case 'gcs': {
      const bucket = process.env.GCS_PRODUCT_IMAGES_BUCKET?.trim() || process.env.STORAGE_BUCKET?.trim()
      if (!bucket) throw new Error('GCS bucket name is missing (GCS_PRODUCT_IMAGES_BUCKET).')
      activeStorage = new GcsStorageDriver(bucket, process.env.GCP_PROJECT_ID || process.env.GOOGLE_PROJECT_ID)
      logger.info({ provider: 'gcs', bucket }, 'Initialized GCS storage driver')
      break
    }
    case 's3': {
      const bucket = process.env.STORAGE_BUCKET?.trim()
      if (!bucket) throw new Error('S3 bucket name is missing (STORAGE_BUCKET).')
      activeStorage = new S3StorageDriver({
        bucket,
        endpoint: process.env.STORAGE_ENDPOINT?.trim(),
        region: process.env.STORAGE_REGION?.trim() || 'auto',
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID?.trim(),
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY?.trim(),
        forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true'
      })
      logger.info({ provider: 's3', bucket }, 'Initialized S3-compatible storage driver')
      break
    }
    case 'local':
    default: {
      activeStorage = new LocalStorageDriver()
      logger.info({ provider: 'local' }, 'Initialized local disk storage driver')
      break
    }
  }

  return activeStorage
}

export function setStorage(storage: ObjectStorage | null): void {
  activeStorage = storage
}
