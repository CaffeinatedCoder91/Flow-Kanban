import { supabase } from './supabaseBrowser'

export const DEMO_EMAIL = 'demo@flow.app'

export async function signInAsGuest() {
  return supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: 'DemoFlow2026!',
  })
}
