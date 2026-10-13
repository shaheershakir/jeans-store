import crypto from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { createAdminSession, verifyAdminSession } from '../services/adminSession.js'

export const adminAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(1024)
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
})

function safeEqual(left: string, right: string): boolean {
  const a = crypto.createHash('sha256').update(left).digest()
  const b = crypto.createHash('sha256').update(right).digest()
  return crypto.timingSafeEqual(a, b)
}

adminAuthRouter.post('/api/admin/auth/login', loginLimiter, (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid email address and password.' })
    return
  }

  const configuredEmail = process.env.ADMIN_EMAIL?.trim()
  const configuredPassword = process.env.ADMIN_PASSWORD
  const configuredSecret = process.env.ADMIN_SESSION_SECRET
  if (!configuredEmail || !configuredPassword || !configuredSecret || configuredSecret.length < 32) {
    res.status(503).json({ error: 'Admin sign-in is not configured on this server.' })
    return
  }

  const emailMatches = safeEqual(parsed.data.email.toLowerCase(), configuredEmail.toLowerCase())
  const passwordMatches = safeEqual(parsed.data.password, configuredPassword)
  if (!emailMatches || !passwordMatches) {
    res.status(401).json({ error: 'Email or password is incorrect.' })
    return
  }

  try {
    const user = { id: 1, name: process.env.ADMIN_NAME?.trim() || 'Store administrator', email: configuredEmail, role: 'admin' }
    const session = createAdminSession(user.email, user.name)
    res.json({ ...session, user })
  } catch {
    res.status(503).json({ error: 'Admin sign-in is not configured on this server.' })
  }
})

adminAuthRouter.get('/api/admin/auth/me', (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const claims = token ? verifyAdminSession(token) : null
  if (!claims) {
    res.status(401).json({ error: 'Admin session is invalid or expired.' })
    return
  }
  res.json({ user: { id: 1, name: claims.name, email: claims.email, role: claims.role } })
})
