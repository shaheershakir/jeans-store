import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { registerSchema, loginSchema, verifyTokenSchema, type UserProfile } from '../schemas/user.js'
import { userStore } from '../store/userStore.js'
import { createCloudIamToken, verifyCloudIamToken, verifyPassword } from '../services/cloudIam.js'
import type { DbUser } from '../db/schema.js'

function formatProfile(user: DbUser): UserProfile {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    name: user.name,
    provider: user.provider,
    createdAt: user.createdAt
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // 1. User Registration (Storefront Sign-up)
  app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid registration details',
        details: z.treeifyError(parsed.error)
      })
    }

    const { name, email, password } = parsed.data

    try {
      const existing = await userStore.findByEmail(email)
      if (existing) {
        return reply.status(409).send({
          error: 'An account with this email address already exists. Please sign in.'
        })
      }

      const user = await userStore.create({
        name,
        email,
        password,
        provider: 'cloud-iam'
      })

      const { token, expiresIn } = createCloudIamToken({
        uid: user.uid,
        email: user.email,
        name: user.name
      })

      app.log.info({ email: user.email, uid: user.uid }, 'New user registered via Cloud IAM')

      return reply.status(201).send({
        user: formatProfile(user),
        token,
        expiresIn
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to register user')
      return reply.status(500).send({ error: 'Failed to process registration' })
    }
  })

  // 2. User Login (Storefront Sign-in)
  app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid login details',
        details: z.treeifyError(parsed.error)
      })
    }

    const { email, password } = parsed.data

    try {
      const user = await userStore.findByEmail(email)
      if (!user || !user.passwordHash) {
        return reply.status(401).send({
          error: 'Invalid email or password'
        })
      }

      const isValid = verifyPassword(password, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({
          error: 'Invalid email or password'
        })
      }

      const { token, expiresIn } = createCloudIamToken({
        uid: user.uid,
        email: user.email,
        name: user.name
      })

      app.log.info({ email: user.email, uid: user.uid }, 'User logged in successfully')

      return reply.send({
        user: formatProfile(user),
        token,
        expiresIn
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to login user')
      return reply.status(500).send({ error: 'Authentication failed' })
    }
  })

  // 3. Current User Profile (/api/auth/me)
  app.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or malformed Authorization header' })
    }

    const token = authHeader.slice(7).trim()
    const claims = await verifyCloudIamToken(token)

    if (!claims) {
      return reply.status(401).send({ error: 'Invalid or expired Cloud IAM token' })
    }

    let user = await userStore.findByUid(claims.uid)
    if (!user) {
      user = await userStore.findByEmail(claims.email)
    }

    if (!user) {
      // Auto-provision profile from verified IAM claims if not yet in DB
      user = await userStore.create({
        uid: claims.uid,
        email: claims.email,
        name: claims.name || claims.email.split('@')[0],
        provider: 'cloud-iam'
      })
    }

    return reply.send({
      user: formatProfile(user),
      claims
    })
  })

  // 4. Token Verification Utility (/api/auth/verify)
  app.post('/api/auth/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = verifyTokenSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Token is required' })
    }

    const claims = await verifyCloudIamToken(parsed.data.token)
    if (!claims) {
      return reply.status(200).send({ valid: false })
    }

    return reply.status(200).send({
      valid: true,
      claims
    })
  })
}
