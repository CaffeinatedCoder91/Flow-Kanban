// api/extract-from-file.ts
// POST /api/extract-from-file — upload .txt/.pdf/.docx, extract text, then extract tasks.
//
// Vercel note: body parsing must be disabled for multipart uploads.
// The multer middleware is applied manually inside the handler.

import multer from 'multer'
import { extractTasksFromText } from './extract-tasks'
import { withCors, getUserId, unauthorized, badRequest, serverError, type Req, type Res } from './_utils'
import { checkRateLimit } from '../lib/rateLimit'

// Disable Vercel's automatic body parsing for this route
export const config = { api: { bodyParser: false } }

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
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

// Run multer as a Promise
function runMulter(req: Req, res: Res): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single('file')(req as never, res as never, (err: unknown) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function extractText(file: Express.Multer.File): Promise<string> {
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase()

  if (ext === '.txt') {
    return file.buffer.toString('utf-8')
  }

  if (ext === '.pdf') {
    // pdf-parse uses CJS default export; cast to bypass ESM type mismatch
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

export default withCors(async (req: Req, res: Res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = await getUserId(req)
  if (!userId) return unauthorized(res)
  if (!await checkRateLimit(res, userId)) return

  try {
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

    const text = await extractText(file)

    if (!text || text.trim().length < 10) {
      return badRequest(res, 'Could not extract enough text from the file')
    }

    const tasks = await extractTasksFromText(text)

    if (tasks.length === 0) {
      return res.status(200).json({
        tasks: [],
        message: 'No actionable tasks found in the uploaded file.',
      })
    }

    res.status(200).json({ tasks })
  } catch (err) {
    serverError(res, err)
  }
})
