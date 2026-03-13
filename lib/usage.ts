// lib/usage.ts
// Per-user daily AI budget tracking.

import { supabaseAdmin } from './supabase.js'

const DEFAULT_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 50)
const DEFAULT_IP_DAILY_LIMIT = Number(process.env.AI_IP_DAILY_LIMIT ?? 50)

function utcDayString(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

function nextUtcMidnightEpoch(): number {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return Math.floor(next.getTime() / 1000)
}

export async function consumeDailyBudget(
  userId: string,
  limit = DEFAULT_DAILY_LIMIT,
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const day = utcDayString()
  let count = 0

  const { data, error } = await supabaseAdmin
    .from('ai_daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_daily_usage lookup failed: ${error.message}`)
  }

  if (data?.count != null) count = data.count as number

  if (count + 1 > limit) {
    return { allowed: false, remaining: 0, reset: nextUtcMidnightEpoch() }
  }

  const { error: upsertErr } = await supabaseAdmin
    .from('ai_daily_usage')
    .upsert(
      { user_id: userId, day, count: count + 1, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,day' },
    )

  if (upsertErr) {
    throw new Error(`ai_daily_usage upsert failed: ${upsertErr.message}`)
  }

  return { allowed: true, remaining: Math.max(0, limit - (count + 1)), reset: nextUtcMidnightEpoch() }
}

export async function consumeIpDailyBudget(
  ip: string,
  limit = DEFAULT_IP_DAILY_LIMIT,
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const day = utcDayString()
  let count = 0

  const { data, error } = await supabaseAdmin
    .from('ai_ip_daily_usage')
    .select('count')
    .eq('ip', ip)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_ip_daily_usage lookup failed: ${error.message}`)
  }

  if (data?.count != null) count = data.count as number

  if (count + 1 > limit) {
    return { allowed: false, remaining: 0, reset: nextUtcMidnightEpoch() }
  }

  const { error: upsertErr } = await supabaseAdmin
    .from('ai_ip_daily_usage')
    .upsert(
      { ip, day, count: count + 1, updated_at: new Date().toISOString() },
      { onConflict: 'ip,day' },
    )

  if (upsertErr) {
    throw new Error(`ai_ip_daily_usage upsert failed: ${upsertErr.message}`)
  }

  return { allowed: true, remaining: Math.max(0, limit - (count + 1)), reset: nextUtcMidnightEpoch() }
}
