// api/_utils.ts
// Shared helpers for all Vercel serverless functions.

import { Buffer } from 'node:buffer'
import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '../lib/supabase.js'
import { captureException } from './_lib/sentry.js'

// ─── Types ────────────────────────────────────────────────────────────────────

// Minimal Vercel/Next-style request/response types (no @vercel/node required).
export interface Req {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
  query: Record<string, string | string[]>
}

export interface Res {
  status(code: number): Res
  json(data: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Extract and verify the Supabase JWT from the Authorization header.
 * Returns the authenticated user's UUID, or null if unauthenticated.
 */
export async function getUser(req: Req): Promise<User | null> {
  const auth = req.headers?.authorization
  const token = typeof auth === 'string' && auth.startsWith('Bearer ')
    ? auth.slice(7)
    : null

  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function getUserId(req: Req): Promise<string | null> {
  const user = await getUser(req)
  return user?.id ?? null
}

export async function getUserContext(req: Req): Promise<{ userId: string; isDemo: boolean } | null> {
  const user = await getUser(req)
  if (!user) return null
  const meta = user.user_metadata as Record<string, unknown> | null | undefined
  const demoValue = meta?.demo
  const isDemo = demoValue === true || demoValue === 'true'
  return { userId: user.id, isDemo }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const DEFAULT_ORIGINS = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:5173,http://localhost:3000'

const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
)

const MAX_JSON_BODY_BYTES = 1_000_000

export function setCors(res: Res, req?: Req): void {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : ''

  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (allowedOrigin) res.setHeader('Vary', 'Origin')
  res.setHeader('Cache-Control', 'no-store')
}

export function getClientIp(req: Req): string | null {
  const header = req.headers['x-forwarded-for']
  const raw = Array.isArray(header) ? header[0] : header
  if (!raw) return null
  return raw.split(',')[0].trim() || null
}

export function requireJson(req: Req, res: Res): boolean {
  const contentType = Array.isArray(req.headers['content-type'])
    ? req.headers['content-type'][0]
    : req.headers['content-type']
  const value = typeof contentType === 'string' ? contentType : ''
  if (!value.includes('application/json')) {
    res.status(415).json({ error: 'Content-Type must be application/json' })
    return false
  }
  return true
}

export function enforceJsonBodyLimit(
  req: Req,
  res: Res,
  limit = MAX_JSON_BODY_BYTES
): boolean {
  const lenHeader = req.headers['content-length']
  const lenRaw = Array.isArray(lenHeader) ? lenHeader[0] : lenHeader
  const len = typeof lenRaw === 'string' ? Number.parseInt(lenRaw, 10) : NaN
  if (Number.isFinite(len) && len > limit) {
    res.status(413).json({ error: 'Payload too large' })
    return false
  }

  if (req.body != null) {
    try {
      const size = Buffer.byteLength(JSON.stringify(req.body))
      if (size > limit) {
        res.status(413).json({ error: 'Payload too large' })
        return false
      }
    } catch {
      // If the body can't be stringified, let validation handle it later.
    }
  }

  return true
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function unauthorized(res: Res): void {
  res.status(401).json({ error: 'Unauthorized' })
}

export function badRequest(res: Res, message: string): void {
  res.status(400).json({ error: message })
}

export function notFound(res: Res, message = 'Not found'): void {
  res.status(404).json({ error: message })
}

export function serverError(res: Res, err: unknown, context?: Record<string, unknown>): void {
  const detail = err instanceof Error ? err.message : String(err)
  console.error('[api]', detail, err)
  captureException(err, context)
  res.status(500).json({ error: 'Internal server error' })
}

// ─── Vercel handler wrapper ───────────────────────────────────────────────────

type Handler = (req: Req, res: Res) => Promise<void>

/**
 * Wraps a handler with CORS headers and OPTIONS preflight handling.
 */
export function withCors(handler: Handler): Handler {
  return async (req: Req, res: Res) => {
    const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : ''
    if (process.env.NODE_ENV === 'production' && origin) {
      if (ALLOWED_ORIGINS.size === 0) {
        res.status(500).json({ error: 'CORS not configured' })
        return
      }
      if (!ALLOWED_ORIGINS.has(origin)) {
        res.status(403).json({ error: 'Origin not allowed' })
        return
      }
    }
    setCors(res, req)
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    await handler(req, res)
  }
}
