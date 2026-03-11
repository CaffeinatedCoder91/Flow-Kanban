import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { apiFetch } from '@/lib/api'
import { Item, Insight } from '@/types'

interface Recommendation {
  recommendedItemId: string
  reason: string
}

interface UseInsightsParams {
  items: Item[]
  showRefreshMessage: (message: string) => void
  clearRefreshMessage: () => void
  refreshMessage: string | null
  setIsAssistantOpen: (open: boolean) => void
  setPrefillMessage: (message: string) => void
  setProactiveMessages: (messages: string[]) => void
  setNegotiationItem: (item: Item | null) => void
  updateItemStatus: (id: string, status: string) => void
}

export function useInsights({
  items,
  showRefreshMessage,
  clearRefreshMessage,
  refreshMessage,
  setIsAssistantOpen,
  setPrefillMessage,
  setProactiveMessages,
  setNegotiationItem,
  updateItemStatus,
}: UseInsightsParams) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [recommendationDismissed, setRecommendationDismissed] = useState(false)
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set())
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState(false)
  const [insightsFetched, setInsightsFetched] = useState(false)
  const [allClearDismissed, setAllClearDismissed] = useState(false)
  const alertedItemIdsRef = useRef<Set<string>>(new Set())
  const insightsTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const allClearTimerRef = useRef<ReturnType<typeof setTimeout>>()

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

  const dismissInsight = useCallback((insight: Insight) => {
    const key = getInsightKey(insight)
    setDismissedKeys(prev => {
      const next = new Set(prev)
      next.add(key)
      localStorage.setItem('dismissed-insights', JSON.stringify([...next]))
      return next
    })
  }, [])

  const visibleInsights = useMemo(() => insights.filter(i => !dismissedKeys.has(getInsightKey(i))), [insights, dismissedKeys])

  const handleStartWorking = useCallback(async (id: string) => {
    const item = items.find(t => t.id === id)
    if (item && item.status !== 'in_progress') {
      await updateItemStatus(id, 'in_progress')
    }
    setTimeout(() => {
      const el = document.querySelector(`[data-item-id="${id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    setRecommendationDismissed(true)
  }, [items, updateItemStatus])

  const handleInsightAction = useCallback((insight: Insight) => {
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
      const firstId = insight.items[0]
      const el = document.querySelector(`[data-item-id="${firstId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setHighlightedItems(new Set()), 3000)
    }
  }, [items, setPrefillMessage, setIsAssistantOpen, setNegotiationItem])

  const fetchInsightsNow = useCallback(async (isManual = false) => {
    if (items.length === 0) return
    setInsightsError(false)
    setIsInsightsLoading(true)
    try {
      const [insightsRes, deadlineRes] = await Promise.all([
        apiFetch('/api/insights', { method: 'POST' }),
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

      setInsights([...newInsights, ...deadlineInsights])
      setInsightsFetched(true)
      setAllClearDismissed(false)

      let newRecommendation: Recommendation | null = null
      if (isManual) {
        const recommendRes = await apiFetch('/api/recommend-next', { method: 'POST' })
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
          showRefreshMessage(msg)
        } else {
          clearRefreshMessage()
        }
      }
    } catch {
      setInsightsError(true)
    } finally {
      setIsInsightsLoading(false)
    }
  }, [items, showRefreshMessage, clearRefreshMessage, setIsAssistantOpen, setProactiveMessages])

  // Debounced insights fetch when items change
  useEffect(() => {
    if (items.length === 0) return
    clearTimeout(insightsTimeoutRef.current)
    insightsTimeoutRef.current = setTimeout(fetchInsightsNow, 500)
    return () => clearTimeout(insightsTimeoutRef.current)
  }, [items])

  // Auto-dismiss "all clear" after 5 seconds
  const isAllClear = insightsFetched && !isInsightsLoading && visibleInsights.length === 0
    && (!recommendation || recommendationDismissed) && !insightsError && !refreshMessage && !allClearDismissed

  useEffect(() => {
    if (!isAllClear) { clearTimeout(allClearTimerRef.current); return }
    allClearTimerRef.current = setTimeout(() => setAllClearDismissed(true), 5000)
    return () => clearTimeout(allClearTimerRef.current)
  }, [isAllClear])

  return {
    insights,
    setInsights,
    visibleInsights,
    recommendation,
    recommendationDismissed,
    setRecommendationDismissed,
    highlightedItems,
    isInsightsLoading,
    insightsError,
    isAllClear,
    allClearDismissed,
    setAllClearDismissed,
    dismissInsight,
    handleInsightAction,
    handleStartWorking,
    fetchInsightsNow,
  }
}
