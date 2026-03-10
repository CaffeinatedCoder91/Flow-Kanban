// api/items/index.ts
// GET /api/items  — fetch all items for the authenticated user (with history)
// POST /api/items — create a new item

import { getItems, createItem, getItemHistory } from '../../lib/db.js'
import { withCors, getUserId, unauthorized, serverError, type Req, type Res } from '../_utils.js'
import { CreateItemSchema } from '../../lib/validation.js'
import { sanitizeItemFields } from '../../lib/sanitize.js'

export default withCors(async (req: Req, res: Res) => {
  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)

  try {
    if (req.method === 'GET') {
      const items = await getItems(userId)

      // Attach history to each item
      const itemsWithHistory = await Promise.all(
        items.map(async (item) => {
          const history = await getItemHistory(userId, item.id)
          return { ...item, history }
        })
      )

      return res.status(200).json(itemsWithHistory)
    }

    if (req.method === 'POST') {
      const parsed = CreateItemSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const { status, priority, due_date, ...textFields } = parsed.data
      const clean = sanitizeItemFields(textFields)
      const item = await createItem(userId, {
        title:       clean.title!,
        description: clean.description ?? null,
        status:      status   ?? 'not_started',
        priority:    priority ?? 'medium',
        color:       clean.color    ?? null,
        assignee:    clean.assignee ?? null,
        due_date:    due_date ?? null,
      })

      return res.status(201).json({ ...item, history: [] })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    serverError(res, err)
  }
})
