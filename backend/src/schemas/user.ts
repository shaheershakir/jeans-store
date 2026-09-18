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

export interface UserProfile {
  id: number
  uid: string
  email: string
  name: string
  provider: string
  createdAt: Date
}

export interface AuthResponse {
  user: UserProfile
  token: string
  expiresIn: number
}

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
