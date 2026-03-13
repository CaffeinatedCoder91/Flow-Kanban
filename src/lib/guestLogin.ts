import { supabase } from './supabaseBrowser'

type DemoEnv = {
  MODE?: string
  VITE_DEMO_PASSWORD?: string
}

function getEnv(): DemoEnv {
  const testEnv = (globalThis as { __FLOW_ENV__?: DemoEnv }).__FLOW_ENV__
  return testEnv ?? import.meta.env
}

export const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'demo@flow.com'
const DEMO_SESSION_KEY = 'flow-demo-session'
const DEMO_SESSION_STARTED_AT = 'flow-demo-session-started-at'
const DEMO_TTL_MS = 24 * 60 * 60 * 1000

const FLOW_STORAGE_KEYS = [
  'flow-welcome-seen',
  'flow-sample-ids',
  'flow-tried-ai',
  'flow-imported-tasks',
  'flow-first-celebration-done',
  'flow-first-done',
  'flow-onboarding-dismissed',
  'dismissed-insights',
]

export function clearDemoState() {
  FLOW_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
  try { localStorage.removeItem(DEMO_SESSION_KEY) } catch {}
  try { localStorage.removeItem(DEMO_SESSION_STARTED_AT) } catch {}
}

export async function signInAsGuest() {
  clearDemoState()
  const env = getEnv()
  const devPassword = env.VITE_DEMO_PASSWORD as string | undefined
  const isDev = env.MODE === 'development'
  if (isDev && devPassword) {
    const result = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: devPassword })
    if (!result.error) {
      localStorage.setItem(DEMO_SESSION_KEY, '1')
      localStorage.setItem(DEMO_SESSION_STARTED_AT, String(Date.now()))
      await supabase.auth.updateUser({ data: { demo: true, demo_created_at: new Date().toISOString() } })
    }
    return result
  }

  const { data, error } = await supabase.functions.invoke('demo-login')
  if (error) {
    return { error: { message: error.message || 'Demo login unavailable. Please try again.' } }
  }

  const payload = data as { access_token?: string; refresh_token?: string }
  if (!payload?.access_token || !payload?.refresh_token) {
    return { error: { message: 'Demo login unavailable. Please try again.' } }
  }

  const session = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  })
  if (session.error) return session

  localStorage.setItem(DEMO_SESSION_KEY, '1')
  localStorage.setItem(DEMO_SESSION_STARTED_AT, String(Date.now()))
  return session
}

export function isDemoSessionExpired(): boolean {
  const raw = localStorage.getItem(DEMO_SESSION_STARTED_AT)
  if (!raw) return false
  const started = Number(raw)
  if (!Number.isFinite(started)) return false
  return Date.now() - started > DEMO_TTL_MS
}
