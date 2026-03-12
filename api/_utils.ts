// api/_utils.ts
// Shared helpers for all Vercel serverless functions.

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
export async function getUserId(req: Req): Promise<string | null> {
  const auth = req.headers?.authorization
  const token = typeof auth === 'string' && auth.startsWith('Bearer ')
    ? auth.slice(7)
    : null

  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
)

export function setCors(res: Res, req?: Req): void {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : ''

  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (allowedOrigin) res.setHeader('Vary', 'Origin')
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
    setCors(res, req)
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    await handler(req, res)
  }
}
