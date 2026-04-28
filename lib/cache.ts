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
    client.on('error', (err) => {
      console.warn('[cache] redis error:', err.message)
    })
    return client
  } catch (err) {
    console.warn('[cache] ioredis unavailable, caching disabled:', (err as Error).message)
    return null
  }
}

/**
 * Read-through cache. If REDIS_URL is unset or Redis is down, falls back
 * to invoking `fn()` directly — caching is best-effort, never load-bearing.
 *
 * Page-level ISR (`export const revalidate`) is the primary caching layer;
 * this helper exists for query-level reuse across requests within the TTL.
 */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const c = await getClient()
  if (!c) return fn()

  try {
    const hit = await c.get(key)
    if (hit) return JSON.parse(hit) as T
  } catch {
    // ignore — fall through to source
  }

  const result = await fn()

  try {
    await c.setex(key, ttlSeconds, JSON.stringify(result))
  } catch {
    // ignore — caching is best-effort
  }

  return result
}

/** Invalidate a single key. Best-effort — silent no-op if Redis is unavailable. */
export async function invalidate(key: string): Promise<void> {
  const c = await getClient()
  if (!c) return
  try {
    await c.del(key)
  } catch {
    // ignore
  }
}

/** Invalidate every key matching a glob pattern (e.g. `vak-stad:loodgieters:*`). */
export async function invalidatePattern(pattern: string): Promise<void> {
  const c = await getClient()
  if (!c) return
  try {
    const keys = await c.keys(pattern)
    if (keys.length > 0) await c.del(...keys)
  } catch {
    // ignore
  }
}
