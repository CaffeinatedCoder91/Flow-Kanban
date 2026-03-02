import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import db from './db'

dotenv.config()

interface ItemRow {
  id: number
  title: string
  description: string | null
  status: string
  priority: string
  color: string | null
  assignee: string | null
  due_date: string | null
  position: number
  created_at: string
  last_modified: string
  [key: string]: unknown
}

interface HistoryRow {
  id: number
  item_id: number
  changed_at: string
  description: string
}

interface Insight {
  type: 'stale' | 'bottleneck' | 'duplicate' | 'priority_inflation' | 'deadline_cluster'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  items: number[]
}

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.pdf', '.docx']
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type. Please upload a .txt, .pdf, or .docx file.`))
    }
  },
})

type FieldConfidence = {
  title: number
  priority: number
  due_date: number
  assignee: number
  description: number
}

type ExtractedTask = {
  title: string
  description: string | null
  priority: string
  due_date: string | null
  assignee: string | null
  status: string
  status_reasoning: string | null
  color: string | null
  confidence: FieldConfidence
}

async function extractTasksFromText(text: string): Promise<{ tasks: ExtractedTask[]; message?: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Extract actionable tasks from this text. For each task, provide:
- title: short task title
- description: 1 sentence of context
- priority: low/medium/high/critical
- due_date: ISO format YYYY-MM-DD if mentioned, otherwise null
- assignee: person's name if mentioned, otherwise null
- status: infer from the text using these rules:
  * "in_progress" if the text indicates it is currently being worked on (e.g. "working on", "in progress", "currently doing", "underway")
  * "stuck" if the text indicates a blocker (e.g. "blocked", "stuck", "waiting for", "can't proceed", "on hold")
  * "done" if the text indicates completion (e.g. "done", "completed", "finished", "shipped", "resolved")
  * "not_started" otherwise (default)
- status_reasoning: a brief phrase (5-10 words) explaining why you chose that status, e.g. "text says 'currently working on this'" or "defaulted — no status cues found"
- color: always null
- confidence: an object with integer confidence scores (0-100) for each of these fields:
  { "title": <int>, "priority": <int>, "due_date": <int>, "assignee": <int>, "description": <int> }
  Score 100 if explicitly stated in the text, 70-90 if reasonably inferred from context,
  50-70 if guessing based on weak signals, below 50 if very uncertain.
  For null fields (due_date, assignee), score 100 if clearly not mentioned, lower if it might have been implied.

Return as a JSON array of task objects and nothing else. If there are no actionable tasks, return an empty array [].

Text:
${text}`,
      },
      {
        role: 'assistant',
        content: '[',
      },
    ],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  const tasks: ExtractedTask[] = JSON.parse('[' + rawText)

  if (tasks.length === 0) {
    return { tasks: [], message: 'No actionable tasks found in the provided text.' }
  }
  return { tasks }
}

app.get('/api/items', (_, res) => {
  const items = db.prepare('SELECT * FROM items ORDER BY position ASC, id ASC').all() as ItemRow[]
  const history = db.prepare('SELECT * FROM item_history ORDER BY changed_at DESC').all() as HistoryRow[]

  const historyByItem = new Map<number, HistoryRow[]>()
  for (const entry of history) {
    if (!historyByItem.has(entry.item_id)) historyByItem.set(entry.item_id, [])
    historyByItem.get(entry.item_id)!.push(entry)
  }

  const result = items.map(item => ({
    ...item,
    history: historyByItem.get(item.id) || [],
  }))

  res.json(result)
})

app.post('/api/items', (req, res) => {
  const {
    title,
    description = null,
    status = 'not_started',
    priority = 'medium',
    color = null,
    assignee = null,
    due_date = null,
  } = req.body
  const result = db.prepare(
    `INSERT INTO items (title, description, status, priority, color, assignee, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(title, description, status, priority, color, assignee, due_date)
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid) as ItemRow | undefined
  res.json({ ...item, history: [] })
})

app.post('/api/items/bulk', (req, res) => {
  const { tasks } = req.body

  if (!Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: 'tasks must be a non-empty array' })
    return
  }

  const insert = db.prepare(
    `INSERT INTO items (title, description, status, priority, color, assignee, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const selectOne = db.prepare('SELECT * FROM items WHERE id = ?')

  const insertMany = db.transaction((rows: typeof tasks) => {
    return rows.map((task) => {
      const {
        title,
        description = null,
        status = 'not_started',
        priority = 'medium',
        color = null,
        assignee = null,
        due_date = null,
      } = task
      const result = insert.run(title, description, status, priority, color, assignee, due_date)
      return { ...(selectOne.get(result.lastInsertRowid) as ItemRow), history: [] }
    })
  })

  const items = insertMany(tasks)
  res.json({ items })
})

app.patch('/api/items/:id', (req, res) => {
  const allowedFields = ['title', 'description', 'status', 'priority', 'color', 'assignee', 'due_date', 'position']
  const updates: string[] = []
  const values: unknown[] = []

  // Fetch current item for history comparison
  const oldItem = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined
  if (!oldItem) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(req.body[field])
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' })
    return
  }

  // Add last_modified update
  updates.push(`last_modified = datetime('now')`)

  values.push(req.params.id)
  db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  // Log history entries for changed fields
  const insertHistory = db.prepare(
    `INSERT INTO item_history (item_id, description) VALUES (?, ?)`
  )
  for (const field of allowedFields) {
    if (req.body[field] !== undefined && req.body[field] !== oldItem[field]) {
      let desc: string
      if (field === 'title' || field === 'description') {
        desc = `${field} changed`
      } else if (oldItem[field] === null) {
        desc = `${field} set to '${req.body[field]}'`
      } else if (req.body[field] === null) {
        desc = `${field} cleared`
      } else {
        desc = `${field} changed from '${oldItem[field]}' to '${req.body[field]}'`
      }
      insertHistory.run(req.params.id, desc)
    }
  }

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined
  const history = db.prepare('SELECT * FROM item_history WHERE item_id = ? ORDER BY changed_at DESC').all(req.params.id)
  res.json({ ...item, history })
})

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/chat', async (req, res) => {
  try {
    const { message, items } = req.body

    if (!message || !items) {
      res.status(400).json({ error: 'Message and items are required' })
      return
    }

    console.log('Received board state:', {
      itemCount: items.length,
      items: items.map((item: ItemRow) => ({ id: item.id, title: item.title, status: item.status }))
    })

    // Format board state for context
    const boardContext = items.map((item: ItemRow) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee,
      due_date: item.due_date,
    }))

    const systemPrompt = `You are Flow, a task management assistant built into the Flow board. You have access to the user's current tasks and board state.

Current board state:
${JSON.stringify(boardContext, null, 2)}

Personality — read this carefully:
- Talk like a sharp, calm colleague — not a customer service bot
- Use contractions naturally: "I've", "you've", "it's", "that's", "won't", "doesn't"
- Empathise when the board looks heavy: "That's a lot on your plate." / "Looks like a busy week."
- After completing an action, say "Done ✓" or name what changed — never "I have completed the requested action"
- Use "I noticed that..." or "Worth flagging —" to surface insights, not "As your AI assistant, I would like to point out..."
- End with "Want me to...?" when a natural next step exists — don't just describe options, offer them
- Occasional emoji is fine when it fits (✓ 📌 ⚠️) — but never force it
- No filler openers: never start with "Certainly!", "Of course!", "Sure!", "Great question!", "Absolutely!", "I'd be happy to"
- Don't narrate your own process: skip "I will now...", "I am going to...", "Let me..."
- Keep it short — 1-3 sentences for simple questions, a tight bullet list for summaries`

    const tools = [
      {
        name: 'create_item',
        description: 'Create a new task on the board',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'The task title' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'], description: 'Task status' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Task priority' },
            description: { type: 'string', description: 'Optional task description' },
            due_date: { type: 'string', description: 'Optional due date (YYYY-MM-DD format)' },
            assignee: { type: 'string', description: 'Optional assignee name' },
            color: { type: 'string', description: 'Optional color tag' },
          },
          required: ['title', 'status'],
        },
      },
      {
        name: 'update_item',
        description: 'Update an existing task',
        input_schema: {
          type: 'object' as const,
          properties: {
            id: { type: 'number', description: 'The task ID to update' },
            title: { type: 'string', description: 'New title' },
            description: { type: 'string', description: 'New description' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'], description: 'New status' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'New priority' },
            due_date: { type: 'string', description: 'New due date (YYYY-MM-DD format)' },
            assignee: { type: 'string', description: 'New assignee' },
            color: { type: 'string', description: 'New color' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_item',
        description: 'Delete a task from the board',
        input_schema: {
          type: 'object' as const,
          properties: {
            id: { type: 'number', description: 'The task ID to delete' },
          },
          required: ['id'],
        },
      },
      {
        name: 'move_item',
        description: 'Move a task to a different status column',
        input_schema: {
          type: 'object' as const,
          properties: {
            id: { type: 'number', description: 'The task ID to move' },
            new_status: { type: 'string', enum: ['not_started', 'in_progress', 'done', 'stuck'], description: 'The new status' },
          },
          required: ['id', 'new_status'],
        },
      },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      system: systemPrompt,
      tools,
    })

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults = []
      const actions: string[] = []
      const errors: string[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log('Tool called:', block.name, 'with input:', block.input)

          let result
          try {
            switch (block.name) {
              case 'create_item': {
                const { title, status = 'not_started', priority = 'medium', description = null, due_date = null, assignee = null, color = null } = block.input as {
                  title: string
                  status?: string
                  priority?: string
                  description?: string | null
                  due_date?: string | null
                  assignee?: string | null
                  color?: string | null
                }
                const insertResult = db.prepare(
                  `INSERT INTO items (title, description, status, priority, color, assignee, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).run(title, description, status, priority, color, assignee, due_date)
                const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(insertResult.lastInsertRowid) as ItemRow
                result = { success: true, item: newItem }
                actions.push(`Created task: ${title}`)
                break
              }

              case 'update_item': {
                const { id, ...updates } = block.input as { id: number; [key: string]: unknown }
                const allowedFields = ['title', 'description', 'status', 'priority', 'color', 'assignee', 'due_date']
                const updatePairs: string[] = []
                const values: unknown[] = []

                for (const field of allowedFields) {
                  if (updates[field] !== undefined) {
                    updatePairs.push(`${field} = ?`)
                    values.push(updates[field])
                  }
                }

                if (updatePairs.length > 0) {
                  updatePairs.push(`last_modified = datetime('now')`)
                  values.push(id)
                  db.prepare(`UPDATE items SET ${updatePairs.join(', ')} WHERE id = ?`).run(...values)
                  const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined
                  if (updatedItem) {
                    result = { success: true, item: updatedItem }
                    const updatedFields = Object.keys(updates).filter(k => allowedFields.includes(k)).join(', ')
                    actions.push(`Updated task: ${updatedItem.title} (${updatedFields})`)
                  } else {
                    result = { success: false, error: 'Task not found after update' }
                    errors.push(`Could not update task #${id} - task not found`)
                  }
                } else {
                  result = { success: false, error: 'No fields to update' }
                  errors.push(`Could not update task #${id} - no fields provided`)
                }
                break
              }

              case 'delete_item': {
                const { id } = block.input as { id: number }
                const itemToDelete = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined
                if (itemToDelete) {
                  db.prepare('DELETE FROM items WHERE id = ?').run(id)
                  result = { success: true, deleted_item: { id: itemToDelete.id, title: itemToDelete.title } }
                  actions.push(`Deleted task: ${itemToDelete.title}`)
                } else {
                  result = { success: false, error: `Task with id ${id} not found` }
                  errors.push(`Could not delete task #${id} - task not found`)
                }
                break
              }

              case 'move_item': {
                const { id, new_status } = block.input as { id: number; new_status: string }
                const itemExists = db.prepare('SELECT id FROM items WHERE id = ?').get(id)
                if (itemExists) {
                  db.prepare(`UPDATE items SET status = ?, last_modified = datetime('now') WHERE id = ?`).run(new_status, id)
                  const movedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow
                  result = { success: true, item: movedItem }
                  const statusLabels: Record<string, string> = {
                    not_started: 'Not Started',
                    in_progress: 'In Progress',
                    done: 'Done',
                    stuck: 'Stuck'
                  }
                  actions.push(`Moved task "${movedItem.title}" to ${statusLabels[new_status] || new_status}`)
                } else {
                  result = { success: false, error: `Task with id ${id} not found` }
                  errors.push(`Could not move task #${id} - task not found`)
                }
                break
              }

              default:
                result = { success: false, error: 'Unknown tool' }
            }
          } catch (error) {
            console.error('Tool execution error:', error)
            result = { success: false, error: String(error) }
            errors.push(`Error executing ${block.name}: ${String(error)}`)
          }

          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        }
      }

      // Continue conversation with tool results
      const followUpResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: message,
          },
          {
            role: 'assistant',
            content: response.content,
          },
          {
            role: 'user',
            content: toolResults,
          },
        ],
        system: systemPrompt,
        tools,
      })

      const aiMessage = followUpResponse.content.find(block => block.type === 'text')
      res.json({
        response: aiMessage?.type === 'text' ? aiMessage.text : 'Action completed.',
        actions,
        errors
      })
    } else {
      const aiMessage = response.content[0].type === 'text' ? response.content[0].text : ''
      res.json({ response: aiMessage })
    }
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to get AI response' })
  }
})

app.post('/api/insights', async (req, res) => {
  try {
    const { items } = req.body

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Items array is required' })
      return
    }

    console.log('Analyzing board state:', {
      itemCount: items.length,
      items: items.map((item: ItemRow) => ({ id: item.id, title: item.title, status: item.status }))
    })

    const insights: Insight[] = []

    // Detect stale tasks (in_progress for 7+ days)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const staleTasks = items.filter((item: ItemRow) => {
      if (item.status !== 'in_progress') return false
      const lastModified = new Date(item.last_modified)
      return lastModified < sevenDaysAgo
    })

    if (staleTasks.length > 0) {
      let severity: 'low' | 'medium' | 'high'
      if (staleTasks.length >= 5) {
        severity = 'high'
      } else if (staleTasks.length >= 3) {
        severity = 'medium'
      } else {
        severity = 'low'
      }

      insights.push({
        type: 'stale',
        severity,
        title: `${staleTasks.length} stale task${staleTasks.length > 1 ? 's' : ''} in progress`,
        description: `These tasks have been in progress for over 7 days without updates. Consider reviewing them to unblock progress.`,
        items: staleTasks.map((item: ItemRow) => item.id)
      })
    }

    // Detect bottleneck columns (5+ tasks, 3x more than other columns)
    const statusCounts = new Map<string, ItemRow[]>()
    for (const item of items) {
      const status = (item as ItemRow).status
      if (!statusCounts.has(status)) statusCounts.set(status, [])
      statusCounts.get(status)!.push(item as ItemRow)
    }

    for (const [status, statusItems] of statusCounts) {
      if (statusItems.length < 5) continue

      const otherCounts = [...statusCounts.entries()]
        .filter(([s]) => s !== status)
        .map(([, items]) => items.length)

      const maxOther = otherCounts.length > 0 ? Math.max(...otherCounts) : 0

      if (maxOther === 0 || statusItems.length >= maxOther * 3) {
        const statusLabels: Record<string, string> = {
          not_started: 'Not Started',
          in_progress: 'In Progress',
          done: 'Done',
          stuck: 'Stuck'
        }
        const label = statusLabels[status] || status

        insights.push({
          type: 'bottleneck',
          severity: statusItems.length >= 8 ? 'high' : 'medium',
          title: `"${label}" column is a bottleneck`,
          description: `${statusItems.length} tasks are piled up in "${label}" while other columns have significantly fewer. Consider redistributing work or addressing blockers.`,
          items: statusItems.map(item => item.id)
        })
      }
    }

    // Detect priority inflation (60%+ tasks are high/critical)
    if (items.length >= 2) {
      const highPriorityTasks = items.filter((item: ItemRow) =>
        item.priority === 'high' || item.priority === 'critical'
      )
      const ratio = highPriorityTasks.length / items.length
      if (ratio >= 0.6) {
        insights.push({
          type: 'priority_inflation',
          severity: 'medium',
          title: 'Too many high-priority tasks',
          description: 'When everything is urgent, nothing is. Consider re-evaluating priorities.',
          items: highPriorityTasks.map((item: ItemRow) => item.id),
        })
      }
    }

    // Detect deadline clusters (3+ tasks due within a 2-day window)
    const datedTasks = items
      .filter((item: ItemRow) => item.due_date && item.status !== 'done')
      .map((item: ItemRow) => ({ id: item.id, date: new Date(item.due_date + 'T00:00:00') }))
      .sort((a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime())

    const clustered = new Set<number>()
    for (let i = 0; i < datedTasks.length; i++) {
      if (clustered.has(datedTasks[i].id)) continue
      const cluster = [datedTasks[i]]
      for (let j = i + 1; j < datedTasks.length; j++) {
        const diffDays = (datedTasks[j].date.getTime() - datedTasks[i].date.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays <= 2) {
          cluster.push(datedTasks[j])
        } else {
          break
        }
      }
      if (cluster.length >= 3) {
        const ids = cluster.map(t => t.id)
        ids.forEach(id => clustered.add(id))
        const startDate = cluster[0].date
        const endDate = cluster[cluster.length - 1].date
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dateRange = startDate.getTime() === endDate.getTime()
          ? fmt(startDate)
          : `${fmt(startDate)}-${fmt(endDate)}`

        insights.push({
          type: 'deadline_cluster',
          severity: cluster.length >= 5 ? 'high' : 'medium',
          title: `Multiple tasks due ${dateRange}`,
          description: `You have ${cluster.length} tasks due in a 2-day window — consider spreading them out.`,
          items: ids,
        })
      }
    }

    // Detect duplicates using AI semantic analysis
    if (items.length >= 2) {
      const taskList = items.map((item: ItemRow) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      }))

      const dupeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze these tasks and identify groups of duplicates — tasks that are essentially the same thing worded differently. Only flag true duplicates, not merely related tasks.

Tasks:
${JSON.stringify(taskList, null, 2)}

Respond with ONLY valid JSON in this exact format, no other text:
{"groups": [[1, 2], [3, 5]]}

Each group is an array of task IDs that are duplicates of each other. If there are no duplicates, respond with:
{"groups": []}`,
          },
          {
            role: 'assistant',
            content: '{',
          },
        ],
      })

      try {
        const rawText = dupeResponse.content[0].type === 'text' ? dupeResponse.content[0].text : ''
        const text = '{' + rawText
        const parsed = JSON.parse(text) as { groups: number[][] }

        if (parsed.groups && parsed.groups.length > 0) {
          const groupCount = parsed.groups.length
          let severity: 'low' | 'medium' | 'high'
          if (groupCount >= 4) {
            severity = 'high'
          } else if (groupCount >= 2) {
            severity = 'medium'
          } else {
            severity = 'low'
          }

          for (const group of parsed.groups) {
            const groupTitles = group
              .map(id => items.find((item: ItemRow) => item.id === id))
              .filter(Boolean)
              .map((item: ItemRow) => `"${item.title}"`)
              .join(', ')

            insights.push({
              type: 'duplicate',
              severity,
              title: `Possible duplicate tasks`,
              description: `These tasks appear to be duplicates: ${groupTitles}. Consider merging or removing redundant tasks.`,
              items: group,
            })
          }
        }
      } catch {
        console.error('Failed to parse duplicate detection response')
      }
    }

    res.json({ insights })
  } catch (error) {
    console.error('Insights error:', error)
    res.status(500).json({ error: 'Failed to analyze board state' })
  }
})

app.post('/api/recommend-next', async (req, res) => {
  try {
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required' })
      return
    }

    const actionableTasks = items
      .filter((item: ItemRow) => item.status !== 'done')
      .map((item: ItemRow) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        due_date: item.due_date,
      }))

    if (actionableTasks.length === 0) {
      res.status(400).json({ error: 'No actionable tasks found' })
      return
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Given these tasks, which single task should the user work on next? Consider due dates, priorities, dependencies mentioned in descriptions, and current status. Return just the task ID and a 1-sentence explanation why.

Tasks:
${JSON.stringify(actionableTasks, null, 2)}

Respond with ONLY valid JSON in this exact format, no other text:
{"itemId": 3, "reason": "This task is due soonest and is marked critical priority."}`,
        },
        {
          role: 'assistant',
          content: '{',
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse('{' + rawText) as { itemId: number; reason: string }

    res.json({ recommendedItemId: parsed.itemId, reason: parsed.reason })
  } catch (error) {
    console.error('Recommend-next error:', error)
    res.status(500).json({ error: 'Failed to generate recommendation' })
  }
})

// ─── Narrative data endpoint ──────────────────────────────────────────────────

type NarrativePeriod = 'last_week' | 'last_30_days' | 'this_month' | 'previous_7_days'

// SQLite datetime modifiers for each period (end is optional; absent means 'now')
const PERIOD_OFFSETS: Record<NarrativePeriod, { start: string; end?: string }> = {
  last_week:       { start: '-7 days' },
  last_30_days:    { start: '-30 days' },
  this_month:      { start: 'start of month' },
  previous_7_days: { start: '-14 days', end: '-7 days' },
}

const PERIOD_LABELS: Record<NarrativePeriod, string> = {
  last_week:       'past week',
  last_30_days:    'past 30 days',
  this_month:      'current month',
  previous_7_days: 'week before last',
}

interface HistoryWithTitle {
  item_id: number
  title: string
  changed_at: string
  description: string
}

interface CreatedItem {
  id: number
  title: string
  status: string
  priority: string
  assignee: string | null
  created_at: string
}

app.post('/api/narrative', async (req, res) => {
  const { period } = req.body as { period?: string }

  if (!period || !(period in PERIOD_OFFSETS)) {
    res.status(400).json({ error: `Invalid period. Supported values: ${Object.keys(PERIOD_OFFSETS).join(', ')}` })
    return
  }

  const { start, end } = PERIOD_OFFSETS[period as NarrativePeriod]
  const periodStart = (db.prepare(`SELECT datetime('now', ?) AS t`).get(start) as { t: string }).t
  const periodEnd   = end
    ? (db.prepare(`SELECT datetime('now', ?) AS t`).get(end) as { t: string }).t
    : (db.prepare(`SELECT datetime('now') AS t`).get() as { t: string }).t

  // Optional upper-bound clause — only applied for periods with an explicit end (e.g. previous_7_days)
  const endClause = end ? 'AND created_at < ?' : ''
  const histEndClause = end ? 'AND h.changed_at < ?' : ''
  const createdParams = end ? [periodStart, periodEnd] : [periodStart]
  const histParams    = end ? [periodStart, periodEnd] : [periodStart]

  // Tasks created in the period
  const tasksCreated = db.prepare(`
    SELECT id, title, status, priority, assignee, created_at
    FROM items
    WHERE created_at >= ? ${endClause}
    ORDER BY created_at ASC
  `).all(...createdParams) as CreatedItem[]

  // All history entries in the period with item titles
  const allHistory = db.prepare(`
    SELECT h.item_id, i.title, h.changed_at, h.description
    FROM item_history h
    JOIN items i ON i.id = h.item_id
    WHERE h.changed_at >= ? ${histEndClause}
    ORDER BY h.changed_at ASC
  `).all(...histParams) as HistoryWithTitle[]

  // Partition history by category
  const statusChanges   = allHistory.filter(h => h.description.startsWith('status '))
  const priorityChanges = allHistory.filter(h => h.description.startsWith('priority '))
  const tasksCompleted  = statusChanges.filter(h => h.description.includes("to 'done'"))
  const tasksStuck      = statusChanges.filter(h => h.description.includes("to 'stuck'"))
  const tasksUnblocked  = statusChanges.filter(h => h.description.startsWith("status changed from 'stuck'"))

  const data = {
    period,
    period_start: periodStart,
    period_end:   periodEnd,
    summary: {
      tasks_created:    tasksCreated.length,
      tasks_completed:  tasksCompleted.length,
      tasks_stuck:      tasksStuck.length,
      tasks_unblocked:  tasksUnblocked.length,
      status_changes:   statusChanges.length,
      priority_changes: priorityChanges.length,
    },
    tasks_created:    tasksCreated,
    tasks_completed:  tasksCompleted,
    tasks_stuck:      tasksStuck,
    tasks_unblocked:  tasksUnblocked,
    status_changes:   statusChanges,
    priority_changes: priorityChanges,
  }

  // Run narrative and momentum score calls in parallel
  const periodLabel = PERIOD_LABELS[period as NarrativePeriod]
  const dataJson = JSON.stringify(data, null, 2)

  type Momentum = { score: number; reasoning: string; sentiment: 'healthy' | 'at_risk' | 'critical' }

  const [narrative, momentum] = await Promise.all([
    // Plain-English narrative
    anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Given this task activity data from the ${periodLabel}, write a 2-3 sentence plain-English summary of what happened. Focus on: what got done, what's moving forward, what got stuck, and overall momentum. Write it like you're giving a friendly standup update, not a data report. Be specific with numbers but conversational in tone. Reply with only the narrative text — no headings, no bullet points, no preamble.\n\nActivity data:\n${dataJson}`,
      }],
    }).then(r => r.content[0].type === 'text' ? r.content[0].text.trim() : '').catch((err) => {
      console.error('Narrative AI error:', err)
      return ''
    }),

    // Momentum score
    anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Analyze this task activity and rate the project momentum from 0-100. Consider: completion rate, whether tasks are getting stuck or unstuck, priority changes (upward escalation = bad sign, downward after completion = good), how long tasks stay in each status, and overall forward movement. Return a JSON object with {score: number, reasoning: string, sentiment: 'healthy' | 'at_risk' | 'critical'}. Use sentiment 'healthy' for score >= 70, 'at_risk' for 40-69, 'critical' for below 40.\n\nActivity data:\n${dataJson}`,
        },
        {
          role: 'assistant',
          content: '{',
        },
      ],
    }).then((r): Momentum => {
      const raw = r.content[0].type === 'text' ? r.content[0].text : ''
      return JSON.parse('{' + raw) as Momentum
    }).catch((err) => {
      console.error('Momentum AI error:', err)
      return null
    }),
  ])

  res.json({ ...data, narrative, momentum })
})

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

app.post('/api/check-deadline-risks', (_req, res) => {
  const now = new Date()
  const todayStr = toDateStr(now)
  const in24hStr = toDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  const in48hStr = toDateStr(new Date(now.getTime() + 48 * 60 * 60 * 1000))

  const items = db.prepare(`
    SELECT id, title, status, due_date FROM items
    WHERE due_date IS NOT NULL AND status != 'done'
  `).all() as Array<{ id: number; title: string; status: string; due_date: string }>

  type RiskLevel = 'high' | 'medium'
  const atRisk: Array<{ item_id: number; title: string; due_date: string; status: string; risk_level: RiskLevel }> = []

  for (const item of items) {
    const due = item.due_date
    if (item.status === 'not_started' && due <= in24hStr) {
      atRisk.push({ item_id: item.id, title: item.title, due_date: due, status: item.status, risk_level: 'high' })
    } else if (item.status === 'stuck' && due <= in48hStr) {
      atRisk.push({ item_id: item.id, title: item.title, due_date: due, status: item.status, risk_level: 'high' })
    } else if (item.status === 'in_progress' && due === todayStr) {
      atRisk.push({ item_id: item.id, title: item.title, due_date: due, status: item.status, risk_level: 'medium' })
    }
  }

  res.json({ at_risk: atRisk })
})

const VALID_ACTION_TYPES = new Set(['reschedule', 'deprioritize', 'split'])

app.post('/api/deadline-actions', (req, res) => {
  const { item_id, action_type, original_due_date, new_due_date } = req.body

  if (!action_type || !VALID_ACTION_TYPES.has(action_type)) {
    res.status(400).json({ error: 'action_type must be one of: reschedule, deprioritize, split' })
    return
  }

  let days_extended: number | null = null
  if (action_type === 'reschedule' && original_due_date && new_due_date) {
    const orig = new Date(original_due_date + 'T00:00:00')
    const newD = new Date(new_due_date + 'T00:00:00')
    days_extended = Math.round((newD.getTime() - orig.getTime()) / 86400000)
  }

  db.prepare(
    `INSERT INTO deadline_actions (item_id, action_type, original_due_date, new_due_date, days_extended)
     VALUES (?, ?, ?, ?, ?)`
  ).run(item_id ?? null, action_type, original_due_date ?? null, new_due_date ?? null, days_extended)

  res.json({ ok: true })
})

app.post('/api/suggest-reschedule', async (req, res) => {
  const { itemId } = req.body
  if (!itemId) {
    res.status(400).json({ error: 'itemId is required' })
    return
  }

  type RescheduleItem = { id: number; title: string; priority: string; status: string; due_date: string | null }
  const item = db.prepare(
    'SELECT id, title, priority, status, due_date FROM items WHERE id = ?'
  ).get(itemId) as RescheduleItem | undefined

  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  const today    = toDateStr(new Date())
  const in14Days = toDateStr(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))

  const upcoming = db.prepare(`
    SELECT title, due_date, priority FROM items
    WHERE due_date IS NOT NULL AND due_date >= ? AND due_date <= ?
      AND id != ? AND status != 'done'
    ORDER BY due_date ASC LIMIT 10
  `).all(today, in14Days, itemId) as Array<{ title: string; due_date: string; priority: string }>

  const recentDone = db.prepare(`
    SELECT title, created_at, last_modified FROM items
    WHERE status = 'done' ORDER BY last_modified DESC LIMIT 5
  `).all() as Array<{ title: string; created_at: string; last_modified: string }>

  const upcomingText = upcoming.length > 0
    ? upcoming.map(t => `  - "${t.title}" (${t.priority}) due ${t.due_date}`).join('\n')
    : '  - No other upcoming deadlines'

  const historyText = recentDone.length > 0
    ? recentDone.map(t => {
        const days = Math.max(1, Math.round(
          (new Date(t.last_modified).getTime() - new Date(t.created_at).getTime()) / 86400000
        ))
        return `  - "${t.title}" completed in ${days} day${days === 1 ? '' : 's'}`
      }).join('\n')
    : '  - No completion history'

  const prompt = `You are helping a user reschedule a task. Suggest exactly 2-3 realistic new due dates.

Today: ${today}

Task to reschedule:
  - Title: "${item.title}"
  - Priority: ${item.priority}
  - Current due date: ${item.due_date ?? 'none'}
  - Status: ${item.status}

Other tasks due in the next 14 days (workload):
${upcomingText}

Recent task completion times (effort estimates):
${historyText}

Rules:
- Earliest suggestion must be at least tomorrow (not today)
- Spread suggestions (e.g. 3, 5, and 7 days out)
- Avoid dates already crowded with other deadlines when possible
- Higher priority → suggest earlier
- Use completion history to estimate effort
- Label format: "DayName (N days out)" e.g. "Friday (3 days out)" or "Next Monday (6 days out)"

Return ONLY a JSON array of 2-3 objects, nothing else:
[{"date":"YYYY-MM-DD","label":"DayName (N days out)"},...]`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [
        { role: 'user',      content: prompt },
        { role: 'assistant', content: '[' },
      ],
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const aiSuggestions = JSON.parse('[' + raw) as Array<{ date: string; label: string }>

    // Check for a user reschedule pattern (most common extension used at least twice)
    type PatternRow = { days_extended: number; count: number }
    const pattern = db.prepare(`
      SELECT days_extended, COUNT(*) AS count
      FROM deadline_actions
      WHERE action_type = 'reschedule' AND days_extended > 0
      GROUP BY days_extended
      ORDER BY count DESC, days_extended ASC
      LIMIT 1
    `).get() as PatternRow | undefined

    let suggestions: Array<{ date: string; label: string; isPattern?: boolean }> = aiSuggestions
    let patternResult: { days: number; count: number } | null = null

    if (pattern && pattern.count >= 2) {
      const patternDate = toDateStr(new Date(Date.now() + pattern.days_extended * 24 * 60 * 60 * 1000))
      const dayName = new Date(patternDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
      const patternSuggestion = {
        date: patternDate,
        label: `${dayName} (your usual ${pattern.days_extended}-day extension)`,
        isPattern: true as const,
      }
      patternResult = { days: pattern.days_extended, count: pattern.count }
      const seen = new Set([patternDate])
      suggestions = [patternSuggestion, ...aiSuggestions.filter(s => !seen.has(s.date))]
    }

    res.json({ suggestions, pattern: patternResult })
  } catch (err) {
    console.error('Reschedule suggestion error:', err)
    res.status(500).json({ error: 'Failed to generate suggestions' })
  }
})

app.post('/api/suggest-split', async (req, res) => {
  const { itemId } = req.body
  if (!itemId) {
    res.status(400).json({ error: 'itemId is required' })
    return
  }

  type SplitItem = { id: number; title: string; description: string | null }
  const item = db.prepare(
    'SELECT id, title, description FROM items WHERE id = ?'
  ).get(itemId) as SplitItem | undefined

  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  const prompt = `This task is overdue and needs to be split into smaller, manageable subtasks. Suggest 2-4 concrete subtasks with clear deliverables.

Task title: "${item.title}"
Task description: ${item.description ? `"${item.description}"` : 'None'}

Return as JSON array with {title, description, estimated_priority} where estimated_priority is one of: low, medium, high, critical. Return ONLY the JSON array, nothing else.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      messages: [
        { role: 'user',      content: prompt },
        { role: 'assistant', content: '[' },
      ],
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const suggestions = JSON.parse('[' + raw) as Array<{ title: string; description: string; estimated_priority: string }>
    res.json({ suggestions })
  } catch (err) {
    console.error('Split suggestion error:', err)
    res.status(500).json({ error: 'Failed to generate subtask suggestions' })
  }
})

app.post('/api/extract-tasks', async (req, res) => {
  try {
    const { text } = req.body

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'text is required' })
      return
    }

    if (text.trim().length < 10) {
      res.status(400).json({ error: 'Text is too short to extract tasks from. Please provide more context.' })
      return
    }

    try {
      const result = await extractTasksFromText(text)
      res.json(result)
    } catch {
      res.status(500).json({ error: 'Could not parse the extracted tasks. Please try again.' })
    }
  } catch (error) {
    console.error('Extract-tasks error:', error)
    res.status(500).json({ error: 'Failed to extract tasks' })
  }
})

app.post('/api/extract-from-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' })
      return
    }

    const ext = '.' + req.file.originalname.split('.').pop()?.toLowerCase()
    let text = ''

    if (ext === '.txt') {
      text = req.file.buffer.toString('utf-8')
    } else if (ext === '.pdf') {
      const parser = new PDFParse({ data: req.file.buffer })
      const parsed = await parser.getText()
      text = parsed.text
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer })
      text = result.value
    }

    text = text.trim()

    if (text.length < 10) {
      res.status(400).json({ error: 'The file appears to be empty or contains too little text.' })
      return
    }

    try {
      const result = await extractTasksFromText(text)
      res.json(result)
    } catch {
      res.status(500).json({ error: 'Could not parse the extracted tasks. Please try again.' })
    }
  } catch (error) {
    console.error('Extract-from-file error:', error)
    res.status(500).json({ error: 'Failed to process file.' })
  }
})

// Multer error handler (file too large, wrong type)
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' })
    return
  }
  if (err?.message?.startsWith('Unsupported file type')) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
})

export { app }

const PORT = 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}
