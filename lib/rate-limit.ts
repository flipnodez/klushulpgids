import 'server-only'

import type { Redis as RedisClient } from 'ioredis'

let client: RedisClient | null = null
let initAttempted = false

async function getClient(): Promise<RedisClient | null> {
  if (initAttempted) return client
  initAttempted = true

  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    const { Redis } = await import('ioredis')
    client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      connectTimeout: 1500,
    })
    client.on('error', (err) => console.warn('[rate-limit] redis error:', err.message))
    return client
  } catch (err) {
    console.warn('[rate-limit] ioredis unavailable, rate-limit disabled:', (err as Error).message)
    return null
  }
}

export type RateLimitResult = { allowed: boolean; remaining: number; limit: number }

/**
 * Sliding-window-ish rate limiter: incrementeert een teller met expiry-window.
 *
 * - `key`        — uniek per categorie + identifier (bv. `magic-link:email:foo@bar.nl`)
 * - `limit`      — max aantal requests in het venster
 * - `windowSec`  — venster in seconden
 *
 * **Veiligheidsmodel:** zonder Redis is rate-limit een no-op (allowed=true).
 * Voor login + magic-link in productie is dat niet ideaal, dus de health-check
 * in `docs/auth-setup.md` bevat een test om te verifiëren dat Redis beschikbaar is.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const c = await getClient()
  if (!c) return { allowed: true, remaining: limit, limit }

  try {
    const count = await c.incr(key)
    if (count === 1) await c.expire(key, windowSec)
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
    }
  } catch {
    // Redis-fout: niet blokkeren (fail-open). Logging alleen.
    return { allowed: true, remaining: limit, limit }
  }
}
