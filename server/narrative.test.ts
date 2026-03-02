// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// ─── Shared mock handle for the Anthropic create method ───────────────────────
// The narrative call has no assistant prefill; the momentum call does ({ role: 'assistant', content: '{' }).
// We inspect the messages array to return the appropriate mock response for each.

const mockCreate = vi.hoisted(() =>
  vi.fn().mockImplementation(({ messages }: { messages: Array<{ role: string }> }) => {
    const isMomentum = messages.some(m => m.role === 'assistant')
    if (isMomentum) {
      return Promise.resolve({
        content: [{ type: 'text', text: '"score": 82, "reasoning": "Solid completion rate.", "sentiment": "healthy"}' }],
      })
    }
    return Promise.resolve({
      content: [{ type: 'text', text: 'Great progress this week — things are moving.' }],
    })
  })
)

// ─── Mock Anthropic SDK ───────────────────────────────────────────────────────

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Mock DB with an in-memory SQLite seeded with test data ──────────────────

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

  // 3 items created "now" — within any window
  db.exec(`
    INSERT INTO items (title, status, priority) VALUES ('Fix login bug', 'done', 'high');
    INSERT INTO items (title, status, priority) VALUES ('Write docs', 'stuck', 'medium');
    INSERT INTO items (title, status, priority) VALUES ('Deploy v2', 'in_progress', 'high');
  `)

  // 1 item created 8 days ago — outside last_week, inside last_30_days
  db.exec(`
    INSERT INTO items (title, status, priority, created_at, last_modified)
    VALUES ('Old task', 'not_started', 'low', datetime('now', '-8 days'), datetime('now', '-8 days'));
  `)

  // History entries created "now" (default changed_at)
  db.exec(`
    INSERT INTO item_history (item_id, description) VALUES (1, 'status changed from ''in_progress'' to ''done''');
    INSERT INTO item_history (item_id, description) VALUES (2, 'status changed from ''in_progress'' to ''stuck''');
    INSERT INTO item_history (item_id, description) VALUES (3, 'status changed from ''stuck'' to ''in_progress''');
    INSERT INTO item_history (item_id, description) VALUES (1, 'priority changed from ''low'' to ''high''');
  `)

  return { default: db }
})

// ─── Import app after mocks are registered ───────────────────────────────────

let app: Awaited<typeof import('./index')>['app']

beforeAll(async () => {
  const mod = await import('./index')
  app = mod.app
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/narrative', () => {
  it('returns 400 for an unsupported period value', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_year' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Invalid period/)
  })

  it('returns 400 when period is missing', async () => {
    const res = await request(app).post('/api/narrative').send({})
    expect(res.status).toBe(400)
  })

  it('returns correct top-level shape for last_week', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      period: 'last_week',
      period_start: expect.any(String),
      period_end: expect.any(String),
      summary: expect.any(Object),
      tasks_created: expect.any(Array),
      tasks_completed: expect.any(Array),
      tasks_stuck: expect.any(Array),
      tasks_unblocked: expect.any(Array),
      status_changes: expect.any(Array),
      priority_changes: expect.any(Array),
      narrative: expect.any(String),
      momentum: expect.any(Object),
    })
  })

  it('returns momentum object with score, reasoning and sentiment', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.momentum).toMatchObject({
      score: 82,
      reasoning: 'Solid completion rate.',
      sentiment: 'healthy',
    })
  })

  it('counts only items created within last_week window', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    // 3 recent items; the 8-day-old item should be excluded
    expect(res.body.summary.tasks_created).toBe(3)
    expect(res.body.tasks_created).toHaveLength(3)
  })

  it('identifies completed tasks (status → done)', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.summary.tasks_completed).toBe(1)
    expect(res.body.tasks_completed[0].title).toBe('Fix login bug')
    expect(res.body.tasks_completed[0].description).toContain("to 'done'")
  })

  it('identifies stuck tasks (status → stuck)', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.summary.tasks_stuck).toBe(1)
    expect(res.body.tasks_stuck[0].title).toBe('Write docs')
    expect(res.body.tasks_stuck[0].description).toContain("to 'stuck'")
  })

  it('identifies unblocked tasks (status from stuck)', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.summary.tasks_unblocked).toBe(1)
    expect(res.body.tasks_unblocked[0].title).toBe('Deploy v2')
    expect(res.body.tasks_unblocked[0].description).toContain("from 'stuck'")
  })

  it('counts all status changes (completed + stuck + unblocked = 3)', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.summary.status_changes).toBe(3)
    expect(res.body.status_changes).toHaveLength(3)
  })

  it('identifies priority changes', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.summary.priority_changes).toBe(1)
    expect(res.body.priority_changes[0].title).toBe('Fix login bug')
    expect(res.body.priority_changes[0].description).toContain('priority changed')
  })

  it('returns the AI-generated narrative string', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.body.narrative).toBe('Great progress this week — things are moving.')
  })

  it('returns empty narrative string but valid momentum when narrative AI throws', async () => {
    // First call (narrative) rejects; second call (momentum) uses default mock
    mockCreate.mockRejectedValueOnce(new Error('Rate limit'))
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.status).toBe(200)
    expect(res.body.narrative).toBe('')
    expect(res.body.momentum).toMatchObject({ score: 82, sentiment: 'healthy' })
    expect(res.body.summary.tasks_created).toBe(3)
  })

  it('returns null momentum but valid narrative when momentum AI throws', async () => {
    // Both calls go through the implementation; force the momentum (assistant-prefill) path to reject
    mockCreate.mockImplementationOnce(() =>
      Promise.resolve({ content: [{ type: 'text', text: 'Great progress this week — things are moving.' }] })
    )
    mockCreate.mockRejectedValueOnce(new Error('Parse error'))
    const res = await request(app).post('/api/narrative').send({ period: 'last_week' })
    expect(res.status).toBe(200)
    expect(res.body.narrative).toBe('Great progress this week — things are moving.')
    expect(res.body.momentum).toBeNull()
  })

  it('last_30_days includes the 8-day-old item that last_week excludes', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'last_30_days' })
    expect(res.status).toBe(200)
    expect(res.body.period).toBe('last_30_days')
    expect(res.body.summary.tasks_created).toBe(4) // includes the 8-day-old item
  })

  it('previous_7_days window (8-14 days ago) includes only the 8-day-old item', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'previous_7_days' })
    expect(res.status).toBe(200)
    expect(res.body.period).toBe('previous_7_days')
    expect(res.body.summary.tasks_created).toBe(1) // only the 8-day-old item; recent 3 excluded
    expect(res.body.tasks_created[0].title).toBe('Old task')
  })

  it('previous_7_days has no history events (all history entries are recent)', async () => {
    const res = await request(app).post('/api/narrative').send({ period: 'previous_7_days' })
    expect(res.body.summary.tasks_completed).toBe(0)
    expect(res.body.summary.tasks_stuck).toBe(0)
    expect(res.body.summary.priority_changes).toBe(0)
  })
})
