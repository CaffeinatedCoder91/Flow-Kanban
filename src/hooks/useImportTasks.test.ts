import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImportTasks } from './useImportTasks'
import { ERROR_MESSAGES } from '@/lib/errors'
import type { Item } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], name)
}

function makeChangeEvent(file: File | null): React.ChangeEvent<HTMLInputElement> {
  const target = { files: file ? [file] : [], value: '' } as unknown as HTMLInputElement
  return { target } as React.ChangeEvent<HTMLInputElement>
}

const mockTask = { title: 'Task A', description: null, priority: 'medium', due_date: null, assignee: null, status: 'not_started', status_reasoning: null, color: null, confidence: {} }
const mockItem: Item = { id: 'item-1', title: 'Task A', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01T00:00:00Z', last_modified: '2026-01-01T00:00:00Z', history: [] }

function ok(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
}
function fail(status = 400, error = 'Bad request') {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error }) } as Response)
}

function makeParams() {
  return {
    setItems: vi.fn() as React.Dispatch<React.SetStateAction<Item[]>>,
    showImportSuccess: vi.fn(),
    onImported: vi.fn(),
  }
}

afterEach(() => { vi.restoreAllMocks() })

// ─── Modal state ──────────────────────────────────────────────────────────────

describe('useImportTasks — modal state', () => {
  it('opens with clean state', () => {
    const { result } = renderHook(() => useImportTasks(makeParams()))
    expect(result.current.isImportOpen).toBe(false)
    act(() => { result.current.openImportModal() })
    expect(result.current.isImportOpen).toBe(true)
    expect(result.current.extractedTasks).toEqual([])
    expect(result.current.extractError).toBeNull()
  })

  it('closes and resets all state', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(ok({ tasks: [mockTask] }))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    act(() => { result.current.openImportModal(); result.current.setImportText('some text') })
    await act(() => result.current.handleExtractTasks())
    expect(result.current.extractedTasks).toHaveLength(1)
    act(() => { result.current.closeImportModal() })
    expect(result.current.isImportOpen).toBe(false)
    expect(result.current.extractedTasks).toEqual([])
    expect(result.current.importText).toBe('')
  })
})

// ─── File upload — client-side validation ─────────────────────────────────────

describe('useImportTasks — handleFileUpload client validation', () => {
  it('rejects unsupported file type without calling API', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleFileUpload(makeChangeEvent(makeFile('report.xlsx'))))
    expect(result.current.extractError).toBe(ERROR_MESSAGES.FILE_TYPE)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects files over 5 MB without calling API', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const { result } = renderHook(() => useImportTasks(makeParams()))
    const bigFile = makeFile('notes.txt', 6 * 1024 * 1024)
    await act(() => result.current.handleFileUpload(makeChangeEvent(bigFile)))
    expect(result.current.extractError).toBe(ERROR_MESSAGES.FILE_SIZE)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does nothing when no file is selected', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleFileUpload(makeChangeEvent(null)))
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.extractError).toBeNull()
  })
})

// ─── File upload — API path ───────────────────────────────────────────────────

describe('useImportTasks — handleFileUpload API', () => {
  it('sets extractedTasks on successful file upload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(ok({ tasks: [mockTask] }))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleFileUpload(makeChangeEvent(makeFile('notes.txt'))))
    expect(result.current.extractedTasks).toHaveLength(1)
    expect(result.current.extractedTasks[0].title).toBe('Task A')
    expect(result.current.isExtracting).toBe(false)
    expect(result.current.extractError).toBeNull()
  })

  it('sets extractError and clears filename on API failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(fail(500, 'Server error'))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleFileUpload(makeChangeEvent(makeFile('notes.pdf'))))
    expect(result.current.extractError).toBeTruthy()
    expect(result.current.importFileName).toBeNull()
    expect(result.current.isExtracting).toBe(false)
  })

  it('sets extractError when API returns empty task list with message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(ok({ tasks: [], message: 'No actionable tasks found in the uploaded file.' }))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleFileUpload(makeChangeEvent(makeFile('blank.txt'))))
    expect(result.current.extractedTasks).toHaveLength(0)
    expect(result.current.extractError).toBe('No actionable tasks found in the uploaded file.')
  })
})

// ─── Text extraction ──────────────────────────────────────────────────────────

describe('useImportTasks — handleExtractTasks', () => {
  it('sets extractedTasks from text', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(ok({ tasks: [mockTask] }))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    act(() => { result.current.setImportText('Review the PRs and update the docs') })
    await act(() => result.current.handleExtractTasks())
    expect(result.current.extractedTasks).toHaveLength(1)
    expect(result.current.isExtracting).toBe(false)
  })

  it('sets extractError on API failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(fail(429))
    const { result } = renderHook(() => useImportTasks(makeParams()))
    await act(() => result.current.handleExtractTasks())
    expect(result.current.extractError).toBe(ERROR_MESSAGES.RATE_LIMIT)
    expect(result.current.isExtracting).toBe(false)
  })
})

// ─── Confirm import ───────────────────────────────────────────────────────────

describe('useImportTasks — handleConfirmAll', () => {
  it('calls bulk API, updates items, closes modal, and fires success callback', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({ tasks: [mockTask] }))          // extract
      .mockResolvedValueOnce(ok({ items: [mockItem] }))          // bulk
    const params = makeParams()
    const { result } = renderHook(() => useImportTasks(params))
    act(() => { result.current.openImportModal() })
    await act(() => result.current.handleExtractTasks())
    await act(() => result.current.handleConfirmAll())
    expect(params.setItems).toHaveBeenCalled()
    expect(params.showImportSuccess).toHaveBeenCalledWith(expect.stringContaining('1 task'))
    expect(params.onImported).toHaveBeenCalled()
    expect(result.current.isImportOpen).toBe(false)
  })

  it('sets extractError and keeps modal open on bulk API failure', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({ tasks: [mockTask] }))  // extract
      .mockResolvedValueOnce(fail(400, 'DB error'))       // bulk (400 = not retried by apiFetch)
    const params = makeParams()
    const { result } = renderHook(() => useImportTasks(params))
    act(() => { result.current.openImportModal() })
    await act(() => result.current.handleExtractTasks())
    await act(() => result.current.handleConfirmAll())
    expect(params.showImportSuccess).not.toHaveBeenCalled()
    expect(result.current.extractError).toBe('DB error')
    expect(result.current.isImportOpen).toBe(true)
  })

  it('pluralises the success message correctly for multiple tasks', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({ tasks: [mockTask, mockTask] }))
      .mockResolvedValueOnce(ok({ items: [mockItem, { ...mockItem, id: 'item-2' }] }))
    const params = makeParams()
    const { result } = renderHook(() => useImportTasks(params))
    await act(() => result.current.handleExtractTasks())
    await act(() => result.current.handleConfirmAll())
    expect(params.showImportSuccess).toHaveBeenCalledWith(expect.stringContaining('2 tasks'))
  })
})
