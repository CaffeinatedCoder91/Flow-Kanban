import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInsights } from './useInsights'
import { Item } from '@/types'

const makeItem = (id: string, status = 'not_started'): Item => ({
  id, title: `Task ${id}`, description: null, status, priority: 'medium',
  color: null, assignee: null, due_date: null, position: 0,
  created_at: '2026-01-01T00:00:00Z', last_modified: '2026-01-01T00:00:00Z',
  history: [],
})

/** URL-aware fetch mock — routes each URL to its own response so supabase
 *  initialisation calls don't consume a mock slot. */
function mockFetch(responses: Record<string, unknown>) {
  vi.spyOn(global, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    for (const [key, body] of Object.entries(responses)) {
      if (url.includes(key)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
      }
    }
    // Default: successful empty response for anything else (e.g. supabase)
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  })
}

function makeParams(items: Item[] = []) {
  return {
    items,
    showRefreshMessage: vi.fn(),
    clearRefreshMessage: vi.fn(),
    refreshMessage: null,
    setIsAssistantOpen: vi.fn(),
    setPrefillMessage: vi.fn(),
    setProactiveMessages: vi.fn(),
    setNegotiationItem: vi.fn(),
    updateItemStatus: vi.fn(),
  }
}

describe('useInsights — auto-fetch (fake timers)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('does NOT fetch insights when items list is empty', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: true, json: () => Promise.resolve({}) } as Response
    )
    renderHook(() => useInsights(makeParams([])))
    await act(() => vi.runAllTimersAsync())
    // No item → fetchInsightsNow returns early, no fetch call
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('triggers a fetch when itemCount increases (item added)', async () => {
    mockFetch({ '/api/insights': { insights: [] }, '/api/check-deadline-risks': { at_risk: [] } })
    const fetchSpy = global.fetch as ReturnType<typeof vi.fn>
    const params = makeParams([makeItem('1')])
    const { rerender } = renderHook((p) => useInsights(p), { initialProps: params })
    await act(() => vi.runAllTimersAsync())
    const after1 = fetchSpy.mock.calls.filter(c => String(c[0]).includes('/api/')).length
    expect(after1).toBeGreaterThan(0)

    rerender({ ...params, items: [makeItem('1'), makeItem('2')] })
    await act(() => vi.runAllTimersAsync())
    const after2 = fetchSpy.mock.calls.filter(c => String(c[0]).includes('/api/')).length
    expect(after2).toBeGreaterThan(after1)
  })

  it('does NOT re-fetch when only a field changes (same item count)', async () => {
    mockFetch({ '/api/insights': { insights: [] }, '/api/check-deadline-risks': { at_risk: [] } })
    const fetchSpy = global.fetch as ReturnType<typeof vi.fn>
    const items = [makeItem('1')]
    const params = makeParams(items)
    const { rerender } = renderHook((p) => useInsights(p), { initialProps: params })
    await act(() => vi.runAllTimersAsync())
    const after1 = fetchSpy.mock.calls.filter(c => String(c[0]).includes('/api/')).length

    // Same count, only status edited — should NOT re-trigger debounce
    rerender({ ...params, items: [{ ...makeItem('1'), status: 'in_progress' }] })
    await act(() => vi.runAllTimersAsync())
    expect(fetchSpy.mock.calls.filter(c => String(c[0]).includes('/api/')).length).toBe(after1)
  })
})

describe('useInsights — manual refresh (real timers)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('fetchInsightsNow populates insights and sets isAllClear', async () => {
    const insight = { type: 'stale', severity: 'low', title: 'Stale task', description: 'desc', items: ['1'] }
    mockFetch({ '/api/insights': { insights: [insight] }, '/api/check-deadline-risks': { at_risk: [] } })
    const { result } = renderHook(() => useInsights(makeParams([makeItem('1')])))
    await act(() => result.current.fetchInsightsNow())
    expect(result.current.insights[0].title).toBe('Stale task')
    expect(result.current.insightsError).toBe(false)
  })

  it('sets insightsError when /api/insights returns a non-OK response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      { ok: false, json: () => Promise.resolve({}) } as Response
    )
    const { result } = renderHook(() => useInsights(makeParams([makeItem('1')])))
    await act(() => result.current.fetchInsightsNow())
    expect(result.current.insightsError).toBe(true)
  })

  it('signals isAllClear after a successful fetch with no insights', async () => {
    mockFetch({ '/api/insights': { insights: [] }, '/api/check-deadline-risks': { at_risk: [] } })
    const { result } = renderHook(() => useInsights(makeParams([makeItem('1')])))
    await act(() => result.current.fetchInsightsNow())
    // isAllClear = insightsFetched && !loading && visibleInsights.length === 0 && ...
    expect(result.current.isAllClear).toBe(true)
  })
})

describe('useInsights — deadline risk proactive alerts (real timers)', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('opens assistant and sets proactive messages for high-risk items', async () => {
    const setIsAssistantOpen = vi.fn()
    const setProactiveMessages = vi.fn()
    mockFetch({
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{
          item_id: '1', title: 'Deploy', due_date: '2026-01-01',
          status: 'not_started', risk_level: 'high',
        }],
      },
    })
    const params = { ...makeParams([makeItem('1')]), setIsAssistantOpen, setProactiveMessages }
    const { result } = renderHook(() => useInsights(params))
    await act(() => result.current.fetchInsightsNow())
    expect(setIsAssistantOpen).toHaveBeenCalledWith(true)
    expect(setProactiveMessages).toHaveBeenCalled()
  })

  it('does NOT open assistant for medium-risk items', async () => {
    const setIsAssistantOpen = vi.fn()
    mockFetch({
      '/api/insights': { insights: [] },
      '/api/check-deadline-risks': {
        at_risk: [{
          item_id: '2', title: 'Review PR', due_date: '2026-03-11',
          status: 'in_progress', risk_level: 'medium',
        }],
      },
    })
    const params = { ...makeParams([makeItem('2')]), setIsAssistantOpen }
    const { result } = renderHook(() => useInsights(params))
    await act(() => result.current.fetchInsightsNow())
    expect(setIsAssistantOpen).not.toHaveBeenCalledWith(true)
  })
})
