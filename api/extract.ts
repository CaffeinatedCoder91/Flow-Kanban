// api/extract.ts
// POST /api/extract — extract actionable tasks from text or a file.
//
// Content-Type: application/json         → body { text: string }   (text extraction)
// Content-Type: multipart/form-data      → field "file" (.txt/.pdf/.docx)
//
// Vercel's body parser is disabled so both content types are handled manually.

import multer from 'multer'
import Anthropic from '@anthropic-ai/sdk'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import { ExtractTasksSchema, ExtractedTaskSchema } from '../lib/validation.js'
import { parseJsonFromText } from '../lib/ai.js'

// Must disable Vercel's body parser to support multipart uploads.
// JSON bodies are read from the raw stream below.
export const config = { api: { bodyParser: false } }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACT_SYSTEM_PROMPT = `You are a task extraction assistant. Extract all actionable tasks from the provided text.
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

async function extractTasksFromText(text: string) {
  const aiRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Extract tasks from the following text:\n\n${text}` },
    ],
  })

  const textBlocks = aiRes.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
  const raw = textBlocks.map(b => b.text).join('')
  const parsed = parseJsonFromText<unknown>(raw)
  if (!parsed) throw new Error('AI returned malformed JSON')
  return ExtractedTaskSchema.parse(parsed)
}

// ─── JSON body reader (body parser is disabled) ───────────────────────────────

const MAX_JSON_BYTES = 1_000_000

function readJsonBody(req: Req): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    let size = 0
    const stream = req as unknown as NodeJS.ReadableStream
    stream.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
      size += buf.length
      if (size > MAX_JSON_BYTES) {
        stream.removeAllListeners('data')
        stream.removeAllListeners('end')
        stream.removeAllListeners('error')
        if (typeof (stream as { destroy?: () => void }).destroy === 'function') {
          (stream as { destroy: () => void }).destroy()
        }
        reject(new Error('JSON body too large'))
        return
      }
      data += buf.toString()
    })
    stream.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { reject(new Error('Invalid JSON body')) }
    })
    stream.on('error', reject)
  })
}

// ─── File upload helpers ──────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.pdf', '.docx']
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`))
    }
  },
})

function runMulter(req: Req, res: Res): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('file')(req as never, res as never, (err: unknown) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase()

  if (ext === '.txt') return file.buffer.toString('utf-8')

  if (ext === '.pdf') {
    const mod = await import('pdf-parse') as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }
    const result = await mod.default(file.buffer)
    return result.text
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: file.buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  const contentType = (req.headers['content-type'] ?? '') as string

  try {
    if (contentType.includes('multipart/form-data')) {
      // ── File path ────────────────────────────────────────────────────────────
      try {
        await runMulter(req, res)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'File upload error'
        if (msg.startsWith('Unsupported file type') || msg.includes('LIMIT_FILE_SIZE')) {
          return badRequest(res, msg)
        }
        throw err
      }

      const file = (req as unknown as { file?: Express.Multer.File }).file
      if (!file) return badRequest(res, 'No file uploaded (field name must be "file")')

      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 10) {
        return badRequest(res, 'Could not extract enough text from the file')
      }

      const tasks = await extractTasksFromText(text)
      return res.status(200).json({
        tasks,
        ...(tasks.length === 0 && { message: 'No actionable tasks found in the uploaded file.' }),
      })
    } else {
      // ── Text path ─────────────────────────────────────────────────────────────
      let rawBody: unknown
      try {
        rawBody = await readJsonBody(req)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON body'
        if (msg === 'JSON body too large') {
          return res.status(413).json({ error: 'Payload too large' })
        }
        return badRequest(res, msg)
      }
      const parsed = ExtractTasksSchema.safeParse(rawBody)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const tasks = await extractTasksFromText(parsed.data.text)
      return res.status(200).json({
        tasks,
        ...(tasks.length === 0 && { message: 'No actionable tasks found in the provided text.' }),
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'AI returned malformed JSON') {
      return res.status(502).json({ error: msg })
    }
    serverError(res, err)
  }
})
