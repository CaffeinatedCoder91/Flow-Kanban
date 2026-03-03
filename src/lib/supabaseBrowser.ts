// src/lib/supabaseBrowser.ts
// Browser-side Supabase client.
// Uses import.meta.env (Vite) — safe to import in React components.
// The server-side client lives in lib/supabase.ts and uses process.env.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl)     throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
