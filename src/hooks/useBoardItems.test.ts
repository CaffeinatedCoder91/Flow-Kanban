import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBoardItems } from './useBoardItems'

const mockItem = {
  id: 'item-1', title: 'Fix bug', description: null, status: 'not_started',
  priority: 'medium', color: null, assignee: null, due_date: null,
  position: 0, created_at: '2026-01-01T00:00:00Z', last_modified: '2026-01-01T00:00:00Z',
  history: [],
}

function ok(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
}

// 400 is not in apiFetch's retryable set — fails immediately without retries
function fail() {
  return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({ error: 'err' }) } as Response)
}

beforeEach(() => {
  localStorage.clear()
  // Prevent sample-data seeding: correct key used by hasSeenWelcome()
  localStorage.setItem('flow-welcome-seen', 'true')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useBoardItems — init', () => {
  it('fetches items on mount and sets them', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(ok([mockItem]))
    const { result } = renderHook(() => useBoardItems({ showError: vi.fn() }))
    await waitFor(() => expect(result.current.hasFetchedBoard).toBe(true))
    expect(result.current.items).toEqual([mockItem])
  })

  it('sets boardLoadError when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(fail())
    const { result } = renderHook(() => useBoardItems({ showError: vi.fn() }))
    await waitFor(() => expect(result.current.hasFetchedBoard).toBe(true))
    expect(result.current.boardLoadError).toBe(true)
    expect(result.current.items).toEqual([])
  })
})

describe('useBoardItems — fetchItems', () => {
  it('updates items on successful refresh', async () => {
    const updated = { ...mockItem, title: 'Updated' }
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))
      .mockResolvedValueOnce(ok([updated]))
    const { result } = renderHook(() => useBoardItems({ showError: vi.fn() }))
    await waitFor(() => expect(result.current.hasFetchedBoard).toBe(true))
    await act(() => result.current.fetchItems())
    expect(result.current.items[0].title).toBe('Updated')
  })

  it('calls showError with retry callback on failed refresh', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))
      .mockResolvedValueOnce(fail())
    const showError = vi.fn()
    const { result } = renderHook(() => useBoardItems({ showError }))
    await waitFor(() => expect(result.current.hasFetchedBoard).toBe(true))
    await act(() => result.current.fetchItems())
    expect(showError).toHaveBeenCalledWith('Failed to refresh tasks', expect.any(Function))
    // Items unchanged after failure
    expect(result.current.items).toEqual([mockItem])
  })
})

describe('useBoardItems — addItemWithStatus', () => {
  it('optimistically adds item then replaces with server response', async () => {
    const serverItem = { ...mockItem, id: 'server-1' }
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))  // init
      .mockResolvedValueOnce(ok(serverItem))  // POST /api/items
    const { result } = renderHook(() => useBoardItems({ showError: vi.fn() }))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    act(() => { result.current.addItemWithStatus('New task', 'not_started') })
    // Optimistic item appears immediately
    expect(result.current.items.some(t => t.title === 'New task')).toBe(true)
    await waitFor(() => expect(result.current.items.find(t => t.id === 'server-1')).toBeDefined())
  })

  it('rolls back optimistic item on API failure', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))  // init
      .mockResolvedValueOnce(fail())           // POST /api/items
    const showError = vi.fn()
    const { result } = renderHook(() => useBoardItems({ showError }))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    act(() => { result.current.addItemWithStatus('New task', 'not_started') })
    await waitFor(() => expect(showError).toHaveBeenCalled())
    // Original items restored
    expect(result.current.items).toEqual([mockItem])
  })
})

describe('useBoardItems — removeItem', () => {
  it('optimistically removes item and confirms on success', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))  // init
      .mockResolvedValueOnce(ok({}))           // DELETE
    const { result } = renderHook(() => useBoardItems({ showError: vi.fn() }))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    act(() => { result.current.removeItem('item-1') })
    expect(result.current.items).toHaveLength(0)
    // No error shown
    await act(() => Promise.resolve())
  })

  it('restores item on delete failure', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok([mockItem]))  // init
      .mockResolvedValueOnce(fail())           // DELETE
    const showError = vi.fn()
    const { result } = renderHook(() => useBoardItems({ showError }))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
    act(() => { result.current.removeItem('item-1') })
    await waitFor(() => expect(showError).toHaveBeenCalled())
    expect(result.current.items).toHaveLength(1)
  })
})
