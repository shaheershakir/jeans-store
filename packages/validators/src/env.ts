import { z } from 'zod'

/**
 * Custom error class for environment validation failures.
 */
export class EnvValidationError extends Error {
  readonly issues: z.ZodIssue[]

  constructor(issues: z.ZodIssue[], appName: string) {
    const formatted = issues
      .map((issue) => `  - [${issue.path.join('.') || 'CONFIG'}]: ${issue.message}`)
      .join('\n')
    super(
      `\n❌ Strict Environment Validation Failed for [${appName}]:\n${formatted}\n\nPlease check your .env file or deployment secret configuration.\n`
    )
    this.name = 'EnvValidationError'
    this.issues = issues
  }
}

/**
 * Express REST API Environment Schema.
 * Strict in production; allows development defaults for local offline workflows.
 */
export const createApiEnvSchema = (isProd: boolean) =>
  z.object({
    PORT: z.coerce.number().default(4000),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: isProd
      ? z
          .string()
          .min(1, 'DATABASE_URL is required in production')
          .refine(
            (v) => v.startsWith('postgres://') || v.startsWith('postgresql://'),
            'DATABASE_URL must be a valid PostgreSQL connection string'
          )
      : z.string().optional(),
    ADMIN_EMAIL: isProd
      ? z.string().email('ADMIN_EMAIL must be a valid email in production')
      : z.string().email().optional().or(z.literal('')),
    ADMIN_PASSWORD: isProd
      ? z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters in production')
      : z.string().optional(),
    ADMIN_SESSION_SECRET: isProd
      ? z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters in production')
      : z.string().min(32).optional().or(z.literal('')),
    JWT_SECRET: isProd
      ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
      : z.string().min(32).optional().or(z.literal('')),
    REVALIDATION_SECRET: isProd
      ? z.string().min(8, 'REVALIDATION_SECRET must be at least 8 characters in production')
      : z.string().optional(),
    FRONTEND_URL: isProd
      ? z.string().url('FRONTEND_URL must be a valid URL in production')
      : z.string().url().default('http://localhost:3000'),
    CORS_ORIGIN: isProd
      ? z.string().min(1, 'CORS_ORIGIN is required in production')
      : z.string().optional(),
    RAZORPAY_KEY_ID: isProd
      ? z.string().min(1, 'RAZORPAY_KEY_ID is required in production')
      : z.string().optional(),
    RAZORPAY_KEY_SECRET: isProd
      ? z.string().min(1, 'RAZORPAY_KEY_SECRET is required in production')
      : z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: isProd
      ? z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required in production')
      : z.string().optional(),
    POSTHOG_API_KEY: z.string().optional(),
    POSTHOG_HOST: z.string().default('https://us.i.posthog.com'),
    STORAGE_PROVIDER: z.enum(['local', 'gcs', 's3']).default('local'),
    ASSET_BASE_URL: z.string().default('http://localhost:4000/assets'),
    GCP_PROJECT_ID: z.string().optional(),
    GCS_PRODUCT_IMAGES_BUCKET: z.string().optional()
  })

/**
 * Next.js Storefront Environment Schema.
 * Strict in production; allows development defaults.
 */
export const createStorefrontEnvSchema = (isProd: boolean) =>
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    BACKEND_URL: z.string().url().default('http://localhost:4000'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
    NEXT_PUBLIC_ASSET_BASE_URL: z.string().default('http://localhost:4000/assets'),
    NEXT_PUBLIC_SITE_URL: z.string().url().default('https://teesgarage.in'),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: isProd
      ? z.string().min(1, 'NEXT_PUBLIC_RAZORPAY_KEY_ID is required in production for checkout')
      : z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().default('/ingest'),
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
    REVALIDATION_SECRET: isProd
      ? z.string().min(8, 'REVALIDATION_SECRET must be at least 8 characters in production')
      : z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional()
  })

/**
 * Next.js Admin Dashboard Environment Schema.
 */
export const createAdminEnvSchema = (isProd: boolean) =>
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_URL: z.string().url().default('http://localhost:4000'),
    NEXT_PUBLIC_ASSET_BASE_URL: z.string().default('http://localhost:4000/assets')
  })

/**
 * Validates API environment variables. Throws EnvValidationError on failure.
 */
export function validateApiEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const isProd = rawEnv.NODE_ENV === 'production'
  const schema = createApiEnvSchema(isProd)
  const result = schema.safeParse(rawEnv)
  if (!result.success) {
    throw new EnvValidationError(result.error.issues, 'API')
  }
  return result.data
}

/**
 * Validates Storefront environment variables. Throws EnvValidationError on failure.
 */
export function validateStorefrontEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const isProd = rawEnv.NODE_ENV === 'production'
  const schema = createStorefrontEnvSchema(isProd)
  const result = schema.safeParse(rawEnv)
  if (!result.success) {
    throw new EnvValidationError(result.error.issues, 'Storefront')
  }
  return result.data
}

/**
 * Validates Admin environment variables. Throws EnvValidationError on failure.
 */
export function validateAdminEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  const isProd = rawEnv.NODE_ENV === 'production'
  const schema = createAdminEnvSchema(isProd)
  const result = schema.safeParse(rawEnv)
  if (!result.success) {
    throw new EnvValidationError(result.error.issues, 'Admin')
  }
  return result.data
}
