import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import { Item } from '@/types'
import { hasSeenWelcome } from '@/components/modals/WelcomeModal'

interface UseBoardItemsParams {
  showError: (message: string, onRetry?: () => void) => void
  isDemo?: boolean
}

export function useBoardItems({ showError, isDemo }: UseBoardItemsParams) {
  const [items, setItems] = useState<Item[]>([])
  const [text, setText] = useState('')
  const [isBoardLoading, setIsBoardLoading] = useState(false)
  const [hasFetchedBoard, setHasFetchedBoard] = useState(false)
  const [boardLoadError, setBoardLoadError] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [addTaskInitialTitle, setAddTaskInitialTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [sampleIds, setSampleIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('flow-sample-ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isClearingSample, setIsClearingSample] = useState(false)
  const initInFlightRef = useRef(false)
  const seededThisSessionRef = useRef(false)
  const SEEDING_KEY = 'flow-sample-seeding'

  const init = useCallback(async () => {
    if (initInFlightRef.current) return
    initInFlightRef.current = true
    setBoardLoadError(false)
    const skeletonTimer = setTimeout(() => setIsBoardLoading(true), 300)
    try {
      const res = await apiFetch('/api/items')
      if (!res.ok) throw new Error('board-load')
      let data: Item[] = await res.json()

      // Demo users get a fresh board each session — delete any leftover items
      if (isDemo && data.length > 0) {
        await Promise.all(data.map(item => apiFetch(`/api/items/${item.id}`, { method: 'DELETE' }).catch(() => {})))
        data = []
        // Clear seed flag so reseeding can happen (handles page-refresh case)
        try { localStorage.removeItem('flow-sample-ids') } catch {}
      }

      setItems(data)

      const alreadySeeded = !!localStorage.getItem('flow-sample-ids')
      const isSeeding = !!localStorage.getItem(SEEDING_KEY)
      // Demo users: skip the hasSeenWelcome() guard — the welcome modal can be
      // dismissed during cleanup, which would otherwise race and prevent seeding.
      if (
        data.length === 0 &&
        !alreadySeeded &&
        !isSeeding &&
        !seededThisSessionRef.current &&
        (isDemo || !hasSeenWelcome())
      ) {
        const tasks = [
          { title: 'Deploy new feature to production', status: 'in_progress', priority: 'high',     description: 'Ship the redesigned dashboard after final QA sign-off.' },
          { title: 'Review team PRs',                  status: 'not_started', priority: 'medium',   description: 'Go through open pull requests and leave detailed feedback.' },
          { title: 'Plan Q2 roadmap',                  status: 'not_started', priority: 'high',     description: 'Align with stakeholders on priorities and draft the roadmap doc.' },
          { title: 'Fix login bug on mobile',          status: 'stuck',       priority: 'critical', description: 'Users on iOS can\'t sign in — blocked on auth service response.' },
        ]
        try {
          localStorage.setItem(SEEDING_KEY, '1')
          const seedRes = await apiFetch('/api/items/bulk', {
            method: 'POST',
            body: JSON.stringify({ tasks }),
          })
          if (seedRes.ok) {
            const seedData = await seedRes.json()
            const ids: string[] = seedData.items.map((i: Item) => i.id)
            localStorage.setItem('flow-sample-ids', JSON.stringify(ids))
            setSampleIds(ids)
            setItems(seedData.items)
            seededThisSessionRef.current = true
          }
        } catch { /* ignore — user just won't see sample data */ }
        finally {
          try { localStorage.removeItem(SEEDING_KEY) } catch {}
        }
      }
    } catch {
      setBoardLoadError(true)
    } finally {
      clearTimeout(skeletonTimer)
      setIsBoardLoading(false)
      setHasFetchedBoard(true)
      initInFlightRef.current = false
    }
  }, [])

  useEffect(() => { init() }, [])

  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch('/api/items')
      if (!res.ok) throw new Error('refresh-failed')
      const data: Item[] = await res.json()
      setItems(data)
    } catch {
      showError('Failed to refresh tasks', fetchItems)
    }
  }, [showError])

  const addItemWithStatus = useCallback(async (title: string, status: string) => {
    const tempId = `temp-${Date.now()}`
    const tempItem: Item = {
      id: tempId, title, description: null, status, priority: 'medium',
      color: null, assignee: null, due_date: null, position: 0,
      created_at: new Date().toISOString(), last_modified: new Date().toISOString(), history: [],
    }

    setItems(prev => [...prev, tempItem])

    try {
      const res = await apiFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({ title, status }),
      })
      if (!res.ok) throw new Error('create-task')
      const item: Item = await res.json()
      setItems(prev => prev.map(t => t.id === tempId ? item : t))
    } catch {
      setItems(prev => prev.filter(t => t.id !== tempId))
      showError('Failed to create task', () => addItemWithStatus(title, status))
    }
  }, [showError])

  const handleAddTaskModalSubmit = useCallback(async (title: string, description: string | null, priority: string) => {
    const tempId = `temp-${Date.now()}`
    const tempItem: Item = {
      id: tempId, title, description, status: 'not_started', priority,
      color: null, assignee: null, due_date: null, position: 0,
      created_at: new Date().toISOString(), last_modified: new Date().toISOString(), history: [],
    }
    setItems(prev => [...prev, tempItem])
    setText('')
    try {
      const res = await apiFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify({ title, description, status: 'not_started', priority }),
      })
      if (!res.ok) throw new Error('create-task')
      const item: Item = await res.json()
      setItems(prev => prev.map(t => t.id === tempId ? item : t))
    } catch {
      setItems(prev => prev.filter(t => t.id !== tempId))
      showError('Failed to create task', () => handleAddTaskModalSubmit(title, description, priority))
    }
  }, [showError])

  const addItem = useCallback((e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (items.length === 0) {
      setAddTaskInitialTitle(text)
      setIsAddTaskOpen(true)
      return
    }
    addItemWithStatus(text, 'not_started')
    setText('')
  }, [text, items.length, addItemWithStatus])

  const removeItem = useCallback(async (id: string) => {
    let snapshot: Item | undefined
    setItems(prev => {
      snapshot = prev.find(t => t.id === id)
      return prev.filter(t => t.id !== id)
    })

    try {
      const res = await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete-failed')
    } catch {
      if (snapshot) setItems(prev => [...prev, snapshot!])
      showError('Failed to delete task')
    }
  }, [showError])

  const patchItem = useCallback(async (id: string, patch: Record<string, unknown>, fieldLabel: string) => {
    let snapshot: Item | undefined
    setItems(prev => {
      snapshot = prev.find(t => t.id === id)
      if (!snapshot) return prev
      return prev.map(t => t.id === id ? { ...t, ...patch } : t)
    })
    if (!snapshot) return

    try {
      const res = await apiFetch(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('patch-failed')
      const updated: Item = await res.json()
      setItems(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      setItems(prev => prev.map(t => t.id === id ? snapshot! : t))
      showError(`Failed to update ${fieldLabel}`, () => patchItem(id, patch, fieldLabel))
    }
  }, [showError])

  const updateItemStatus      = useCallback((id: string, status: string)            => patchItem(id, { status },      'task status'), [patchItem])
  const updateItemPriority    = useCallback((id: string, priority: string)          => patchItem(id, { priority },    'priority'), [patchItem])
  const updateItemDescription = useCallback((id: string, description: string|null)  => patchItem(id, { description }, 'description'), [patchItem])
  const updateItemDueDate     = useCallback((id: string, due_date: string|null)     => patchItem(id, { due_date },    'due date'), [patchItem])
  const updateItemAssignee    = useCallback((id: string, assignee: string|null)     => patchItem(id, { assignee },    'assignee'), [patchItem])
  const updateItemColor       = useCallback((id: string, color: string|null)        => patchItem(id, { color },       'color'), [patchItem])

  const handleClearSample = useCallback(async () => {
    if (isClearingSample) return
    setIsClearingSample(true)
    try {
      await Promise.all(sampleIds.map(id => apiFetch(`/api/items/${id}`, { method: 'DELETE' })))
      localStorage.removeItem('flow-sample-ids')
      setItems(prev => prev.filter(t => !sampleIds.includes(t.id)))
      setSampleIds([])
    } finally {
      setIsClearingSample(false)
    }
  }, [isClearingSample, sampleIds])

  return {
    items,
    setItems,
    text,
    setText,
    isBoardLoading,
    hasFetchedBoard,
    boardLoadError,
    isAddTaskOpen,
    setIsAddTaskOpen,
    addTaskInitialTitle,
    inputRef,
    sampleIds,
    isClearingSample,
    init,
    fetchItems,
    addItem,
    addItemWithStatus,
    handleAddTaskModalSubmit,
    removeItem,
    updateItemStatus,
    updateItemPriority,
    updateItemDescription,
    updateItemDueDate,
    updateItemAssignee,
    updateItemColor,
    handleClearSample,
  }
}
