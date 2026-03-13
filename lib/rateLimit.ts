// lib/rateLimit.ts
// Upstash Redis-backed rate limiting for API routes.
// Apply to AI endpoints to control cost and prevent abuse.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { Res } from '../api/_utils.js'

const configured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = configured
  ? new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// AI endpoints: 20 requests per user per minute
export const aiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix:  'rl:ai',
}) : null

// Standard endpoints: 60 requests per user per minute
export const standardRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix:  'rl:std',
}) : null

// IP-based limiter: 60 requests per IP per minute
export const ipRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix:  'rl:ip',
}) : null

/**
 * Check rate limit for a user. Returns true if the request is allowed.
 * Sends a 429 response and returns false if the limit is exceeded.
 * If Upstash env vars are not configured, skips rate limiting and allows all requests.
 */
export async function checkRateLimit(
  res: Res,
  userId: string,
  limiter: Ratelimit | null = aiRateLimit,
): Promise<boolean> {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[rate-limit] Upstash not configured — blocking request in production')
      res.status(503).json({ error: 'Rate limiting unavailable. Please try again later.' })
      return false
    }
    return true // allow in development
  }

  const { success, limit, remaining, reset } = await limiter.limit(userId)

  res.setHeader('X-RateLimit-Limit',     String(limit))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  res.setHeader('X-RateLimit-Reset',     String(reset))

  if (!success) {
    res.status(429).json({
      error: 'Too many requests. Please try again shortly.',
      reset,
    })
    return false
  }

  return true
}
