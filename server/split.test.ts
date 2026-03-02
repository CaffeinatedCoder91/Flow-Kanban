// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// ─── Mock Anthropic ───────────────────────────────────────────────────────────
// Returns the JSON array tail (prefill is '[', so we return the rest of a valid array)

const mockCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    content: [{
      type: 'text',
      text: '{"title":"Write failing unit tests","description":"Write tests first to define expected behavior","estimated_priority":"high"},{"title":"Implement the login handler","description":"Code the authentication logic","estimated_priority":"high"}]',
    }],
  })
)

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock('./db', async () => {
  const BetterSqlite3 = (await import('better-sqlite3')).default
  const db = new BetterSqlite3(':memory:')

  db.exec(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      priority TEXT NOT NULL DEFAULT 'medium',
      color TEXT,
      assignee TEXT,
      due_date TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_modified TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE item_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      description TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );
    CREATE TABLE deadline_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      action_type TEXT NOT NULL,
      original_due_date TEXT,
      new_due_date TEXT,
      days_extended INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Item to split (id will be 1 — first insert)
  db.prepare(
    `INSERT INTO items (title, description, status, priority, due_date)
     VALUES ('Fix the login bug', 'Users cannot log in with Google OAuth', 'not_started', 'high', date('now', '-1 day'))`
  ).run()

  return { default: db }
})

// ─── Import app after mocks ───────────────────────────────────────────────────

let app: Awaited<typeof import('./index')>['app']

beforeAll(async () => {
  const mod = await import('./index')
  app = mod.app
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/suggest-split', () => {

  it('returns 200 with a suggestions array', async () => {
    const res = await request(app).post('/api/suggest-split').send({ itemId: 1 })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.suggestions)).toBe(true)
  })

  it('each suggestion has title, description, and estimated_priority fields', async () => {
    const res = await request(app).post('/api/suggest-split').send({ itemId: 1 })
    expect(res.body.suggestions.length).toBeGreaterThan(0)
    for (const s of res.body.suggestions) {
      expect(s).toHaveProperty('title')
      expect(s).toHaveProperty('description')
      expect(s).toHaveProperty('estimated_priority')
      expect(typeof s.title).toBe('string')
      expect(typeof s.description).toBe('string')
      expect(typeof s.estimated_priority).toBe('string')
    }
  })

  it('returns 400 when itemId is missing', async () => {
    const res = await request(app).post('/api/suggest-split').send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when the item does not exist', async () => {
    const res = await request(app).post('/api/suggest-split').send({ itemId: 9999 })
    expect(res.status).toBe(404)
  })

  it('calls the Anthropic API with the item title and description in the prompt', async () => {
    mockCreate.mockClear()
    await request(app).post('/api/suggest-split').send({ itemId: 1 })
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const [callArg] = mockCreate.mock.calls[0]
    const userMsg = callArg.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMsg.content).toContain('Fix the login bug')
    expect(userMsg.content).toContain('Users cannot log in with Google OAuth')
  })

  it('uses assistant prefill [ to enforce JSON array output', async () => {
    mockCreate.mockClear()
    await request(app).post('/api/suggest-split').send({ itemId: 1 })
    const [callArg] = mockCreate.mock.calls[0]
    const assistantMsg = callArg.messages.find((m: { role: string }) => m.role === 'assistant')
    expect(assistantMsg?.content).toBe('[')
  })

  it('returns 500 when the Anthropic API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'))
    const res = await request(app).post('/api/suggest-split').send({ itemId: 1 })
    expect(res.status).toBe(500)
  })
})
