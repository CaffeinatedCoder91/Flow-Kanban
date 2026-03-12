import { supabase } from './supabaseBrowser'
import { apiFetch } from './api'

export const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'demo@flow.com'

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
}

export async function signInAsGuest() {
  clearDemoState()
  const devPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined
  if (import.meta.env.MODE === 'development' && devPassword) {
    return supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: devPassword })
  }
  const res = await apiFetch('/api/demo-login', { method: 'POST' })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    return { error: { message: payload.error || 'Demo login unavailable' } }
  }
  const { email, password } = await res.json() as { email: string; password: string }
  return supabase.auth.signInWithPassword({ email, password })
}
