import { supabase } from './supabaseBrowser'

export const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'demo@flow.com'
const DEMO_SESSION_KEY = 'flow-demo-session'

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
}

export async function signInAsGuest() {
  clearDemoState()
  const devPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined
  if (import.meta.env.MODE === 'development' && devPassword) {
    const result = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: devPassword })
    if (!result.error) localStorage.setItem(DEMO_SESSION_KEY, '1')
    return result
  }

  const authAny = supabase.auth as unknown as { signInAnonymously?: () => Promise<{ data: { session: unknown } | null; error: { message: string } | null }> }
  if (typeof authAny.signInAnonymously === 'function') {
    const result = await authAny.signInAnonymously()
    if (!result.error) localStorage.setItem(DEMO_SESSION_KEY, '1')
    return result
  }

  const rand = crypto.getRandomValues(new Uint32Array(4)).join('')
  const email = `demo+${rand}@example.com`
  const password = `demo-${rand}`
  const signUp = await supabase.auth.signUp({ email, password, options: { data: { demo: true } } })
  if (signUp.error) return signUp
  if (signUp.data.session) {
    localStorage.setItem(DEMO_SESSION_KEY, '1')
    return signUp
  }
  return { error: { message: 'Demo login unavailable. Enable anonymous sign-in or disable email confirmation.' } }
}
