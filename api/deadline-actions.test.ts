import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Req, Res } from './_utils.js'

// Mock Supabase so getUserId can be controlled without a real JWT
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

import { supabaseAdmin } from '../lib/supabase.js'

const mockGetUser = supabaseAdmin.auth.getUser as ReturnType<typeof vi.fn>

function makeReq(overrides: Partial<Req> = {}): Req {
  return { method: 'POST', headers: {}, body: {}, query: {}, ...overrides }
}

function makeRes() {
  const res = {
    statusCode: 200,
    data: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) { res.statusCode = code; return res as unknown as Res },
    json(d: unknown) { res.data = d },
    setHeader(k: string, v: string) { res.headers[k] = v },
    end() {},
  }
  return res
}

// Lazily import so mocks are in place first
let handler: (req: Req, res: Res) => Promise<void>

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('./deadline-actions.js')
  handler = mod.default
  mockGetUser.mockReset()
})

describe('POST /api/deadline-actions', () => {
  it('returns 405 for non-POST methods', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(makeReq({ method: 'GET' }), res as unknown as Res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 when no Authorization header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no token') })
    const res = makeRes()
    await handler(makeReq(), res as unknown as Res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for invalid action_type', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({ headers: { authorization: 'Bearer token' }, body: { action_type: 'ignore' } }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for malformed date', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: { action_type: 'reschedule', original_due_date: 'not-a-date' },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('returns 200 on a valid deprioritize action', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: { action_type: 'deprioritize' },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(200)
    expect((res.data as Record<string, unknown>).ok).toBe(true)
  })

  it('returns 200 and computes daysExtended for reschedule', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: {
          action_type: 'reschedule',
          original_due_date: '2026-03-01',
          new_due_date: '2026-03-08',
        },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(200)
    const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>
    const insertCall = fromMock.mock.calls.find(() => true)
    expect(insertCall).toBeDefined()
  })
})
