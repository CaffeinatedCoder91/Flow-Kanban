// api/recommend-next.ts
// POST /api/recommend-next — ask Claude to pick the single highest-priority task.

import Anthropic from '@anthropic-ai/sdk'
import { withCors, getClientIp, getUserContext, enforceJsonBodyLimit, requireJson, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, ipRateLimit } from '../lib/rateLimit.js'
import { RecommendNextSchema } from '../lib/validation.js'
import { getItems } from '../lib/db.js'
import { parseJsonFromText, getTokenUsage } from '../lib/ai.js'
import { formatDateOnly } from '../lib/date.js'
import { checkDailyBudget, checkIpDailyBudget, recordDailyUsage, recordIpDailyUsage } from '../lib/usage.js'
import { truncateText } from '../lib/ai.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MAX_RECOMMEND_ITEMS = 200

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userContext = await getUserContext(req)
  if (!userContext) return unauthorized(res)
  const { userId, isDemo } = userContext
  const ip = getClientIp(req)
  if (ip && !await checkRateLimit(res, `ip:${ip}`, ipRateLimit)) return
  if (!await checkRateLimit(res, userId)) return

  try {
    if (!requireJson(req, res)) return
    if (!enforceJsonBodyLimit(req, res)) return
    const items = await getItems(userId)
    if (items.length === 0) {
      return badRequest(res, 'No items found — nothing to recommend')
    }

    const nonDone = items.filter((i) => i.status !== 'done')
    if (nonDone.length === 0) {
      return badRequest(res, 'All items are done — nothing to recommend')
    }

    const budget = await checkDailyBudget(userId, { isDemo })
    if (!budget.allowed) {
      return res.status(429).json({ error: 'Daily AI limit reached', reset: budget.reset })
    }
    if (ip) {
      const ipBudget = await checkIpDailyBudget(ip, { isDemo })
      if (!ipBudget.allowed) {
        return res.status(429).json({ error: 'Daily IP AI limit reached', reset: ipBudget.reset })
      }
    }

    const itemList = nonDone.slice(0, MAX_RECOMMEND_ITEMS).map((i) =>
      `${i.id}: [${i.priority}] ${truncateText(i.title, 120)}${i.due_date ? ` (due ${i.due_date})` : ''}${i.status === 'stuck' ? ' [STUCK]' : ''}`
    ).join('\n')

    const today = formatDateOnly(new Date())

    const aiRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Today is ${today}. Pick the single most important task to work on next. Consider priority, due date, and whether it is stuck.

Tasks:
${itemList}

Return ONLY valid JSON: {"itemId": "<uuid>", "reason": "<1-sentence explanation>"}`,
        },
      ],
    })

    const tokenUsage = getTokenUsage(aiRes)
    await recordDailyUsage(userId, tokenUsage)
    if (ip) await recordIpDailyUsage(ip, tokenUsage)

    const textBlocks = aiRes.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
    const raw = textBlocks.map(b => b.text).join('')
    const parsedRaw = parseJsonFromText<unknown>(raw)
    if (!parsedRaw) {
      return res.status(502).json({ error: 'AI returned malformed recommendation' })
    }
    let parsed
    try {
      parsed = RecommendNextSchema.parse(parsedRaw)
    } catch {
      return res.status(502).json({ error: 'AI returned malformed recommendation' })
    }

    res.status(200).json({
      recommendedItemId: parsed.itemId,
      reason: parsed.reason,
    })
  } catch (err) {
    serverError(res, err)
  }
})
