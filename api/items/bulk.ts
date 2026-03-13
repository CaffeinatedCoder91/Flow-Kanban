// api/items/bulk.ts
// POST /api/items/bulk — insert multiple items atomically

import { createItems } from '../../lib/db.js'
import { withCors, getClientIp, getUserId, enforceJsonBodyLimit, requireJson, unauthorized, badRequest, serverError, type Req, type Res } from '../_utils.js'
import { CreateItemSchema } from '../../lib/validation.js'
import { sanitizeItemFields } from '../../lib/sanitize.js'
import { checkRateLimit, ipRateLimit, standardRateLimit } from '../../lib/rateLimit.js'

const MAX_BULK_ITEMS = 200

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  const ip = getClientIp(req)
  if (ip && !await checkRateLimit(res, `ip:${ip}`, ipRateLimit)) return
  if (!await checkRateLimit(res, userId, standardRateLimit)) return

  try {
    if (!requireJson(req, res)) return
    if (!enforceJsonBodyLimit(req, res)) return
    const body = req.body as Record<string, unknown>
    const tasks = body?.tasks

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return badRequest(res, 'tasks must be a non-empty array')
    }
    if (tasks.length > MAX_BULK_ITEMS) {
      return badRequest(res, `Maximum ${MAX_BULK_ITEMS} items per request`)
    }

    // Validate and sanitize each task via Zod + sanitizeItemFields
    const validated = tasks.map((t: unknown) => CreateItemSchema.safeParse(t))
    const failures = validated.filter(r => !r.success)
    if (failures.length > 0) {
      return badRequest(res, `${failures.length} item(s) failed validation`)
    }

    const rows = validated.map((r) => {
      const { status, priority, due_date, ...textFields } = r.data!
      const clean = sanitizeItemFields(textFields)
      return {
        title:       clean.title!,
        description: clean.description ?? null,
        status:      status   ?? 'not_started',
        priority:    priority ?? 'medium',
        color:       clean.color    ?? null,
        assignee:    clean.assignee ?? null,
        due_date:    due_date ?? null,
        position:    typeof (r.data as Record<string, unknown>).position === 'number'
                       ? (r.data as Record<string, unknown>).position as number : 0,
      }
    })

    const items = await createItems(userId, rows)

    res.status(201).json({ items: items.map((item) => ({ ...item, history: [] })) })
  } catch (err) {
    serverError(res, err)
  }
})
