import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
})

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const googleAuthSchema = z
  .object({
    credential: z.string().optional(),
    code: z.string().optional(),
    redirectUri: z.string().optional()
  })
  .refine((data) => Boolean(data.credential || data.code), {
    message: 'Either Google ID Token credential or authorization code is required'
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>
