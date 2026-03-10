// api/health.ts — temporary diagnostic endpoint
import type { Req, Res } from './_utils'

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const checks = {
      NEXT_PUBLIC_SUPABASE_URL:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY:         !!process.env.ANTHROPIC_API_KEY,
    }
    // Try importing supabase to catch init errors
    let supabaseOk = false
    let supabaseError = ''
    try {
      const { supabaseAdmin } = await import('../lib/supabase')
      supabaseOk = !!supabaseAdmin
    } catch (e) {
      supabaseError = e instanceof Error ? e.message : String(e)
    }
    res.status(200).json({ ok: true, envPresent: checks, supabaseOk, supabaseError })
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
