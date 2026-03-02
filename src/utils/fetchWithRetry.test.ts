import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithRetry } from './fetchWithRetry'

function makeResponse(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('fetchWithRetry', () => {
  it('returns response immediately on 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeResponse(200))
    const promise = fetchWithRetry('/api/test')
    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 and succeeds after retries', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(makeResponse(500))
      .mockResolvedValueOnce(makeResponse(500))
      .mockResolvedValueOnce(makeResponse(200))
    const promise = fetchWithRetry('/api/test', undefined, 3, 1)
    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry on 400 — only 1 call', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeResponse(400))
    const promise = fetchWithRetry('/api/test')
    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.status).toBe(400)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('throws after all attempts when always 503', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeResponse(503))
    const promise = fetchWithRetry('/api/test', undefined, 3, 1)
    await vi.runAllTimersAsync()
    const res = await promise
    // After exhausting all attempts it returns the last response (503)
    expect(res.status).toBe(503)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('retries on network error (fetch throws)', async () => {
    vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(makeResponse(200))
    const promise = fetchWithRetry('/api/test', undefined, 3, 1)
    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('throws after all network-error attempts are exhausted', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'))
    const promise = fetchWithRetry('/api/test', undefined, 3, 1)
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toThrow('offline')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('respects custom maxAttempts', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(makeResponse(503))
    const promise = fetchWithRetry('/api/test', undefined, 2, 1)
    await vi.runAllTimersAsync()
    await promise
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
