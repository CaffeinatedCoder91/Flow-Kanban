// src/lib/api.ts
// Auth-aware fetch helper.
// All /api/* calls in the app should go through apiFetch so the Supabase JWT
// is attached to every request and 401 responses trigger a sign-out.

import { supabase } from './supabaseBrowser'

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

async function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * Fetch wrapper that:
 *  - Injects Authorization: Bearer <supabase-jwt> header
 *  - Skips Content-Type: application/json for FormData bodies (file uploads)
 *  - Retries on transient errors (same logic as the old fetchWithRetry)
 *  - Signs the user out and reloads on 401
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  maxAttempts = 3,
  baseDelayMs = 300,
): Promise<Response> {
  const token = await getToken()

  const extraHeaders: Record<string, string> = {}
  if (!(options.body instanceof FormData)) {
    extraHeaders['Content-Type'] = 'application/json'
  }
  if (token) {
    extraHeaders['Authorization'] = `Bearer ${token}`
  }

  const init: RequestInit = {
    ...options,
    headers: { ...extraHeaders, ...(options.headers as Record<string, string> | undefined) },
  }

  let attempt = 0
  while (true) {
    try {
      const res = await fetch(url, init)

      if (res.status === 401) {
        await supabase.auth.signOut()
        window.location.reload()
        throw new Error('Session expired — please sign in again')
      }

      if (!RETRYABLE.has(res.status) || attempt >= maxAttempts - 1) return res

      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 100)
      attempt++
    } catch (err) {
      if (attempt >= maxAttempts - 1) throw err
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 100)
      attempt++
    }
  }
}
