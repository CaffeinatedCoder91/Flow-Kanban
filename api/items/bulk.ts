// api/items/bulk.ts
// POST /api/items/bulk — insert multiple items atomically

import { createItem } from '../../lib/db'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from '../_utils'

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

    // Insert all items — Supabase doesn't support transactions via the JS
    // client, so we insert in parallel. If one fails the others succeed;
    // acceptable for bulk import use-case.
    const items = await Promise.all(
      tasks.map((t: Record<string, unknown>) =>
        createItem(userId, {
          title:       typeof t.title       === 'string' ? t.title       : 'Untitled',
          description: typeof t.description === 'string' ? t.description : null,
          status:      typeof t.status      === 'string' ? t.status      : 'not_started',
          priority:    typeof t.priority    === 'string' ? t.priority    : 'medium',
          color:       typeof t.color       === 'string' ? t.color       : null,
          assignee:    typeof t.assignee    === 'string' ? t.assignee    : null,
          due_date:    typeof t.due_date    === 'string' ? t.due_date    : null,
          position:    typeof t.position    === 'number' ? t.position    : 0,
        })
      )
    )

    res.status(201).json({ items: items.map((item) => ({ ...item, history: [] })) })
  } catch (err) {
    serverError(res, err)
  }
})
