// api/items/bulk.ts
// POST /api/items/bulk — insert multiple items atomically

import { createItem } from '../../lib/db.js'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from '../_utils.js'
import { CreateItemSchema } from '../../lib/validation.js'
import { sanitizeItemFields } from '../../lib/sanitize.js'

const MAX_BULK_ITEMS = 200

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)

  try {
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

    const items = await Promise.all(
      validated.map((r) => {
        const { status, priority, due_date, ...textFields } = r.data!
        const clean = sanitizeItemFields(textFields)
        return createItem(userId, {
          title:       clean.title!,
          description: clean.description ?? null,
          status:      status   ?? 'not_started',
          priority:    priority ?? 'medium',
          color:       clean.color    ?? null,
          assignee:    clean.assignee ?? null,
          due_date:    due_date ?? null,
          position:    typeof (r.data as Record<string, unknown>).position === 'number'
                         ? (r.data as Record<string, unknown>).position as number : 0,
        })
      })
    )

    res.status(201).json({ items: items.map((item) => ({ ...item, history: [] })) })
  } catch (err) {
    serverError(res, err)
  }
})
