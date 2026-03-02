// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const TODAY      = addDays(0)
const TOMORROW   = addDays(1)
const IN_2_DAYS  = addDays(2)
const YESTERDAY  = addDays(-1)
const IN_3_DAYS  = addDays(3)

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

  const insert = db.prepare(
    `INSERT INTO items (title, status, due_date) VALUES (?, ?, ?)`
  )

  // Rule 1: not_started due within 24h → high
  insert.run('Not started due today',     'not_started', TODAY)
  insert.run('Not started due tomorrow',  'not_started', TOMORROW)
  insert.run('Not started overdue',       'not_started', YESTERDAY)

  // Rule 2: stuck due within 48h → high
  insert.run('Stuck due today',           'stuck',       TODAY)
  insert.run('Stuck due in 2 days',       'stuck',       IN_2_DAYS)
  insert.run('Stuck overdue',             'stuck',       YESTERDAY)

  // Rule 3: in_progress due today → medium
  insert.run('In progress due today',     'in_progress', TODAY)

  // Safe cases — should NOT appear in results
  insert.run('Not started due in 3 days', 'not_started', IN_3_DAYS)
  insert.run('Stuck due in 3 days',       'stuck',       IN_3_DAYS)
  insert.run('In progress due tomorrow',  'in_progress', TOMORROW)
  insert.run('Done due today',            'done',        TODAY)
  insert.run('No due date',               'not_started', null)

  return { default: db }
})

// ─── Mock Anthropic (required by server/index.ts even if unused here) ─────────

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))

// ─── Import app AFTER mocks are set up ───────────────────────────────────────

let app: Awaited<typeof import('./index')>['app']

beforeAll(async () => {
  const mod = await import('./index')
  app = mod.app
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/check-deadline-risks', () => {

  it('returns 200 with an at_risk array', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.at_risk)).toBe(true)
  })

  // ── Rule 1: not_started within 24h → high ───────────────────────────────────

  it('flags not_started due today as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Not started due today')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('flags not_started due tomorrow as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Not started due tomorrow')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('flags overdue not_started as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Not started overdue')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('does NOT flag not_started due in 3 days', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Not started due in 3 days')
    expect(item).toBeUndefined()
  })

  // ── Rule 2: stuck within 48h → high ─────────────────────────────────────────

  it('flags stuck due today as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Stuck due today')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('flags stuck due in 2 days as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Stuck due in 2 days')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('flags overdue stuck as high risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Stuck overdue')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('high')
  })

  it('does NOT flag stuck due in 3 days', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Stuck due in 3 days')
    expect(item).toBeUndefined()
  })

  // ── Rule 3: in_progress due today → medium ───────────────────────────────────

  it('flags in_progress due today as medium risk', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'In progress due today')
    expect(item).toBeDefined()
    expect(item.risk_level).toBe('medium')
  })

  it('does NOT flag in_progress due tomorrow', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'In progress due tomorrow')
    expect(item).toBeUndefined()
  })

  // ── Exclusions ───────────────────────────────────────────────────────────────

  it('does NOT flag done tasks even when overdue', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'Done due today')
    expect(item).toBeUndefined()
  })

  it('does NOT flag tasks with no due date', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    const item = res.body.at_risk.find((i: { title: string }) => i.title === 'No due date')
    expect(item).toBeUndefined()
  })

  // ── Response shape ────────────────────────────────────────────────────────────

  it('each at_risk item has the expected fields', async () => {
    const res = await request(app).post('/api/check-deadline-risks')
    for (const item of res.body.at_risk) {
      expect(item).toHaveProperty('item_id')
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('due_date')
      expect(item).toHaveProperty('status')
      expect(item).toHaveProperty('risk_level')
      expect(['high', 'medium']).toContain(item.risk_level)
    }
  })
})
