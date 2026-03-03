// api/items/index.ts
// GET /api/items  — fetch all items for the authenticated user (with history)
// POST /api/items — create a new item

import { getItems, createItem, getItemHistory } from '../../lib/db'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from '../_utils'

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
      const body = req.body as Record<string, unknown>

      if (!body?.title || typeof body.title !== 'string') {
        return badRequest(res, 'title is required')
      }

      const item = await createItem(userId, {
        title:       body.title,
        description: typeof body.description === 'string' ? body.description : null,
        status:      typeof body.status   === 'string' ? body.status   : 'not_started',
        priority:    typeof body.priority === 'string' ? body.priority : 'medium',
        color:       typeof body.color    === 'string' ? body.color    : null,
        assignee:    typeof body.assignee === 'string' ? body.assignee : null,
        due_date:    typeof body.due_date === 'string' ? body.due_date : null,
      })

      return res.status(201).json({ ...item, history: [] })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    serverError(res, err)
  }
})
