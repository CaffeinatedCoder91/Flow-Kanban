import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const NODE_ENV = Deno.env.get('NODE_ENV') ?? 'production'

const DEFAULT_ORIGINS = NODE_ENV === 'production'
  ? ''
  : 'http://localhost:5173,http://localhost:3000'

const ALLOWED_ORIGINS = new Set(
  (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? DEFAULT_ORIGINS)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
)

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers()
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
  headers.set('Cache-Control', 'no-store')
  return headers
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  const headers = corsHeaders(origin)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers })
}

function randomToken(bytes = 16): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  const origin = req.headers.get('origin')

  if (NODE_ENV === 'production' && origin) {
    if (ALLOWED_ORIGINS.size === 0) {
      return jsonResponse({ error: 'CORS not configured' }, 500, origin)
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
    }
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    console.error('Missing env vars:', {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_ROLE_KEY,
      hasAnonKey: !!SUPABASE_ANON_KEY,
    })
    return jsonResponse({ error: 'Supabase env not configured' }, 500, origin)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const seed = randomToken(12)
  const email = `demo+${seed}@flow-demo.local`
  const password = `demo-${randomToken(16)}`
  const now = new Date().toISOString()

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { demo: true, demo_created_at: now },
  })
  if (createError) {
    console.error('createUser failed:', createError.message, createError.status)
    return jsonResponse({ error: 'Failed to create demo user' }, 500, origin)
  }

  const { data, error: signInError } = await anon.auth.signInWithPassword({ email, password })
  if (signInError || !data.session) {
    console.error('signIn failed:', signInError?.message, signInError?.status)
    return jsonResponse({ error: 'Failed to create demo session' }, 500, origin)
  }

  return jsonResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
  }, 200, origin)
})
