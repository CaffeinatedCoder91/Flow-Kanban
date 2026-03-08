// api/chat.ts
// POST /api/chat — agentic AI assistant with tool use.
// Claude can create, update, delete, and move items on the board.

import Anthropic from '@anthropic-ai/sdk'
import { createItem, updateItem, deleteItem, getItemById } from '../lib/db'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils'
import type { Item } from '../lib/supabase'
import { ChatSchema } from '../lib/validation'

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

  try {
    const parsed = ChatSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const { message, items = [] } = parsed.data
    const actions: string[] = []
    const errors: string[] = []

    const boardContext = items.map(i =>
      `[${i.id}] ${i.title} | status: ${i.status} | priority: ${i.priority}${i.due_date ? ` | due: ${i.due_date}` : ''}`
    ).join('\n')

    const systemPrompt = `You are a helpful kanban board assistant. You can manage tasks on the user's board.

Current board state:
${boardContext || '(empty board)'}

Today's date: ${new Date().toISOString().split('T')[0]}`

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: message },
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
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        const input = toolUse.input as Record<string, string>
        let result = ''

        try {
          if (toolUse.name === 'create_item') {
            const item = await createItem(userId, {
              title:       input.title,
              status:      input.status      ?? 'not_started',
              priority:    input.priority    ?? 'medium',
              description: input.description ?? null,
              assignee:    input.assignee    ?? null,
              due_date:    input.due_date    ?? null,
            })
            result = JSON.stringify({ ok: true, id: item.id, title: item.title })
            actions.push(`Created task: ${item.title}`)
          } else if (toolUse.name === 'update_item') {
            const { id, ...fields } = input
            const item = await updateItem(userId, id, fields as Partial<Item>)
            result = JSON.stringify({ ok: true, id: item.id })
            actions.push(`Updated task: ${item.title}`)
          } else if (toolUse.name === 'delete_item') {
            const item = await getItemById(userId, input.id)
            const deleted = await deleteItem(userId, input.id)
            result = JSON.stringify({ ok: deleted })
            if (item) actions.push(`Deleted task: ${item.title}`)
          } else if (toolUse.name === 'move_item') {
            const item = await updateItem(userId, input.id, { status: input.new_status })
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
