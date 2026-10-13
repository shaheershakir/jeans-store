import type { Request, Response, NextFunction } from 'express'

export function verifyAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = process.env.ADMIN_API_KEY
  if (configuredKey) {
    const keyHeader = req.headers['x-api-key']
    if (!keyHeader || keyHeader !== configuredKey) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid X-API-Key' })
      return
    }
  }
  next()
}
