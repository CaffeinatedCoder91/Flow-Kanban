// api/chat.ts
// POST /api/chat — agentic AI assistant with tool use.
// Claude can create, update, delete, and move items on the board.

import Anthropic from '@anthropic-ai/sdk'
import { createItem, updateItem, deleteItem, getItemById } from '../lib/db.js'
import { withCors, getClientIp, getUserId, unauthorized, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit, ipRateLimit } from '../lib/rateLimit.js'
import type { Item } from '../lib/supabase.js'
import { ChatSchema, ToolCreateItemSchema, ToolDeleteItemSchema, ToolMoveItemSchema, ToolUpdateItemSchema } from '../lib/validation.js'
import { sanitizeItemFields } from '../lib/sanitize.js'
import { formatDateOnly } from '../lib/date.js'
import { consumeDailyBudget, consumeIpDailyBudget } from '../lib/usage.js'
import { truncateText } from '../lib/ai.js'

const MAX_TOOL_ROUNDS = 3
const MAX_CHAT_ITEMS = 100
const MAX_MESSAGE_CHARS = 2000
const MAX_TITLE_CHARS = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_item',
    description: 'Create a new task on the board.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:    { type: 'string', description: 'Task title (required)' },
        status:   { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'], description: 'Initial status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' },
        description: { type: 'string', description: 'Optional description' },
        assignee:    { type: 'string', description: 'Optional assignee name' },
        due_date:    { type: 'string', description: 'Optional due date YYYY-MM-DD' },
      },
      required: ['title', 'status'],
    },
  },
  {
    name: 'update_item',
    description: 'Update fields on an existing task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id:       { type: 'string', description: 'Task UUID' },
        title:    { type: 'string' },
        status:   { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        description: { type: 'string' },
        assignee:    { type: 'string' },
        due_date:    { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete a task from the board.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Task UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'move_item',
    description: "Change a task's status column (equivalent to dragging it).",
    input_schema: {
      type: 'object' as const,
      properties: {
        id:         { type: 'string', description: 'Task UUID' },
        new_status: { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'] },
      },
      required: ['id', 'new_status'],
    },
  },
]

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  const ip = getClientIp(req)
  if (ip && !await checkRateLimit(res, `ip:${ip}`, ipRateLimit)) return
  if (!await checkRateLimit(res, userId)) return

  try {
    const budget = await consumeDailyBudget(userId)
    if (!budget.allowed) {
      return res.status(429).json({ error: 'Daily AI limit reached', reset: budget.reset })
    }
    if (ip) {
      const ipBudget = await consumeIpDailyBudget(ip)
      if (!ipBudget.allowed) {
        return res.status(429).json({ error: 'Daily IP AI limit reached', reset: ipBudget.reset })
      }
    }

    const parsed = ChatSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const { message, items = [] } = parsed.data
    const actions: string[] = []
    const errors: string[] = []

    const cappedItems = items.slice(0, MAX_CHAT_ITEMS)
    const boardContext = cappedItems.map(i =>
      `[${i.id}] ${truncateText(String(i.title ?? ''), MAX_TITLE_CHARS)} | status: ${i.status} | priority: ${i.priority}${i.due_date ? ` | due: ${i.due_date}` : ''}`
    ).join('\n')

    const systemPrompt = `You are a helpful kanban board assistant. You can manage tasks on the user's board.

Current board state:
${boardContext || '(empty board)'}

Today's date: ${formatDateOnly(new Date())}`

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: truncateText(message, MAX_MESSAGE_CHARS) },
    ]

    // First API call
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    })

    // Agentic loop — execute tool calls and feed results back
    let toolRounds = 0
    let lastActionCount = 0
    let stalledRounds = 0
    while (response.stop_reason === 'tool_use' && ++toolRounds <= MAX_TOOL_ROUNDS) {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        const input = toolUse.input as Record<string, string>
        let result = ''

        try {
          if (toolUse.name === 'create_item') {
            const parsed = ToolCreateItemSchema.safeParse(input)
            if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid create_item input')
            const clean = sanitizeItemFields({
              title:       parsed.data.title,
              description: parsed.data.description ?? null,
              assignee:    parsed.data.assignee    ?? null,
            })
            const item = await createItem(userId, {
              title:       clean.title || 'Untitled',
              status:      parsed.data.status      ?? 'not_started',
              priority:    parsed.data.priority    ?? 'medium',
              description: clean.description ?? null,
              assignee:    clean.assignee    ?? null,
              due_date:    parsed.data.due_date    ?? null,
            })
            result = JSON.stringify({ ok: true, id: item.id, title: item.title })
            actions.push(`Created task: ${item.title}`)
          } else if (toolUse.name === 'update_item') {
            const parsed = ToolUpdateItemSchema.safeParse(input)
            if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid update_item input')
            const { id, ...fields } = parsed.data
            const cleanFields = sanitizeItemFields(fields)
            const item = await updateItem(userId, id, cleanFields as Partial<Item>)
            result = JSON.stringify({ ok: true, id: item.id })
            actions.push(`Updated task: ${item.title}`)
          } else if (toolUse.name === 'delete_item') {
            const parsed = ToolDeleteItemSchema.safeParse(input)
            if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid delete_item input')
            const item = await getItemById(userId, parsed.data.id)
            const deleted = await deleteItem(userId, parsed.data.id)
            result = JSON.stringify({ ok: deleted })
            if (item) actions.push(`Deleted task: ${item.title}`)
          } else if (toolUse.name === 'move_item') {
            const parsed = ToolMoveItemSchema.safeParse(input)
            if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid move_item input')
            const item = await updateItem(userId, parsed.data.id, { status: parsed.data.new_status })
            result = JSON.stringify({ ok: true, id: item.id, new_status: item.status })
            actions.push(`Moved task '${item.title}' to ${item.status}`)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          result = JSON.stringify({ ok: false, error: msg })
          errors.push(`${toolUse.name} failed: ${msg}`)
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        })
      }

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      })

      if (actions.length === lastActionCount) {
        stalledRounds += 1
        if (stalledRounds >= 2) break
      } else {
        stalledRounds = 0
        lastActionCount = actions.length
      }
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const replyText = textBlock?.text ?? ''

    res.status(200).json({
      response: replyText,
      ...(actions.length ? { actions } : {}),
      ...(errors.length  ? { errors }  : {}),
    })
  } catch (err) {
    serverError(res, err)
  }
})
