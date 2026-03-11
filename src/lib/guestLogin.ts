import { supabase } from './supabaseBrowser'

export const DEMO_EMAIL = 'demo@flow.com'

export async function signInAsGuest() {
  const password = import.meta.env.VITE_DEMO_PASSWORD
  if (!password) throw new Error('VITE_DEMO_PASSWORD is not set')
  return supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password,
  })
}
