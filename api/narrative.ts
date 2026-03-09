// api/narrative.ts
// POST /api/narrative — standup summary + momentum score for a given period.
// Queries items and item_history directly from Supabase (scoped to userId).

import Anthropic from '@anthropic-ai/sdk'
import { getItems } from '../lib/db'
import { supabaseAdmin } from '../lib/supabase'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils'
import { checkRateLimit } from '../lib/rateLimit'
import type { ItemHistory } from '../lib/supabase'
import { NarrativeSchema } from '../lib/validation'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Period = 'last_week' | 'last_30_days' | 'this_month' | 'previous_7_days'

function getPeriodBounds(period: Period): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  let start: Date

  switch (period) {
    case 'last_week':
      start = new Date(now); start.setDate(now.getDate() - 7)
      break
    case 'last_30_days':
      start = new Date(now); start.setDate(now.getDate() - 30)
      break
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'previous_7_days':
      start = new Date(now); start.setDate(now.getDate() - 14)
      end.setDate(now.getDate() - 7)
      break
  }

  return { start, end }
}

interface HistoryWithTitle extends ItemHistory {
  item_title?: string
  description?: string
}

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const parsed = NarrativeSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const period = parsed.data.period as Period

    const { start, end } = getPeriodBounds(period)

    // ── Query all user's items ─────────────────────────────────────────────
    const allItems = await getItems(userId)
    const itemById = new Map(allItems.map((i) => [i.id, i]))

    // ── Tasks created in period ────────────────────────────────────────────
    const tasksCreated = allItems.filter((i) => {
      const created = new Date(i.created_at)
      return created >= start && created <= end
    })

    // ── History in period ──────────────────────────────────────────────────
    const userItemIds = allItems.map((i) => i.id)

    let history: ItemHistory[] = []
    if (userItemIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('item_history')
        .select('*')
        .in('item_id', userItemIds)
        .gte('changed_at', start.toISOString())
        .lte('changed_at', end.toISOString())
        .order('changed_at', { ascending: true })

      if (error) throw new Error(`narrative history query failed: ${error.message}`)
      history = (data ?? []) as ItemHistory[]
    }

    // ── Attach item title + human description to each history entry ────────
    const enriched: HistoryWithTitle[] = history.map((h) => {
      const item = itemById.get(h.item_id)
      const title = item?.title ?? 'Unknown task'
      let description = `${h.field} changed`
      if (h.old_value == null && h.new_value != null) {
        description = `${h.field} set to '${h.new_value}'`
      } else if (h.old_value != null && h.new_value == null) {
        description = `${h.field} cleared`
      } else if (h.old_value != null && h.new_value != null) {
        description = `${h.field} changed from '${h.old_value}' to '${h.new_value}'`
      }
      return { ...h, item_title: title, description }
    })

    // ── Partition history by type ──────────────────────────────────────────
    const statusChanges    = enriched.filter((h) => h.field === 'status')
    const priorityChanges  = enriched.filter((h) => h.field === 'priority')
    const tasksCompleted   = statusChanges.filter((h) => h.new_value === 'done')
    const tasksStuck       = statusChanges.filter((h) => h.new_value === 'stuck')
    const tasksUnblocked   = statusChanges.filter((h) => h.old_value === 'stuck' && h.new_value !== 'stuck')

    const summary = {
      tasks_created:   tasksCreated.length,
      tasks_completed: tasksCompleted.length,
      tasks_stuck:     tasksStuck.length,
      tasks_unblocked: tasksUnblocked.length,
      status_changes:  statusChanges.length,
      priority_changes: priorityChanges.length,
    }

    // ── AI: narrative + momentum (parallel) ───────────────────────────────
    const statsText = `Period: ${period}
Tasks created: ${summary.tasks_created}
Tasks completed: ${summary.tasks_completed}
Tasks stuck: ${summary.tasks_stuck}
Tasks unblocked: ${summary.tasks_unblocked}
Status changes: ${summary.status_changes}
Priority changes: ${summary.priority_changes}
Completed tasks: ${tasksCompleted.map((h) => h.item_title).join(', ') || 'none'}
Stuck tasks: ${tasksStuck.map((h) => h.item_title).join(', ') || 'none'}`

    const [narrativeRes, momentumRes] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Write a 2–3 sentence plain-English standup summary for this period.\n\n${statsText}`,
        }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Score the team's momentum from 0–100 and classify sentiment.\n\n${statsText}\n\nReturn ONLY valid JSON: {"score": N, "reasoning": "...", "sentiment": "healthy"|"at_risk"|"critical"}`,
          },
          { role: 'assistant', content: '{' },
        ],
      }),
    ])

    const narrative = narrativeRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''

    let momentum: { score: number; reasoning: string; sentiment: string } | null = null
    try {
      const mText = '{' + (momentumRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
      momentum = JSON.parse(mText)
    } catch {
      // momentum is optional
    }

    res.status(200).json({
      period,
      period_start: start.toISOString(),
      period_end:   end.toISOString(),
      summary,
      tasks_created:   tasksCreated,
      tasks_completed: tasksCompleted,
      tasks_stuck:     tasksStuck,
      tasks_unblocked: tasksUnblocked,
      status_changes:  statusChanges,
      priority_changes: priorityChanges,
      narrative,
      momentum,
    })
  } catch (err) {
    serverError(res, err)
  }
})
