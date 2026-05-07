// lib/aiCache.ts
// Redis-based caching for AI API responses.
// Demo users: 24-hour cache (same recruiter board = same response).
// All users: 30-second deduplication window (prevents double-clicks).

import { redis } from './rateLimit.js'

const DEMO_TTL_SECONDS = 86400    // 24 hours
const DEDUP_TTL_SECONDS = 30      // 30 seconds

function fingerprint(data: unknown): string {
  const json = JSON.stringify(data)
  return Buffer.from(json).toString('base64url').slice(0, 40)
}

export interface AiCacheOptions<T> {
  userId: string
  endpoint: string
  inputs: unknown
  isDemo: boolean
  fn: () => Promise<T>
}

export async function withAiCache<T>(opts: AiCacheOptions<T>): Promise<T> {
  if (!redis) return opts.fn()

  const ttl = opts.isDemo ? DEMO_TTL_SECONDS : DEDUP_TTL_SECONDS
  const fp = fingerprint(opts.inputs)
  const key = `ai:c:${opts.endpoint}:${opts.userId}:${fp}`

  try {
    const cached = await redis.get<T>(key)
    if (cached !== null) return cached
  } catch {
    return opts.fn()
  }

  const result = await opts.fn()

  try {
    await redis.set(key, result, { ex: ttl })
  } catch {
    // cache write failure is non-fatal
  }

  return result
}
