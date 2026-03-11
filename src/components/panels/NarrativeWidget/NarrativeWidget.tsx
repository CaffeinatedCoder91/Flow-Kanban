import React, { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { NarrativeWidgetProps } from './NarrativeWidget.types'
import { WidgetBadge, WidgetDot, SkeletonLineWide, SkeletonLineNarrow } from './NarrativeWidget.styles'

interface WidgetData {
  score: number
  sentiment: 'healthy' | 'at_risk' | 'critical'
  narrative: string
}

const SENTIMENT_COLOR: Record<WidgetData['sentiment'], string> = {
  healthy:  '#10B981',
  at_risk:  '#F59E0B',
  critical: '#EF4444',
}

const SENTIMENT_LABEL: Record<WidgetData['sentiment'], string> = {
  healthy:  'Healthy',
  at_risk:  'At Risk',
  critical: 'Critical',
}

export const NarrativeWidget = ({ onViewFullReport, hasItems }: NarrativeWidgetProps): React.ReactElement | null => {
  const [data, setData] = useState<WidgetData | null>(null)
  const [loading, setLoading] = useState(hasItems)

  useEffect(() => {
    if (!hasItems) return
    apiFetch('/api/narrative', {
      method: 'POST',
      body: JSON.stringify({ period: 'last_week' }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        if (json.momentum && json.narrative) {
          setData({
            score:     json.momentum.score,
            sentiment: json.momentum.sentiment,
            narrative: json.narrative,
          })
        }
      })
      .catch(() => {}) // non-critical widget — silently no-op on error
      .finally(() => setLoading(false))
  }, [hasItems])

  if (loading) return (
    <div className="narrative-widget narrative-widget-skeleton">
      <div className="skeleton skeleton-badge" />
      <div className="narrative-skeleton-lines">
        <SkeletonLineWide className="skeleton skeleton-line" />
        <SkeletonLineNarrow className="skeleton skeleton-line skeleton-line-sm" />
      </div>
    </div>
  )

  if (!data) return null

  const color = SENTIMENT_COLOR[data.sentiment]

  return (
    <div className="narrative-widget">
      <WidgetBadge className="narrative-widget-badge" accentColor={color}>
        <span className="narrative-widget-score">{data.score}</span>
        <WidgetDot className="narrative-widget-dot" accentColor={color} />
        <span className="narrative-widget-sentiment">{SENTIMENT_LABEL[data.sentiment]}</span>
      </WidgetBadge>
      <p className="narrative-widget-text">{data.narrative}</p>
      <button className="narrative-widget-link" onClick={onViewFullReport}>
        View full report
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}
