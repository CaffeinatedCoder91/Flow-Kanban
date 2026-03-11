import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Req, Res } from './_utils.js'

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

vi.mock('../lib/db.js', () => ({
  getItemById: vi.fn(),
  getItems: vi.fn(),
}))

import { supabaseAdmin } from '../lib/supabase.js'
import { getItemById } from '../lib/db.js'

const mockGetUser = supabaseAdmin.auth.getUser as ReturnType<typeof vi.fn>
const mockGetItemById = getItemById as ReturnType<typeof vi.fn>

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

let handler: (req: Req, res: Res) => Promise<void>

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('./suggest.js')
  handler = mod.default
  mockGetUser.mockReset()
  mockGetItemById.mockReset()
})

describe('POST /api/suggest', () => {
  it('returns 405 for non-POST methods', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(makeReq({ method: 'GET' }), res as unknown as Res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 with no auth token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no token') })
    const res = makeRes()
    await handler(makeReq(), res as unknown as Res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for invalid type', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: { type: 'delete', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for non-UUID itemId', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: { type: 'split', itemId: 'not-a-uuid' },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when item does not belong to user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockGetItemById.mockResolvedValue(null)
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer token' },
        body: { type: 'split', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      }),
      res as unknown as Res,
    )
    expect(res.statusCode).toBe(404)
  })
})
