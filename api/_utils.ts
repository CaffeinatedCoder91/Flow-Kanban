// api/_utils.ts
// Shared helpers for all Vercel serverless functions.

import { supabaseAdmin } from '../lib/supabase'
import { captureException } from './_lib/sentry'

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

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function setCors(res: Res): void {
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, val)
  }
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
  const message = err instanceof Error ? err.message : 'Internal server error'
  console.error('[api]', message, err)
  captureException(err, context)
  res.status(500).json({ error: message })
}

// ─── Vercel handler wrapper ───────────────────────────────────────────────────

type Handler = (req: Req, res: Res) => Promise<void>

/**
 * Wraps a handler with CORS headers and OPTIONS preflight handling.
 */
export function withCors(handler: Handler): Handler {
  return async (req: Req, res: Res) => {
    setCors(res)
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    await handler(req, res)
  }
}
