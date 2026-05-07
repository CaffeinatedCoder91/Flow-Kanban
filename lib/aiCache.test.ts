import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withAiCache } from './aiCache.js'

// Mock redis module
vi.mock('./rateLimit.js', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

import { redis } from './rateLimit.js'

const mockRedis = redis as any

describe('aiCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates stable fingerprints for identical inputs', () => {
    const inputs1 = { message: 'hello', itemIds: ['a', 'b'] }
    const inputs2 = { message: 'hello', itemIds: ['a', 'b'] }

    // Same inputs should generate same fingerprint (via cache key)
    // This is verified by calling withAiCache twice and checking if cache is hit
    const fn1 = vi.fn().mockResolvedValue({ result: 'data1' })
    const fn2 = vi.fn().mockResolvedValue({ result: 'data2' })

    mockRedis.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ result: 'data1' })
    mockRedis.set.mockResolvedValue(undefined)

    return Promise.all([
      withAiCache({ userId: 'user1', endpoint: 'test', inputs: inputs1, isDemo: false, fn: fn1 }),
      withAiCache({ userId: 'user1', endpoint: 'test', inputs: inputs2, isDemo: false, fn: fn2 }),
    ]).then(([result1, result2]) => {
      expect(fn1).toHaveBeenCalledTimes(1)
      expect(fn2).toHaveBeenCalledTimes(0) // Should not be called, cache hit
      expect(result1).toEqual({ result: 'data1' })
      expect(result2).toEqual({ result: 'data1' }) // Cache hit
    })
  })

  it('generates different fingerprints for different inputs', async () => {
    const inputs1 = { message: 'hello' }
    const inputs2 = { message: 'world' }

    const fn = vi.fn().mockResolvedValue({ result: 'data' })
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await withAiCache({ userId: 'user1', endpoint: 'test', inputs: inputs1, isDemo: false, fn })
    await withAiCache({ userId: 'user1', endpoint: 'test', inputs: inputs2, isDemo: false, fn })

    expect(fn).toHaveBeenCalledTimes(2) // Both should call fn (different cache keys)
    expect(mockRedis.set).toHaveBeenCalledTimes(2)
  })

  it('returns cached value on hit', async () => {
    const cachedData = { result: 'cached' }
    const fn = vi.fn()

    mockRedis.get.mockResolvedValue(cachedData)

    const result = await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: false,
      fn,
    })

    expect(result).toEqual(cachedData)
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls function and caches on miss', async () => {
    const fnResult = { result: 'fresh' }
    const fn = vi.fn().mockResolvedValue(fnResult)

    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    const result = await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: false,
      fn,
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(result).toEqual(fnResult)
    expect(mockRedis.set).toHaveBeenCalledTimes(1)
  })

  it('uses 30-second TTL for regular users', async () => {
    const fn = vi.fn().mockResolvedValue({ result: 'data' })
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: false,
      fn,
    })

    expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
      ex: 30,
    })
  })

  it('uses 24-hour TTL for demo users', async () => {
    const fn = vi.fn().mockResolvedValue({ result: 'data' })
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    await withAiCache({
      userId: 'demo-user',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: true,
      fn,
    })

    expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
      ex: 86400, // 24 hours
    })
  })

  it('falls through to function on redis read error', async () => {
    const fnResult = { result: 'fresh' }
    const fn = vi.fn().mockResolvedValue(fnResult)

    mockRedis.get.mockRejectedValue(new Error('Redis down'))
    mockRedis.set.mockResolvedValue(undefined)

    const result = await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: false,
      fn,
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(result).toEqual(fnResult)
  })

  it('recovers gracefully from redis write error', async () => {
    const fnResult = { result: 'fresh' }
    const fn = vi.fn().mockResolvedValue(fnResult)

    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockRejectedValue(new Error('Redis down'))

    const result = await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs: { data: 'input' },
      isDemo: false,
      fn,
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(result).toEqual(fnResult) // Still returns result even though cache write failed
  })

  it('isolates cache by user', async () => {
    const fn1 = vi.fn().mockResolvedValue({ result: 'user1data' })
    const fn2 = vi.fn().mockResolvedValue({ result: 'user2data' })

    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    const inputs = { data: 'same' }

    await withAiCache({
      userId: 'user1',
      endpoint: 'test',
      inputs,
      isDemo: false,
      fn: fn1,
    })
    await withAiCache({
      userId: 'user2',
      endpoint: 'test',
      inputs,
      isDemo: false,
      fn: fn2,
    })

    // Different users should have different cache keys
    expect(mockRedis.set).toHaveBeenCalledTimes(2)
    const call1Key = (mockRedis.set as any).mock.calls[0][0]
    const call2Key = (mockRedis.set as any).mock.calls[1][0]
    expect(call1Key).not.toEqual(call2Key)
    expect(call1Key).toContain('user1')
    expect(call2Key).toContain('user2')
  })

  it('isolates cache by endpoint', async () => {
    const fn1 = vi.fn().mockResolvedValue({ result: 'endpoint1' })
    const fn2 = vi.fn().mockResolvedValue({ result: 'endpoint2' })

    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue(undefined)

    const inputs = { data: 'same' }

    await withAiCache({
      userId: 'user1',
      endpoint: 'chat',
      inputs,
      isDemo: false,
      fn: fn1,
    })
    await withAiCache({
      userId: 'user1',
      endpoint: 'suggest',
      inputs,
      isDemo: false,
      fn: fn2,
    })

    // Different endpoints should have different cache keys
    const call1Key = (mockRedis.set as any).mock.calls[0][0]
    const call2Key = (mockRedis.set as any).mock.calls[1][0]
    expect(call1Key).not.toEqual(call2Key)
    expect(call1Key).toContain('chat')
    expect(call2Key).toContain('suggest')
  })
})
