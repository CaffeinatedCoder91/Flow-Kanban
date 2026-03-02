// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// ─── Mock Anthropic ────────────────────────────────────────────────────────────
// suggest-reschedule uses assistant prefill '[', so the mock returns the tail.
// We use a far-future date so it never collides with pattern dates (days from now).

const mockCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    content: [{
      type: 'text',
      text: '{"date":"2099-12-28","label":"Sunday (way out)"},{"date":"2099-12-31","label":"Wednesday (further out)"}]',
    }],
  })
)

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Mock DB ───────────────────────────────────────────────────────────────────

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

  // Seed a test item (id = 1)
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

// ─── Tests: no action history yet ────────────────────────────────────────────

describe('POST /api/suggest-reschedule — no action history', () => {
  it('returns no pattern suggestion and pattern: null when no actions recorded', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.suggestions)).toBe(true)
    expect(res.body.pattern).toBeNull()
    const hasPattern = res.body.suggestions.some((s: { isPattern?: boolean }) => s.isPattern)
    expect(hasPattern).toBe(false)
  })
})

// ─── Tests: recording actions ─────────────────────────────────────────────────

describe('POST /api/deadline-actions', () => {
  it('returns 200 with ok: true for a reschedule action', async () => {
    const res = await request(app).post('/api/deadline-actions').send({
      item_id: 1,
      action_type: 'reschedule',
      original_due_date: '2026-02-24',
      new_due_date: '2026-02-26',
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns 200 with ok: true for a deprioritize action', async () => {
    const res = await request(app).post('/api/deadline-actions').send({
      item_id: 1,
      action_type: 'deprioritize',
      original_due_date: '2026-02-24',
      new_due_date: null,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns 200 with ok: true for a split action', async () => {
    const res = await request(app).post('/api/deadline-actions').send({
      item_id: 1,
      action_type: 'split',
      original_due_date: '2026-02-24',
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns 400 when action_type is missing', async () => {
    const res = await request(app).post('/api/deadline-actions').send({ item_id: 1 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when action_type is invalid', async () => {
    const res = await request(app).post('/api/deadline-actions').send({ item_id: 1, action_type: 'unknown' })
    expect(res.status).toBe(400)
  })

  it('works without item_id (e.g. for split where original is deleted)', async () => {
    const res = await request(app).post('/api/deadline-actions').send({
      action_type: 'split',
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

// ─── Tests: pattern suggestion after 2+ matching reschedules ─────────────────

describe('Pattern suggestion in POST /api/suggest-reschedule', () => {
  // Seed two more 7-day reschedule actions so the pattern threshold (count >= 2) is met.
  // (The 2-day reschedule from the previous describe has count=1 and won't win.)
  beforeAll(async () => {
    await request(app).post('/api/deadline-actions').send({
      item_id: 1,
      action_type: 'reschedule',
      original_due_date: '2026-02-10',
      new_due_date: '2026-02-17',   // 7 days
    })
    await request(app).post('/api/deadline-actions').send({
      item_id: 1,
      action_type: 'reschedule',
      original_due_date: '2026-02-15',
      new_due_date: '2026-02-22',   // 7 days
    })
  })

  it('prepends a pattern suggestion when 2+ reschedules share the same extension', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.status).toBe(200)
    const patternSuggestion = res.body.suggestions.find((s: { isPattern?: boolean }) => s.isPattern)
    expect(patternSuggestion).toBeDefined()
    expect(patternSuggestion.label).toContain('7-day extension')
    expect(patternSuggestion.isPattern).toBe(true)
  })

  it('places the pattern suggestion first in the array', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.body.suggestions[0].isPattern).toBe(true)
  })

  it('includes pattern metadata with correct days and count', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    expect(res.body.pattern).toBeDefined()
    expect(res.body.pattern.days).toBe(7)
    expect(res.body.pattern.count).toBeGreaterThanOrEqual(2)
  })

  it('pattern suggestion date is in the future', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    const ps = res.body.suggestions[0]
    const patternDate = new Date(ps.date + 'T00:00:00')
    expect(patternDate.getTime()).toBeGreaterThan(Date.now() - 86400000) // not more than 1 day in past
  })

  it('AI suggestions still appear after the pattern suggestion', async () => {
    const res = await request(app).post('/api/suggest-reschedule').send({ itemId: 1 })
    // The mock AI returns 2 far-future suggestions; total should be 3 (1 pattern + 2 AI)
    expect(res.body.suggestions.length).toBe(3)
    const aiSuggestions = res.body.suggestions.filter((s: { isPattern?: boolean }) => !s.isPattern)
    expect(aiSuggestions.length).toBe(2)
  })
})
