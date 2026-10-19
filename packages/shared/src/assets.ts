/**
 * Resolves the public asset base URL from environment variables or sensible fallbacks.
 * In browser: checks NEXT_PUBLIC_ASSET_BASE_URL.
 * In Node/Edge: checks ASSET_BASE_URL, NEXT_PUBLIC_ASSET_BASE_URL, or GCS bucket fallback.
 */
export function getAssetBaseUrl(): string {
  const env: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}
  const explicit = env.ASSET_BASE_URL || env.NEXT_PUBLIC_ASSET_BASE_URL
  if (explicit && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, '')
  }
  const bucket = env.GCS_PRODUCT_IMAGES_BUCKET || env.STORAGE_BUCKET
  if (bucket && bucket.trim()) {
    return `https://storage.googleapis.com/${bucket.trim()}`
  }
  return '/assets'
}

/**
 * Builds the public URL for a given storage key.
 * If key is already a full external URL (http:// or https://) or empty, returns it as-is.
 */
export function assetUrl(key: string, customBaseUrl?: string): string {
  if (!key) return ''
  if (/^https?:\/\//i.test(key)) return key
  const base = (customBaseUrl || getAssetBaseUrl()).replace(/\/+$/, '')
  const cleanKey = key.replace(/^\/+/, '')
  const encodedKey = cleanKey
    .split('/')
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment))
      } catch {
        return encodeURIComponent(segment)
      }
    })
    .join('/')
  return `${base}/${encodedKey}`
}

/**
 * Returns the storage key if the URL points to our asset storage, otherwise null.
 * Matches:
 * 1. Explicit ASSET_BASE_URL (or NEXT_PUBLIC_ASSET_BASE_URL)
 * 2. Legacy GCS patterns: https://storage.googleapis.com/<bucket>/...
 * 3. Local /assets/... URLs
 */
export function keyFromUrl(url: string | null | undefined, customBaseUrl?: string): string | null {
  if (!url || typeof url !== 'string') return null
  const cleanUrl = url.trim()
  if (!cleanUrl) return null

  const bases: string[] = []
  if (customBaseUrl) {
    bases.push(customBaseUrl.replace(/\/+$/, ''))
  }
  const defaultBase = getAssetBaseUrl().replace(/\/+$/, '')
  if (defaultBase && !bases.includes(defaultBase)) {
    bases.push(defaultBase)
  }

  const env: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}
  const bucket = env.GCS_PRODUCT_IMAGES_BUCKET || env.STORAGE_BUCKET
  if (bucket) {
    const gcsPrefix = `https://storage.googleapis.com/${bucket.trim()}`
    if (!bases.includes(gcsPrefix)) bases.push(gcsPrefix)
  }

  for (const base of bases) {
    if (base && cleanUrl.startsWith(base + '/')) {
      const rawPath = cleanUrl.slice(base.length + 1)
      try {
        return decodeURIComponent(rawPath)
      } catch {
        return rawPath
      }
    }
  }

  // Also match general legacy GCS format: https://storage.googleapis.com/<bucket>/(products/...)
  const legacyGcsMatch = cleanUrl.match(/^https?:\/\/storage\.googleapis\.com\/[^/]+\/(.+)$/i)
  if (legacyGcsMatch && legacyGcsMatch[1]) {
    try {
      return decodeURIComponent(legacyGcsMatch[1])
    } catch {
      return legacyGcsMatch[1]
    }
  }

  // Also match local /assets/(.+) or http://localhost:4000/assets/(.+)
  const localMatch = cleanUrl.match(/^(?:https?:\/\/[^/]+)?\/assets\/(.+)$/i)
  if (localMatch && localMatch[1]) {
    try {
      return decodeURIComponent(localMatch[1])
    } catch {
      return localMatch[1]
    }
  }

  return null
}
