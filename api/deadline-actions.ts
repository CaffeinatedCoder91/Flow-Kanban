// api/deadline-actions.ts
// POST /api/deadline-actions — record a deadline action (reschedule/deprioritize/split).
// Requires the deadline_actions table in Supabase (see db/supabase-schema.sql).

import { supabaseAdmin } from '../lib/supabase.js'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, standardRateLimit } from '../lib/rateLimit.js'

const VALID_ACTION_TYPES = ['reschedule', 'deprioritize', 'split'] as const
type ActionType = (typeof VALID_ACTION_TYPES)[number]

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId, standardRateLimit)) return

  try {
    const body = req.body as {
      item_id?: string | null
      action_type?: string
      original_due_date?: string | null
      new_due_date?: string | null
    }

    if (!body?.action_type || !VALID_ACTION_TYPES.includes(body.action_type as ActionType)) {
      return badRequest(res, `action_type must be one of: ${VALID_ACTION_TYPES.join(', ')}`)
    }

    let daysExtended: number | null = null
    if (body.action_type === 'reschedule' && body.original_due_date && body.new_due_date) {
      const orig = new Date(body.original_due_date)
      const next = new Date(body.new_due_date)
      daysExtended = Math.round((next.getTime() - orig.getTime()) / (1000 * 60 * 60 * 24))
    }

    const { error } = await supabaseAdmin.from('deadline_actions').insert({
      item_id:           body.item_id ?? null,
      user_id:           userId,
      action_type:       body.action_type,
      original_due_date: body.original_due_date ?? null,
      new_due_date:      body.new_due_date ?? null,
      days_extended:     daysExtended,
    })

    if (error) throw new Error(`deadline_actions insert failed: ${error.message}`)

    res.status(200).json({ ok: true })
  } catch (err) {
    serverError(res, err)
  }
})
