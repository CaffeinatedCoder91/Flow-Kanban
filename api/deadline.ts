// api/deadline.ts
// POST /api/deadline — deadline operations.
//
// Body without action_type → check at-risk items  (was /api/check-deadline-risks)
// Body with    action_type → record a deadline action (was /api/deadline-actions)

import { getItems } from '../lib/db.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, standardRateLimit } from '../lib/rateLimit.js'
import { DeadlineActionSchema } from '../lib/validation.js'

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId, standardRateLimit)) return

  const body = (req.body ?? {}) as Record<string, unknown>

  try {
    if ('action_type' in body) {
      // ── Record deadline action ────────────────────────────────────────────────
      const parsed = DeadlineActionSchema.safeParse(body)
      if (!parsed.success) return badRequest(res, parsed.error.issues[0]?.message ?? 'Invalid request body')
      const { action_type, item_id, original_due_date, new_due_date } = parsed.data

      let daysExtended: number | null = null
      if (action_type === 'reschedule' && original_due_date && new_due_date) {
        const orig = new Date(original_due_date)
        const next = new Date(new_due_date)
        daysExtended = Math.round((next.getTime() - orig.getTime()) / (1000 * 60 * 60 * 24))
      }

      const { error } = await supabaseAdmin.from('deadline_actions').insert({
        item_id:           item_id ?? null,
        user_id:           userId,
        action_type,
        original_due_date: original_due_date ?? null,
        new_due_date:      new_due_date ?? null,
        days_extended:     daysExtended,
      })

      if (error) throw new Error(`deadline_actions insert failed: ${error.message}`)
      return res.status(200).json({ ok: true })
    } else {
      // ── Check deadline risks ──────────────────────────────────────────────────
      const items = await getItems(userId)
      const now = new Date()

      const atRisk = items
        .filter((i) => i.due_date && i.status !== 'done')
        .flatMap((i) => {
          const due = new Date(i.due_date!)
          const msUntilDue = due.getTime() - now.getTime()
          const hoursUntilDue = msUntilDue / (1000 * 60 * 60)
          const isToday = due.toDateString() === now.toDateString()

          let riskLevel: 'high' | 'medium' | null = null
          if (i.status === 'not_started' && hoursUntilDue <= 24) riskLevel = 'high'
          else if (i.status === 'stuck' && hoursUntilDue <= 48) riskLevel = 'high'
          else if (i.status === 'in_progress' && isToday) riskLevel = 'medium'

          if (!riskLevel) return []
          return [{ item_id: i.id, title: i.title, due_date: i.due_date!, status: i.status, risk_level: riskLevel }]
        })

      return res.status(200).json({ at_risk: atRisk })
    }
  } catch (err) {
    serverError(res, err)
  }
})
