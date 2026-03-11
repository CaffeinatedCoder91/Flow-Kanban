// api/deadline-actions.ts
// POST /api/deadline-actions — record a deadline action (reschedule/deprioritize/split).
// Requires the deadline_actions table in Supabase (see db/supabase-schema.sql).

import { supabaseAdmin } from '../lib/supabase.js'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, standardRateLimit } from '../lib/rateLimit.js'
import { DeadlineActionSchema } from '../lib/validation.js'

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId, standardRateLimit)) return

  try {
    const parsed = DeadlineActionSchema.safeParse(req.body)
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

    res.status(200).json({ ok: true })
  } catch (err) {
    serverError(res, err)
  }
})
