import type { Request, Response, NextFunction } from 'express'
import { verifyAdminSession } from '../services/adminSession.js'

export function verifyAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY?.trim()
  const headerKey = req.headers['x-admin-key']
  if (adminKey && headerKey && headerKey === adminKey) {
    next()
    return
  }

  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (adminKey && token === adminKey) {
    next()
    return
  }

  if (!token || !verifyAdminSession(token)) {
    res.status(401).json({ error: 'Unauthorized: admin session required.' })
    return
  }
  next()
}
