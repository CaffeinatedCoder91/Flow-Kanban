// api/recommend-next.ts
// POST /api/recommend-next — ask Claude to pick the single highest-priority task.

import Anthropic from '@anthropic-ai/sdk'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import type { Item } from '../lib/supabase.js'
import { RecommendNextSchema } from '../lib/validation.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const body = req.body as { items?: Item[] }
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return badRequest(res, 'items must be a non-empty array')
    }

    const nonDone = body.items.filter((i) => i.status !== 'done')
    if (nonDone.length === 0) {
      return badRequest(res, 'All items are done — nothing to recommend')
    }

    const itemList = nonDone.map((i) =>
      `${i.id}: [${i.priority}] ${i.title}${i.due_date ? ` (due ${i.due_date})` : ''}${i.status === 'stuck' ? ' [STUCK]' : ''}`
    ).join('\n')

    const today = new Date().toISOString().split('T')[0]

    const aiRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Today is ${today}. Pick the single most important task to work on next. Consider priority, due date, and whether it is stuck.

Tasks:
${itemList}

Return ONLY valid JSON: {"itemId": "<uuid>", "reason": "<1-sentence explanation>"}`,
        },
        { role: 'assistant', content: '{' },
      ],
    })

    const text = '{' + (aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
    const parsed = RecommendNextSchema.parse(JSON.parse(text))

    res.status(200).json({
      recommendedItemId: parsed.itemId,
      reason: parsed.reason,
    })
  } catch (err) {
    serverError(res, err)
  }
})
