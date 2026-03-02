import { useState, useEffect } from 'react'
import type { NarrativeWidgetProps } from './NarrativeWidget.types'

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

export default function NarrativeWidget({ onViewFullReport }: NarrativeWidgetProps) {
  const [data, setData] = useState<WidgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }, [])

  if (loading) return (
    <div className="narrative-widget narrative-widget-skeleton">
      <div className="skeleton skeleton-badge" />
      <div className="narrative-skeleton-lines">
        <div className="skeleton skeleton-line" style={{ width: '82%' }} />
        <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '55%' }} />
      </div>
    </div>
  )

  if (!data) return null

  const color = SENTIMENT_COLOR[data.sentiment]

  return (
    <div className="narrative-widget">
      <div className="narrative-widget-badge" style={{ background: color + '18', color }}>
        <span className="narrative-widget-score">{data.score}</span>
        <span className="narrative-widget-dot" style={{ background: color }} />
        <span className="narrative-widget-sentiment">{SENTIMENT_LABEL[data.sentiment]}</span>
      </div>
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
