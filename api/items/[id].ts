// api/items/[id].ts
// PATCH /api/items/:id — update fields on an item
// DELETE /api/items/:id — delete an item

import { updateItem, deleteItem, getItemHistory } from '../../lib/db'
import { withCors, getUserId, unauthorized, badRequest, notFound, serverError, type Req, type Res } from '../_utils'
import type { Item } from '../../lib/supabase'
import { UpdateItemSchema } from '../../lib/validation'
import { sanitizeItemFields } from '../../lib/sanitize'

export default withCors(async (req: Req, res: Res) => {
  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)

  const { id } = req.query
  const itemId = Array.isArray(id) ? id[0] : id
  if (!itemId) return badRequest(res, 'Missing item id')

  try {
    if (req.method === 'PATCH') {
      const parsed = UpdateItemSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const patch = sanitizeItemFields(parsed.data) as Partial<Item>

      if (Object.keys(patch).length === 0) {
        return badRequest(res, 'No valid fields provided')
      }

      let updated: Item
      try {
        updated = await updateItem(userId, itemId, patch)
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('not found')) return notFound(res, `Item ${itemId} not found`)
        throw err
      }

      const history = await getItemHistory(userId, itemId)
      return res.status(200).json({ ...updated, history })
    }

    if (req.method === 'DELETE') {
      const deleted = await deleteItem(userId, itemId)
      if (!deleted) return notFound(res, `Item ${itemId} not found`)
      return res.status(200).json({ ok: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    serverError(res, err)
  }
})
