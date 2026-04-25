import { z } from 'zod'

/**
 * Type-safe environment validation.
 *
 * Variabelen worden hier per fase strikter gemaakt:
 *  - fase 1: alleen NODE_ENV + (optioneel) DATABASE_URL/REDIS_URL
 *  - fase 2: DATABASE_URL/REDIS_URL/ENCRYPTION_KEY verplicht
 *  - fase 6: NEXTAUTH_SECRET, LETTERMINT_API_KEY verplicht
 *  - fase 8: MOLLIE_API_KEY verplicht
 *
 * In productie faalt de app bij missende kritieke vars; in dev/test loggen we
 * alleen een waarschuwing om DX soepel te houden.
 */

const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal('').transform(() => undefined))

const featureFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Infra (door Scalingo gezet)
  DATABASE_URL: optionalUrl,
  REDIS_URL: optionalUrl,

  // Auth (fase 6)
  NEXTAUTH_URL: optionalUrl,
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Email (fase 6)
  LETTERMINT_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Storage (fase 6)
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET_NAME: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: optionalUrl,

  // Analytics
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),

  // SEO
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  BING_SITE_VERIFICATION: z.string().optional(),

  // Encryption (fase 2)
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Revalidation
  REVALIDATE_SECRET: z.string().optional(),

  // Feature flags (fase 8) — public, dus prefixed met NEXT_PUBLIC_
  NEXT_PUBLIC_FEATURE_PREMIUM_LISTINGS: featureFlag,
  NEXT_PUBLIC_FEATURE_SPONSORED: featureFlag,
  NEXT_PUBLIC_FEATURE_DISPLAY_ADS: featureFlag,
  NEXT_PUBLIC_FEATURE_PAYMENTS: featureFlag,
  NEXT_PUBLIC_FEATURE_COMPARE: featureFlag,
  NEXT_PUBLIC_FEATURE_ADV_ANALYTICS: featureFlag,

  // Mollie (fase 8)
  MOLLIE_API_KEY: z.string().optional(),
  MOLLIE_WEBHOOK_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const isProd = process.env.NODE_ENV === 'production'
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  const message = `Environment validation failed:\n${issues}`

  if (isProd) {
    throw new Error(message)
  }
  console.warn(`⚠ ${message}`)
}

export const env = parsed.success ? parsed.data : envSchema.parse({ NODE_ENV: 'development' })

export type Env = z.infer<typeof envSchema>
