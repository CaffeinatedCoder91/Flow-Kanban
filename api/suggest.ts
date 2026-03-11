// api/suggest.ts
// POST /api/suggest — AI suggestions for task rescheduling or splitting.
// Body: { type: 'reschedule' | 'split', itemId: string }

import Anthropic from '@anthropic-ai/sdk'
import { getItemById, getItems } from '../lib/db.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { withCors, getUserId, unauthorized, badRequest, notFound, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import { SplitSuggestionSchema, RescheduleSuggestionSchema } from '../lib/validation.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const body = req.body as { type?: string; itemId?: string }
    if (!body?.itemId) return badRequest(res, 'itemId is required')
    if (body.type !== 'reschedule' && body.type !== 'split') return badRequest(res, 'type must be reschedule or split')

    const item = await getItemById(userId, body.itemId)
    if (!item) return notFound(res, `Item ${body.itemId} not found`)

    // ── Split ─────────────────────────────────────────────────────────────
    if (body.type === 'split') {
      const aiRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Break this task into 2–4 concrete, actionable subtasks.

Task: ${item.title}
${item.description ? `Description: ${item.description}` : ''}

Return ONLY a JSON array:
[{"title": "...", "description": "...", "estimated_priority": "low"|"medium"|"high"|"critical"}, ...]`,
          },
          { role: 'assistant', content: '[' },
        ],
      })

      const text = '[' + (aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
      const suggestions = SplitSuggestionSchema.parse(JSON.parse(text))

      return res.status(200).json({ suggestions })
    }

    // ── Reschedule ────────────────────────────────────────────────────────
    const today = new Date()
    const twoWeeksOut = new Date(today); twoWeeksOut.setDate(today.getDate() + 14)

    const allItems = await getItems(userId)
    const upcoming = allItems
      .filter((i) =>
        i.due_date &&
        i.id !== item.id &&
        i.status !== 'done' &&
        new Date(i.due_date) >= today &&
        new Date(i.due_date) <= twoWeeksOut
      )
      .slice(0, 10)

    const recentDone = allItems
      .filter((i) => i.status === 'done')
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime())
      .slice(0, 5)

    let pattern: { days: number; count: number } | null = null
    try {
      const { data } = await supabaseAdmin
        .from('deadline_actions')
        .select('days_extended')
        .eq('user_id', userId)
        .eq('action_type', 'reschedule')
        .gt('days_extended', 0)

      if (data && data.length > 0) {
        const counts: Record<number, number> = {}
        for (const row of data) {
          const d = row.days_extended as number
          counts[d] = (counts[d] ?? 0) + 1
        }
        const [topDays, topCount] = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)[0]
          .map(Number) as [number, number]

        if (topCount >= 2) pattern = { days: topDays, count: topCount }
      }
    } catch {
      // deadline_actions table may not exist yet
    }

    const todayStr = today.toISOString().split('T')[0]
    const upcomingText = upcoming.length
      ? upcoming.map((i) => `  - ${i.title} (due ${i.due_date}, ${i.priority})`).join('\n')
      : '  (none in next 14 days)'
    const doneText = recentDone.length
      ? recentDone.map((i) => `  - ${i.title}`).join('\n')
      : '  (none recently)'

    const prompt = `Today is ${todayStr}.

Task to reschedule:
  Title: ${item.title}
  Current due date: ${item.due_date ?? 'none'}
  Priority: ${item.priority}
  Status: ${item.status}

Upcoming tasks (next 14 days):
${upcomingText}

Recently completed tasks:
${doneText}

Suggest 2–3 realistic new due dates for this task. Consider workload spacing and task complexity.
Return ONLY a JSON array: [{"date": "YYYY-MM-DD", "label": "Friendly label e.g. Friday (3 days out)"}, ...]`

    const aiRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '[' },
      ],
    })

    const text = '[' + (aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
    const aiSuggestions = RescheduleSuggestionSchema.parse(JSON.parse(text))

    const suggestions: Array<{ date: string; label: string; isPattern?: true }> = []
    if (pattern) {
      const patternDate = new Date(today)
      patternDate.setDate(today.getDate() + pattern.days)
      suggestions.push({
        date: patternDate.toISOString().split('T')[0],
        label: `${patternDate.toISOString().split('T')[0]} — your usual +${pattern.days} days (used ${pattern.count} times)`,
        isPattern: true,
      })
    }
    suggestions.push(...aiSuggestions)

    res.status(200).json({ suggestions, pattern })
  } catch (err) {
    serverError(res, err)
  }
})
