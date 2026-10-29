import rateLimit from 'express-rate-limit'

const isLocalOrTest = (ip?: string): boolean => {
  if (process.env.NODE_ENV === 'test') return true
  if (process.env.NODE_ENV === 'production') return false
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost'
}

/**
 * Dedicated rate limiter for authentication endpoints:
 * Enforces a strict limit of 15 requests per 15-minute window per IP
 * to defend against brute-force attacks and credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  skip: (req) => isLocalOrTest(req.ip || req.socket.remoteAddress)
})

/**
 * Dedicated rate limiter for order creation & payment attempts:
 * Enforces a limit of 30 order requests per 15-minute window per IP
 * to prevent order placement spam and inventory denial-of-service.
 */
export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Order creation rate limit reached. Please wait a few minutes before trying again.' },
  skip: (req) => isLocalOrTest(req.ip || req.socket.remoteAddress)
})
