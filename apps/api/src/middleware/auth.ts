import type { Request, Response, NextFunction } from 'express'
import { verifyAdminSession } from '../services/adminSession.js'

export function verifyAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token || !verifyAdminSession(token)) {
    res.status(401).json({ error: 'Unauthorized: admin session required.' })
    return
  }
  next()
}
