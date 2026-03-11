// api/extract-tasks.ts
// POST /api/extract-tasks — extract actionable tasks from freeform text.

import Anthropic from '@anthropic-ai/sdk'
import { withCors, getUserId, unauthorized, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import { ExtractTasksSchema, ExtractedTaskSchema } from '../lib/validation.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const EXTRACT_SYSTEM_PROMPT = `You are a task extraction assistant. Extract all actionable tasks from the provided text.
For each task return:
- title: clear, actionable task title (start with a verb)
- description: any relevant context or details (null if none)
- priority: low | medium | high | critical (infer from urgency words)
- due_date: YYYY-MM-DD if a date is mentioned, otherwise null
- assignee: person name if mentioned, otherwise null
- status: not_started | in_progress | stuck | done (infer from context)
- status_reasoning: brief explanation of why you chose this status (null if not_started and obvious)
- color: always null
- confidence: object with 0–100 scores for title, priority, due_date, assignee, description`

export async function extractTasksFromText(text: string) {
  const aiRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Extract tasks from the following text:\n\n${text}` },
      { role: 'assistant', content: '[' },
    ],
  })

  const raw = '[' + (aiRes.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '')
  return ExtractedTaskSchema.parse(JSON.parse(raw))
}

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
    const parsed = ExtractTasksSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const tasks = await extractTasksFromText(parsed.data.text)

    if (tasks.length === 0) {
      return res.status(200).json({
        tasks: [],
        message: 'No actionable tasks found in the provided text.',
      })
    }

    res.status(200).json({ tasks })
  } catch (err) {
    serverError(res, err)
  }
})
