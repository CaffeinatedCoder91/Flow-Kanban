import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import styled from '@emotion/styled'
import { apiFetch } from './lib/api'
import { useAuth } from './context/AuthContext'
import { Item, Insight, ProposedTask, STATUS_CONFIG } from './types'

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

const ModalContainer = styled.div<{ wide?: boolean }>`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: ${p => (p.wide ? 'min(860px, 92vw)' : '560px')};
  max-width: ${p => (p.wide ? 'unset' : 'calc(100vw - 2rem)')};
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    ${p => p.wide && 'width: min(860px, 96vw);'}
  }
  @media (max-width: 767px) {
    ${p => p.wide
      ? 'width: calc(100vw - 1rem);'
      : 'max-width: calc(100vw - 1rem); border-radius: 8px;'}
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};

  h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: ${p => p.theme.colors.text}; }

  @media (max-width: 767px) { padding-left: 1rem; padding-right: 1rem; }
`

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${p => p.theme.borderRadius.md};
  transition: background 0.15s, color 0.15s;

  &:hover { background: ${p => p.theme.colors.background}; color: ${p => p.theme.colors.textSecondary}; }
`

const ModalBody = styled.div<{ preview?: boolean }>`
  padding: 1.25rem 1.5rem;
  ${p => p.preview && 'padding-bottom: 0;'}
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: 767px) { padding-left: 1rem; padding-right: 1rem; }
`

const ModalHint = styled.p`
  margin: 0;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
`

const ModalTextarea = styled.textarea`
  width: 100%;
  height: clamp(120px, 25vh, 200px);
  padding: 0.75rem;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }
`

const ExtractError = styled.p`
  margin-top: 0.625rem;
  font-size: 0.8125rem;
  color: ${p => p.theme.colors.dangerDark};
`

const SpinnerRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.spacing[2]};
  margin-top: 0.75rem;
`

const Spinner = styled.span<{ inline?: boolean }>`
  display: inline-block;
  width: ${p => (p.inline ? '13px' : '16px')};
  height: ${p => (p.inline ? '13px' : '16px')};
  ${p => p.inline && 'margin-right: 0.4rem; vertical-align: middle;'}
  flex-shrink: 0;
  border: 2px solid #e0d7f7;
  border-top-color: ${p => p.theme.colors.primary};
  border-radius: ${p => p.theme.borderRadius.full};
  animation: modal-spin 0.7s linear infinite;

  @keyframes modal-spin { to { transform: rotate(360deg); } }
`

const SpinnerLabel = styled.span`
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.primary};
`

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${p => p.theme.colors.border};

  @media (max-width: 767px) {
    flex-direction: row;
    gap: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
`

const FileBtnLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;

  &:hover { background: ${p => p.theme.colors.background}; border-color: #c4c8d8; }
`

const FileHint = styled.span`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textTertiary};
  white-space: nowrap;
  flex: 1;
`

const FileSource = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${p => p.theme.colors.textSecondary};

  strong { color: ${p => p.theme.colors.text}; }
`

const PreviewCount = styled.p`
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: #555;
  margin: 0 0 0.875rem;
`

const PreviewList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-bottom: 1rem;

  @media (max-width: 767px) { grid-template-columns: 1fr; max-height: 55vh; }
`

const CancelBtn = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.background}; }

  @media (max-width: 767px) { flex: 1; text-align: center; }
`

const ProcessBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.primaryDark}; }
  &:disabled { background: ${p => p.theme.colors.borderSubtle}; cursor: not-allowed; }

  @media (max-width: 767px) { flex: 1; text-align: center; }
`

const Toast = styled.div<{ error?: boolean }>`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: ${p => (p.error ? '#1c1917' : '#1a1a2e')};
  color: #fff;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  padding: 0.75rem 1.125rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  z-index: ${p => p.theme.zIndex.toast};
  pointer-events: ${p => (p.error ? 'auto' : 'none')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: toast-in 0.2s ease${p => p.error ? ', shake 0.18s ease 0.12s' : ', toast-out 0.3s ease 2.7s forwards'};

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(4px); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    18%       { transform: translateX(-5px); }
    36%       { transform: translateX(5px); }
    54%       { transform: translateX(-4px); }
    72%       { transform: translateX(4px); }
    90%       { transform: translateX(-2px); }
  }
`

const ToastRetryBtn = styled.button`
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  padding: 0.25rem 0.7rem;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 0.25rem;
  transition: background 0.15s;

  &:hover { background: rgba(255,255,255,0.22); }
`
import KanbanBoard from './components/board/KanbanBoard'
import InsightCard from './components/panels/InsightCard'
import SpotlightCard from './components/panels/SpotlightCard'
import AssistantPanel from './components/panels/AssistantPanel'
import TaskPreview from './components/modals/TaskPreview'
import SummaryView from './components/panels/SummaryView'
import NarrativeWidget from './components/panels/NarrativeWidget'
import DeadlineNegotiationModal from './components/modals/DeadlineNegotiationModal'
import WelcomeModal, { hasSeenWelcome } from './components/modals/WelcomeModal'
import HelpModal from './components/modals/HelpModal'

interface Recommendation {
  recommendedItemId: string
  reason: string
}

function App() {
  const { user, signOut } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [text, setText] = useState('')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<ProposedTask[]>([])
  const [extractError, setExtractError] = useState<string | null>(null)
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null)
  const importSuccessTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [errorToast, setErrorToast] = useState<{ message: string; onRetry?: () => void } | null>(null)
  const errorToastTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [recommendationDismissed, setRecommendationDismissed] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const refreshMessageTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'board' | 'summary'>('board')
  const [prefillMessage, setPrefillMessage] = useState('')
  const [proactiveMessages, setProactiveMessages] = useState<string[]>([])
  const alertedItemIdsRef = useRef<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const [negotiationItem, setNegotiationItem] = useState<Item | null>(null)
  const [isBoardLoading, setIsBoardLoading] = useState(true)
  const [insightsFetched, setInsightsFetched] = useState(false)
  const [boardLoadError, setBoardLoadError] = useState(false)
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => !hasSeenWelcome())
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [sampleIds, setSampleIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('flow-sample-ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissed-insights')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const getInsightKey = (insight: Insight) =>
    `${insight.type}:${[...insight.items].sort().join(',')}`

  const dismissInsight = (insight: Insight) => {
    const key = getInsightKey(insight)
    setDismissedKeys(prev => {
      const next = new Set(prev)
      next.add(key)
      localStorage.setItem('dismissed-insights', JSON.stringify([...next]))
      return next
    })
  }

  const visibleInsights = insights.filter(i => !dismissedKeys.has(getInsightKey(i)))

  const handleStartWorking = async (id: string) => {
    const item = items.find(t => t.id === id)
    if (item && item.status !== 'in_progress') {
      await updateItemStatus(id, 'in_progress')
    }
    setTimeout(() => {
      const el = document.querySelector(`[data-item-id="${id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    setRecommendationDismissed(true)
  }

  const handleInsightAction = (insight: Insight) => {
    if (insight.type === 'duplicate') {
      const taskTitles = insight.items
        .map(id => items.find(item => item.id === id))
        .filter(Boolean)
        .map(item => `"${item!.title}"`)
        .join(', ')
      setPrefillMessage(`Help me merge these duplicate tasks: ${taskTitles}`)
      setIsAssistantOpen(true)
    } else if (insight.type === 'deadline_risk') {
      const item = items.find(i => i.id === insight.items[0])
      if (item) setNegotiationItem(item)
    } else {
      setHighlightedItems(new Set(insight.items))
      // Scroll to the first highlighted card
      const firstId = insight.items[0]
      const el = document.querySelector(`[data-item-id="${firstId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedItems(new Set()), 3000)
    }
  }

  const init = useCallback(async () => {
    setBoardLoadError(false)
    setIsBoardLoading(true)
    try {
      const res = await apiFetch('/api/items')
      if (!res.ok) throw new Error('board-load')
      const data: Item[] = await res.json()
      setItems(data)

      const alreadySeeded = !!localStorage.getItem('flow-sample-ids')
      if (data.length === 0 && !hasSeenWelcome() && !alreadySeeded) {
        const tasks = [
          { title: 'Deploy new feature to production', status: 'in_progress', priority: 'high',     description: 'Ship the redesigned dashboard after final QA sign-off.' },
          { title: 'Review team PRs',                  status: 'not_started', priority: 'medium',   description: 'Go through open pull requests and leave detailed feedback.' },
          { title: 'Plan Q2 roadmap',                  status: 'not_started', priority: 'high',     description: 'Align with stakeholders on priorities and draft the roadmap doc.' },
          { title: 'Fix login bug on mobile',          status: 'stuck',       priority: 'critical', description: 'Users on iOS can\'t sign in — blocked on auth service response.' },
        ]
        try {
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
          }
        } catch { /* ignore — user just won't see sample data */ }
      }
    } catch {
      setBoardLoadError(true)
    } finally {
      setIsBoardLoading(false)
    }
  }, [])

  useEffect(() => { init() }, [])

  const insightsTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchInsightsNow = async (isManual = false) => {
    if (items.length === 0) return
    setInsightsError(false)
    setIsInsightsLoading(true)
    try {
      const [insightsRes, deadlineRes] = await Promise.all([
        apiFetch('/api/insights', { method: 'POST', body: JSON.stringify({ items }) }),
        apiFetch('/api/check-deadline-risks', { method: 'POST' }).catch(() => null),
      ])
      if (!insightsRes.ok) throw new Error('insights-load')
      const insightsData = await insightsRes.json()
      const newInsights: Insight[] = insightsData.insights

      const deadlineInsights: Insight[] = []
      if (deadlineRes?.ok) {
        const deadlineData = await deadlineRes.json()
        type AtRiskItem = { item_id: string; title: string; due_date: string; status: string; risk_level: 'high' | 'medium' }
        const atRisk: AtRiskItem[] = deadlineData.at_risk ?? []

        const highRisk = atRisk.filter(r => r.risk_level === 'high')
        const medRisk  = atRisk.filter(r => r.risk_level === 'medium')

        // Proactively message the user about newly detected high-risk items
        const newAlerts = highRisk.filter(r => !alertedItemIdsRef.current.has(r.item_id))
        if (newAlerts.length > 0) {
          newAlerts.forEach(r => alertedItemIdsRef.current.add(r.item_id))
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const msgs = newAlerts.map(r => {
            const due = new Date(r.due_date + 'T00:00:00')
            const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
            const dueLabel = diffDays < 0
              ? `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`
              : diffDays === 0 ? 'due today'
              : diffDays === 1 ? 'due tomorrow'
              : `due in ${diffDays} days`
            const statusLabel = r.status === 'not_started' ? 'not started yet'
              : r.status === 'stuck' ? 'stuck'
              : r.status === 'in_progress' ? 'still in progress'
              : r.status
            return `Hey, I noticed "${r.title}" is ${dueLabel} but it's ${statusLabel}. Want to talk about rescheduling or splitting it up?`
          })
          setProactiveMessages(msgs)
          setIsAssistantOpen(true)
        }

        if (highRisk.length > 0) {
          deadlineInsights.push({
            type: 'deadline_risk',
            severity: 'high',
            title: highRisk.length === 1
              ? `"${highRisk[0].title}" is overdue or due within 48h`
              : `${highRisk.length} tasks overdue or due within 48h`,
            description: highRisk.length === 1
              ? `Status: ${highRisk[0].status.replace('_', ' ')}. Due: ${highRisk[0].due_date}.`
              : 'These tasks are not started or stuck with approaching deadlines.',
            items: highRisk.map(r => r.item_id),
          })
        }
        if (medRisk.length > 0) {
          deadlineInsights.push({
            type: 'deadline_risk',
            severity: 'high',
            title: medRisk.length === 1
              ? `"${medRisk[0].title}" is in progress and due today`
              : `${medRisk.length} in-progress tasks are due today`,
            description: medRisk.length === 1
              ? 'This task is still in progress and due by end of day.'
              : 'These tasks are still in progress and due by end of day.',
            items: medRisk.map(r => r.item_id),
          })
        }
      }

      console.log('Insights:', [...newInsights, ...deadlineInsights])
      setInsights([...newInsights, ...deadlineInsights])
      setInsightsFetched(true)

      let newRecommendation: Recommendation | null = null
      if (isManual) {
        const recommendRes = await apiFetch('/api/recommend-next', {
          method: 'POST',
          body: JSON.stringify({ items }),
        })
        if (recommendRes.ok) {
          newRecommendation = await recommendRes.json()
          setRecommendation(newRecommendation)
          setRecommendationDismissed(false)
        }

        const parts: string[] = []
        if (!newRecommendation) parts.push('no task recommendation')
        const hasDuplicates = newInsights.some(i => i.type === 'duplicate')
        if (!hasDuplicates) parts.push('no duplicate tasks')
        const hasStale = newInsights.some(i => i.type === 'stale')
        if (!hasStale) parts.push('no stale tasks')

        if (parts.length > 0) {
          const msg = parts.map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p).join(' · ')
          setRefreshMessage(msg)
          clearTimeout(refreshMessageTimerRef.current)
          refreshMessageTimerRef.current = setTimeout(() => setRefreshMessage(null), 4000)
        } else {
          setRefreshMessage(null)
        }
      }
    } catch {
      setInsightsError(true)
    } finally {
      setIsInsightsLoading(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) return
    clearTimeout(insightsTimeoutRef.current)
    insightsTimeoutRef.current = setTimeout(fetchInsightsNow, 500)
    return () => clearTimeout(insightsTimeoutRef.current)
  }, [items])

  const showError = (message: string, onRetry?: () => void) => {
    setErrorToast({ message, onRetry })
    clearTimeout(errorToastTimerRef.current)
    errorToastTimerRef.current = setTimeout(() => setErrorToast(null), onRetry ? 8000 : 4000)
  }

  const fetchItems = async () => {
    const res = await apiFetch('/api/items')
    const data = await res.json()
    setItems(data)
  }

  const addItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await addItemWithStatus(text, 'not_started')
    setText('')
  }

  const addItemWithStatus = async (title: string, status: string) => {
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
  }

  const removeItem = async (id: string) => {
    const snapshot = items.slice()
    setItems(prev => prev.filter(t => t.id !== id))

    try {
      const res = await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete-failed')
    } catch {
      setItems(snapshot)
      showError('Failed to delete task')
    }
  }

  const patchItem = async (id: string, patch: Record<string, unknown>, fieldLabel: string) => {
    const snapshot = items.find(t => t.id === id)
    if (!snapshot) return

    setItems(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))

    try {
      const res = await apiFetch(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('patch-failed')
      const updated: Item = await res.json()
      setItems(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      setItems(prev => prev.map(t => t.id === id ? snapshot : t))
      showError(`Failed to update ${fieldLabel}`, () => patchItem(id, patch, fieldLabel))
    }
  }

  const updateItemStatus      = (id: string, status: string)            => patchItem(id, { status },      'task status')
  const updateItemPriority    = (id: string, priority: string)          => patchItem(id, { priority },    'priority')
  const updateItemDescription = (id: string, description: string|null)  => patchItem(id, { description }, 'description')
  const updateItemDueDate     = (id: string, due_date: string|null)     => patchItem(id, { due_date },    'due date')
  const updateItemAssignee    = (id: string, assignee: string|null)     => patchItem(id, { assignee },    'assignee')

  const resetImportState = () => {
    setImportText('')
    setImportFileName(null)
    setExtractedTasks([])
    setExtractError(null)
    setIsExtracting(false)
    setIsConfirming(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExts = ['.txt', '.pdf', '.docx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExts.includes(ext)) {
      setExtractError('Unsupported file type. Please upload a .txt, .pdf, or .docx file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setExtractError('File is too large. Maximum size is 5MB.')
      return
    }

    setExtractError(null)
    setIsExtracting(true)
    setImportFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiFetch('/api/extract-from-file', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to process file.')
        setImportFileName(null)
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
        setImportFileName(null)
      }
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
      setImportFileName(null)
    } finally {
      setIsExtracting(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  const closeImportModal = () => {
    setIsImportOpen(false)
    resetImportState()
  }

  const handleConfirmAll = async () => {
    setIsConfirming(true)
    try {
      const res = await apiFetch('/api/items/bulk', {
        method: 'POST',
        body: JSON.stringify({ tasks: extractedTasks }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to add tasks. Please try again.')
        return
      }
      const count = data.items.length
      setItems(prev => [...prev, ...data.items.map((item: Item) => ({ ...item, history: [] }))])
      closeImportModal()
      setImportSuccessMessage(`✓ Added ${count} task${count !== 1 ? 's' : ''} from imported text`)
      clearTimeout(importSuccessTimerRef.current)
      importSuccessTimerRef.current = setTimeout(() => setImportSuccessMessage(null), 3000)
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleExtractTasks = async () => {
    setIsExtracting(true)
    setExtractError(null)
    try {
      const res = await apiFetch('/api/extract-tasks', {
        method: 'POST',
        body: JSON.stringify({ text: importText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Something went wrong.')
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
      }
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  const updateItemColor = (id: string, color: string | null) => patchItem(id, { color }, 'color')

  const handleClearSample = async () => {
    await Promise.all(sampleIds.map(id => apiFetch(`/api/items/${id}`, { method: 'DELETE' })))
    localStorage.removeItem('flow-sample-ids')
    setItems(prev => prev.filter(t => !sampleIds.includes(t.id)))
    setSampleIds([])
  }

  const handleNegotiationDone = (message: string) => {
    fetchItems()
    if (negotiationItem) {
      setInsights(prev => prev.filter(ins => !ins.items.includes(negotiationItem.id)))
    }
    setToastMessage(message)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="board-indicator"></span>
          <span className="board-name" onClick={() => setView('board')}>Flow</span>
        </div>
        <form className="toolbar-center" onSubmit={addItem}>
          <svg className="toolbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a new task..."
            data-testid="todo-input"
          />
          <button type="submit">Add</button>
        </form>
        <div className="toolbar-right">
          <button className="ai-btn" onClick={() => { resetImportState(); setIsImportOpen(true) }} aria-label="Import Tasks" data-tooltip="Paste emails or meeting notes" data-tooltip-pos="below">
            <span>📋</span>
            Import Tasks
          </button>
          <button className="ai-btn" onClick={() => setIsAssistantOpen(!isAssistantOpen)} aria-label="AI Assistant" data-tooltip="Ask AI to manage your tasks" data-tooltip-pos="below">
            <span className="ai-sparkle">✨</span>
            AI Assistant
          </button>
          <button
            className={`view-btn${view === 'board' ? ' active' : ''}`}
            aria-label="Kanban view"
            onClick={() => setView('board')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" />
            </svg>
          </button>
          <button
            className={`view-btn${view === 'summary' ? ' active' : ''}`}
            aria-label="Summary view"
            onClick={() => setView('summary')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
          <button
            className="view-btn help-btn"
            aria-label="Help"
            onClick={() => setIsHelpOpen(true)}
            data-tooltip="Help & shortcuts"
            data-tooltip-pos="below"
          >
            ?
          </button>
          <button
            className="view-btn"
            aria-label="Sign out"
            data-tooltip={user?.email ?? 'Sign out'}
            data-tooltip-pos="below"
            onClick={signOut}
            style={{ fontSize: '0.8rem' }}
          >
            ↪
          </button>
        </div>
      </div>
      {sampleIds.length > 0 && (
        <div className="sample-banner">
          <span>This is sample data to help you explore.</span>
          <button onClick={handleClearSample}>Clear and start fresh →</button>
        </div>
      )}
      {view === 'summary' ? (
        <SummaryView />
      ) : (
        <>
          <NarrativeWidget onViewFullReport={() => setView('summary')} hasItems={items.length > 0} />
          {((!recommendationDismissed && recommendation) || visibleInsights.length > 0 || refreshMessage || insightsError || insightsFetched) && (
            <div className="insights-bar">
              {insightsFetched && !isInsightsLoading && visibleInsights.length === 0 && (!recommendation || recommendationDismissed) && !insightsError && !refreshMessage && (
                <div className="insights-clear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All clear — no issues detected
                </div>
              )}
              {insightsError && (
                <div className="insights-error-card">
                  <span>Couldn't load insights</span>
                  <button onClick={() => fetchInsightsNow(false)}>Try again</button>
                </div>
              )}
              {!recommendationDismissed && recommendation && (
                <SpotlightCard
                  recommendation={recommendation}
                  item={items.find(t => t.id === recommendation.recommendedItemId)}
                  onDismiss={() => setRecommendationDismissed(true)}
                  onStartWorking={handleStartWorking}
                />
              )}
              {visibleInsights.map((insight, i) => (
                <InsightCard key={i} insight={insight} onDismiss={() => dismissInsight(insight)} onAction={handleInsightAction} />
              ))}
              {refreshMessage && (
                <div className="insights-empty-message">{refreshMessage}</div>
              )}
              <button className="insights-refresh" onClick={() => fetchInsightsNow(true)} aria-label="Refresh insights" data-tooltip="Proactive suggestions from AI" disabled={isInsightsLoading}>
                {isInsightsLoading
                  ? <span className="modal-spinner modal-spinner-inline" style={{ marginRight: 0 }} />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                }
                {isInsightsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          )}
          {isBoardLoading ? (
            <div className="kanban-board">
              {STATUS_CONFIG.map(col => (
                <div key={col.key} className="kanban-column">
                  <div className="column-header">
                    <span className="column-dot" style={{ backgroundColor: col.color }} />
                    <span className="column-label">{col.label}</span>
                    <span className="skeleton skeleton-count" />
                  </div>
                  <div className="column-body">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="skeleton-card">
                        <div className="skeleton skeleton-line" style={{ width: `${72 - i * 10}%` }} />
                        <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '48%' }} />
                        <div className="skeleton skeleton-line skeleton-line-xs" style={{ width: '60%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : boardLoadError ? (
            <div className="board-error-state">
              <p>Couldn't load your tasks — check your connection.</p>
              <button onClick={init}>Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-board-state">
              <svg className="empty-board-illustration" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="18" width="54" height="96" rx="7" fill="#f5f3ff" stroke="#e4e0f9" strokeWidth="1.5"/>
                <rect x="16" y="26" width="38" height="7" rx="3.5" fill="#c4b5fd" opacity="0.7"/>
                <rect x="16" y="40" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="16" y="70" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="73" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
                <rect x="81" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
                <rect x="81" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
                <rect x="138" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
                <rect x="146" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
                <rect x="146" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
                <circle cx="35" cy="52" r="9" fill="#8B5CF6"/>
                <line x1="35" y1="47" x2="35" y2="57" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="30" y1="52" x2="40" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h3>No tasks yet</h3>
              <p>Create one above or import from email</p>
              <div className="empty-board-actions">
                <button className="empty-action-btn empty-action-primary" onClick={() => inputRef.current?.focus()}>
                  Add a task
                </button>
                <button className="empty-action-btn empty-action-secondary" onClick={() => { resetImportState(); setIsImportOpen(true) }}>
                  Import tasks
                </button>
              </div>
            </div>
          ) : (
            <KanbanBoard
              items={items}
              highlightedItems={highlightedItems}
              onAdd={addItemWithStatus}
              onDelete={removeItem}
              onUpdateStatus={updateItemStatus}
              onUpdatePriority={updateItemPriority}
              onUpdateDescription={updateItemDescription}
              onUpdateDueDate={updateItemDueDate}
              onUpdateAssignee={updateItemAssignee}
              onUpdateColor={updateItemColor}
              onNegotiate={setNegotiationItem}
            />
          )}
        </>
      )}
      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onRefresh={fetchItems}
        prefillMessage={prefillMessage}
        onPrefillConsumed={() => setPrefillMessage('')}
        proactiveMessages={proactiveMessages}
        onProactiveConsumed={() => setProactiveMessages([])}
      />
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
      {importSuccessMessage && <Toast>{importSuccessMessage}</Toast>}
      {toastMessage && <Toast>{toastMessage}</Toast>}
      {errorToast && (
        <Toast error>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errorToast.message}</span>
          {errorToast.onRetry && (
            <ToastRetryBtn onClick={() => { setErrorToast(null); errorToast.onRetry!() }}>
              Try again
            </ToastRetryBtn>
          )}
        </Toast>
      )}
      {negotiationItem && (
        <DeadlineNegotiationModal
          item={negotiationItem}
          onClose={() => setNegotiationItem(null)}
          onDone={handleNegotiationDone}
        />
      )}
      {isImportOpen && (
        <ModalOverlay onClick={() => { if (!isExtracting && !isConfirming) closeImportModal() }}>
          <ModalContainer wide={extractedTasks.length > 0} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>📋 Import Tasks</h2>
              <ModalClose onClick={closeImportModal} aria-label="Close" disabled={isExtracting || isConfirming}>&times;</ModalClose>
            </ModalHeader>

            {extractedTasks.length === 0 ? (
              <>
                <ModalBody>
                  <ModalHint>Paste your tasks below, or upload a file.</ModalHint>
                  <ModalTextarea
                    placeholder={'e.g.\n- Fix login bug\n- Update homepage banner\n- Write release notes'}
                    value={importText}
                    onChange={e => { setImportText(e.target.value); setExtractError(null) }}
                    autoFocus
                    disabled={isExtracting}
                  />
                  {extractError && <ExtractError>{extractError}</ExtractError>}
                  {isExtracting && (
                    <SpinnerRow>
                      <Spinner />
                      <SpinnerLabel>Analysing...</SpinnerLabel>
                    </SpinnerRow>
                  )}
                </ModalBody>
                <ModalFooter>
                  <FileBtnLabel aria-label="Upload file">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload file
                    <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} style={{ display: 'none' }} />
                  </FileBtnLabel>
                  <FileHint>.txt · .pdf · .docx · max 5MB</FileHint>
                  <CancelBtn onClick={closeImportModal} disabled={isExtracting}>Cancel</CancelBtn>
                  <ProcessBtn onClick={handleExtractTasks} disabled={!importText.trim() || isExtracting}>
                    {isExtracting ? 'Analysing...' : 'Process'}
                  </ProcessBtn>
                </ModalFooter>
              </>
            ) : (
              <>
                <ModalBody preview>
                  {importFileName && (
                    <FileSource>📄 Tasks from: <strong>{importFileName}</strong></FileSource>
                  )}
                  <PreviewCount>
                    {extractedTasks.length} task{extractedTasks.length !== 1 ? 's' : ''} found — edit or remove before adding
                  </PreviewCount>
                  <PreviewList>
                    {extractedTasks.map((task, i) => (
                      <TaskPreview
                        key={i}
                        task={task}
                        onChange={updated => setExtractedTasks(prev => prev.map((t, j) => j === i ? updated : t))}
                        onRemove={() => setExtractedTasks(prev => prev.filter((_, j) => j !== i))}
                      />
                    ))}
                  </PreviewList>
                  {extractError && <ExtractError>{extractError}</ExtractError>}
                </ModalBody>
                <ModalFooter>
                  <CancelBtn onClick={() => { setExtractedTasks([]); setExtractError(null) }} disabled={isConfirming}>Back</CancelBtn>
                  <ProcessBtn onClick={handleConfirmAll} disabled={isConfirming || extractedTasks.length === 0}>
                    {isConfirming ? <><Spinner inline /> Adding...</> : `Confirm All (${extractedTasks.length})`}
                  </ProcessBtn>
                </ModalFooter>
              </>
            )}
          </ModalContainer>
        </ModalOverlay>
      )}
    </div>
  )
}

export default App
