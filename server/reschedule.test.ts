// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// ─── Mock Anthropic ───────────────────────────────────────────────────────────
// Returns a JSON array tail (prefill is '[', so we return the rest of a valid array)

const mockCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    content: [{
      type: 'text',
      text: '{"date":"2026-03-02","label":"Monday (5 days out)"},{"date":"2026-03-05","label":"Thursday (8 days out)"}]',
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

  // Item to reschedule (id will be 1 — first insert)
  db.prepare(
    `INSERT INTO items (title, status, priority, due_date) VALUES ('Fix login bug', 'not_started', 'high', date('now', '+1 day'))`
  ).run()

  // A competing deadline in the next 14 days
  db.prepare(
    `INSERT INTO items (title, status, priority, due_date) VALUES ('Deploy v2', 'in_progress', 'high', date('now', '+3 days'))`
  ).run()

  // A recently completed task (for history)
  db.prepare(
    `INSERT INTO items (title, status, priority, created_at, last_modified)
     VALUES ('Auth fix', 'done', 'medium', datetime('now', '-5 days'), datetime('now'))`
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

describe('POST /api/suggest-reschedule', () => {

  it('returns 200 with a suggestions array', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.suggestions)).toBe(true)
  })

  it('each suggestion has date and label fields', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.body.suggestions.length).toBeGreaterThan(0)
    for (const s of res.body.suggestions) {
      expect(s).toHaveProperty('date')
      expect(s).toHaveProperty('label')
      expect(typeof s.date).toBe('string')
      expect(typeof s.label).toBe('string')
    }
  })

  it('returns 400 when itemId is missing', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when the item does not exist', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 9999 })
    expect(res.status).toBe(404)
  })

  it('calls the Anthropic API with item title and workload context in the prompt', async () => {
    mockCreate.mockClear()
    await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const [callArg] = mockCreate.mock.calls[0]
    const userMsg = callArg.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMsg.content).toContain('Fix login bug')
    expect(userMsg.content).toContain('Deploy v2')       // workload item included
    expect(userMsg.content).toContain('Auth fix')         // history item included
  })

  it('uses assistant prefill [ to enforce JSON array output', async () => {
    mockCreate.mockClear()
    await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    const [callArg] = mockCreate.mock.calls[0]
    const assistantMsg = callArg.messages.find((m: { role: string }) => m.role === 'assistant')
    expect(assistantMsg?.content).toBe('[')
  })

  it('returns 500 when the Anthropic API throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API down'))
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.status).toBe(500)
  })
})
