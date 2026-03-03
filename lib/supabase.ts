// lib/supabase.ts
// Supabase client instances for Flow Kanban.
//
// Two clients:
//   supabaseClient — anon key, respects Row-Level Security (for future client-side use)
//   supabaseAdmin  — service role key, bypasses RLS (for server-side Express routes)

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Item {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  priority: string
  color: string | null
  assignee: string | null
  due_date: string | null   // YYYY-MM-DD
  position: number
  created_at: string
  last_modified: string
}

export interface ItemHistory {
  id: string
  item_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl)            throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey)        throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
if (!supabaseServiceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')

/**
 * Public Supabase client.
 * Uses the anon key — safe to expose to browsers.
 * All queries are subject to Row-Level Security policies.
 */
export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Admin Supabase client.
 * Uses the service role key — bypasses RLS entirely.
 * Only use server-side (Express routes). Never expose to the browser.
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
