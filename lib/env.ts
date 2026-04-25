import { z } from 'zod'

/**
 * Type-safe environment validation.
 *
 * Per fase wordt de validatie strikter:
 *  - fase 1: alleen NODE_ENV + (optioneel) DATABASE_URL/REDIS_URL
 *  - fase 2: DATABASE_URL + ENCRYPTION_KEY verplicht ← we zitten hier
 *  - fase 6: NEXTAUTH_SECRET + LETTERMINT_API_KEY + FROM_EMAIL verplicht
 *  - fase 8: MOLLIE_API_KEY + MOLLIE_WEBHOOK_SECRET verplicht
 *
 * In productie faalt de app hard bij missende kritieke vars; in dev/test loggen
 * we alleen een waarschuwing om DX soepel te houden.
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

  // Infra (door Scalingo gezet, lokaal via .env.local)
  DATABASE_URL: z.string().url(),
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

  // Encryption (fase 2 — verplicht voor scripts die encrypten/decrypten,
  // gevalideerd at-use in lib/encryption.ts. 64 hex chars = 32 bytes AES-256).
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .optional(),

  // Revalidation
  REVALIDATE_SECRET: z.string().optional(),

  // Feature flags
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

// In dev valideren we soft (warning) maar geven alsnog process.env terug zodat
// scripts kunnen draaien als één var ontbreekt. In prod is parsed.success
// gegarandeerd true (anders is er al een throw geweest).
export const env = parsed.success
  ? parsed.data
  : (process.env as unknown as z.infer<typeof envSchema>)

export type Env = z.infer<typeof envSchema>
