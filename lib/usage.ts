// lib/usage.ts
// Per-user + per-IP daily AI budget tracking (request count + token usage).

import type { TokenUsage } from './ai.js'
import { supabaseAdmin } from './supabase.js'

function parseLimit(raw: string | undefined, fallback: number): number {
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return fallback
  return Math.floor(value)
}

const DEFAULT_TOKENS_PER_REQUEST = parseLimit(process.env.AI_TOKENS_PER_REQUEST, 1500)

const DEFAULT_DAILY_LIMIT = parseLimit(process.env.AI_DAILY_LIMIT, 50)
const DEFAULT_DAILY_TOKEN_LIMIT = parseLimit(
  process.env.AI_DAILY_TOKEN_LIMIT,
  DEFAULT_DAILY_LIMIT * DEFAULT_TOKENS_PER_REQUEST
)

const DEFAULT_DEMO_DAILY_LIMIT = parseLimit(process.env.AI_DEMO_DAILY_LIMIT, 10)
const DEFAULT_DEMO_DAILY_TOKEN_LIMIT = parseLimit(
  process.env.AI_DEMO_DAILY_TOKEN_LIMIT,
  DEFAULT_DEMO_DAILY_LIMIT * DEFAULT_TOKENS_PER_REQUEST
)

const DEFAULT_IP_DAILY_LIMIT = parseLimit(process.env.AI_IP_DAILY_LIMIT, 50)
const DEFAULT_IP_DAILY_TOKEN_LIMIT = parseLimit(
  process.env.AI_IP_DAILY_TOKEN_LIMIT,
  DEFAULT_IP_DAILY_LIMIT * DEFAULT_TOKENS_PER_REQUEST
)

const DEFAULT_DEMO_IP_DAILY_LIMIT = parseLimit(
  process.env.AI_DEMO_IP_DAILY_LIMIT,
  DEFAULT_IP_DAILY_LIMIT
)
const DEFAULT_DEMO_IP_DAILY_TOKEN_LIMIT = parseLimit(
  process.env.AI_DEMO_IP_DAILY_TOKEN_LIMIT,
  DEFAULT_DEMO_IP_DAILY_LIMIT * DEFAULT_TOKENS_PER_REQUEST
)

function utcDayString(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

function nextUtcMidnightEpoch(): number {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return Math.floor(next.getTime() / 1000)
}

function safeCount(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return Math.floor(num)
}

function normalizeUsage(usage?: TokenUsage): TokenUsage {
  const inputTokens = safeCount(usage?.inputTokens)
  const outputTokens = safeCount(usage?.outputTokens)
  const totalTokens = safeCount(usage?.totalTokens) || inputTokens + outputTokens
  return { inputTokens, outputTokens, totalTokens }
}

function getUserLimits(isDemo?: boolean): { requestLimit: number; tokenLimit: number } {
  if (isDemo) {
    return {
      requestLimit: DEFAULT_DEMO_DAILY_LIMIT,
      tokenLimit: DEFAULT_DEMO_DAILY_TOKEN_LIMIT,
    }
  }
  return {
    requestLimit: DEFAULT_DAILY_LIMIT,
    tokenLimit: DEFAULT_DAILY_TOKEN_LIMIT,
  }
}

function getIpLimits(isDemo?: boolean): { requestLimit: number; tokenLimit: number } {
  if (isDemo) {
    return {
      requestLimit: DEFAULT_DEMO_IP_DAILY_LIMIT,
      tokenLimit: DEFAULT_DEMO_IP_DAILY_TOKEN_LIMIT,
    }
  }
  return {
    requestLimit: DEFAULT_IP_DAILY_LIMIT,
    tokenLimit: DEFAULT_IP_DAILY_TOKEN_LIMIT,
  }
}

export async function checkDailyBudget(
  userId: string,
  options: { isDemo?: boolean } = {},
): Promise<{ allowed: boolean; remaining: number; remainingTokens: number; reset: number }> {
  const day = utcDayString()
  const { requestLimit, tokenLimit } = getUserLimits(options.isDemo)
  const reset = nextUtcMidnightEpoch()

  const { data, error } = await supabaseAdmin
    .from('ai_daily_usage')
    .select('count, total_tokens')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_daily_usage lookup failed: ${error.message}`)
  }

  const count = safeCount(data?.count)
  const totalTokens = safeCount(data?.total_tokens)
  const remaining = Math.max(0, requestLimit - (count + 1))
  const remainingTokens = tokenLimit <= 0
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, tokenLimit - totalTokens)

  if (requestLimit > 0 && count + 1 > requestLimit) {
    return { allowed: false, remaining: 0, remainingTokens, reset }
  }
  if (tokenLimit > 0 && totalTokens >= tokenLimit) {
    return { allowed: false, remaining, remainingTokens: 0, reset }
  }

  return { allowed: true, remaining, remainingTokens, reset }
}

export async function recordDailyUsage(
  userId: string,
  usage: TokenUsage,
): Promise<void> {
  const day = utcDayString()
  const normalized = normalizeUsage(usage)

  const { data, error } = await supabaseAdmin
    .from('ai_daily_usage')
    .select('count, input_tokens, output_tokens, total_tokens')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_daily_usage lookup failed: ${error.message}`)
  }

  const count = safeCount(data?.count)
  const inputTokens = safeCount(data?.input_tokens)
  const outputTokens = safeCount(data?.output_tokens)
  const totalTokens = safeCount(data?.total_tokens)

  const nextCount = count + 1
  const nextInput = inputTokens + normalized.inputTokens
  const nextOutput = outputTokens + normalized.outputTokens
  const nextTotal = totalTokens + normalized.totalTokens

  const { error: upsertErr } = await supabaseAdmin
    .from('ai_daily_usage')
    .upsert(
      {
        user_id: userId,
        day,
        count: nextCount,
        input_tokens: nextInput,
        output_tokens: nextOutput,
        total_tokens: nextTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,day' },
    )

  if (upsertErr) {
    throw new Error(`ai_daily_usage upsert failed: ${upsertErr.message}`)
  }
}

export async function checkIpDailyBudget(
  ip: string,
  options: { isDemo?: boolean } = {},
): Promise<{ allowed: boolean; remaining: number; remainingTokens: number; reset: number }> {
  const day = utcDayString()
  const { requestLimit, tokenLimit } = getIpLimits(options.isDemo)
  const reset = nextUtcMidnightEpoch()

  const { data, error } = await supabaseAdmin
    .from('ai_ip_daily_usage')
    .select('count, total_tokens')
    .eq('ip', ip)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_ip_daily_usage lookup failed: ${error.message}`)
  }

  const count = safeCount(data?.count)
  const totalTokens = safeCount(data?.total_tokens)
  const remaining = Math.max(0, requestLimit - (count + 1))
  const remainingTokens = tokenLimit <= 0
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, tokenLimit - totalTokens)

  if (requestLimit > 0 && count + 1 > requestLimit) {
    return { allowed: false, remaining: 0, remainingTokens, reset }
  }
  if (tokenLimit > 0 && totalTokens >= tokenLimit) {
    return { allowed: false, remaining, remainingTokens: 0, reset }
  }

  return { allowed: true, remaining, remainingTokens, reset }
}

export async function recordIpDailyUsage(
  ip: string,
  usage: TokenUsage,
): Promise<void> {
  const day = utcDayString()
  const normalized = normalizeUsage(usage)

  const { data, error } = await supabaseAdmin
    .from('ai_ip_daily_usage')
    .select('count, input_tokens, output_tokens, total_tokens')
    .eq('ip', ip)
    .eq('day', day)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`ai_ip_daily_usage lookup failed: ${error.message}`)
  }

  const count = safeCount(data?.count)
  const inputTokens = safeCount(data?.input_tokens)
  const outputTokens = safeCount(data?.output_tokens)
  const totalTokens = safeCount(data?.total_tokens)

  const nextCount = count + 1
  const nextInput = inputTokens + normalized.inputTokens
  const nextOutput = outputTokens + normalized.outputTokens
  const nextTotal = totalTokens + normalized.totalTokens

  const { error: upsertErr } = await supabaseAdmin
    .from('ai_ip_daily_usage')
    .upsert(
      {
        ip,
        day,
        count: nextCount,
        input_tokens: nextInput,
        output_tokens: nextOutput,
        total_tokens: nextTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ip,day' },
    )

  if (upsertErr) {
    throw new Error(`ai_ip_daily_usage upsert failed: ${upsertErr.message}`)
  }
}
