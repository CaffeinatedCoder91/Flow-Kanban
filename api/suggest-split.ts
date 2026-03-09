// api/suggest-split.ts
// POST /api/suggest-split — suggest 2–4 subtasks to break a large task into.

import Anthropic from '@anthropic-ai/sdk'
import { getItemById } from '../lib/db'
import { withCors, getUserId, unauthorized, badRequest, notFound, serverError, type Req, type Res } from './_utils'
import { checkRateLimit } from '../lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const body = req.body as { itemId?: string }
    if (!body?.itemId) return badRequest(res, 'itemId is required')

    const item = await getItemById(userId, body.itemId)
    if (!item) return notFound(res, `Item ${body.itemId} not found`)

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Break this task into 2–4 concrete, actionable subtasks.

Task: ${item.title}
${item.description ? `Description: ${item.description}` : ''}

Return ONLY a JSON array:
[{"title": "...", "description": "...", "estimated_priority": "low"|"medium"|"high"|"critical"}, ...]`,
        },
        { role: 'assistant', content: '[' },
      ],
    })

    const text = '[' + (aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
    const suggestions = JSON.parse(text) as Array<{
      title: string
      description: string
      estimated_priority: string
    }>

    res.status(200).json({ suggestions })
  } catch (err) {
    serverError(res, err)
  }
})
