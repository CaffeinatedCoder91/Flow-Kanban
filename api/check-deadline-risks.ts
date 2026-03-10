// api/check-deadline-risks.ts
// POST /api/check-deadline-risks — scan for tasks at risk of missing their deadline.
// Pure server-side logic; no AI call.

import { getItems } from '../lib/db.js'
import { withCors, getUserId, unauthorized, serverError, type Req, type Res } from './_utils.js'

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)

  try {
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

        if (i.status === 'not_started' && hoursUntilDue <= 24) {
          riskLevel = 'high'
        } else if (i.status === 'stuck' && hoursUntilDue <= 48) {
          riskLevel = 'high'
        } else if (i.status === 'in_progress' && isToday) {
          riskLevel = 'medium'
        }

        if (!riskLevel) return []

        return [{
          item_id:    i.id,
          title:      i.title,
          due_date:   i.due_date!,
          status:     i.status,
          risk_level: riskLevel,
        }]
      })

    res.status(200).json({ at_risk: atRisk })
  } catch (err) {
    serverError(res, err)
  }
})
