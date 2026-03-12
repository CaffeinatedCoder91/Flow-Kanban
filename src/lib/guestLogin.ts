import { supabase } from './supabaseBrowser'

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
  const password = import.meta.env.VITE_DEMO_PASSWORD
  const email = DEMO_EMAIL
  if (!password) {
    return { error: { message: 'VITE_DEMO_PASSWORD is not set' } }
  }
  clearDemoState()
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}
