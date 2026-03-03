import { useState, useEffect } from 'react'
import { apiFetch } from '../../../lib/api'

type Period = 'last_week' | 'last_30_days' | 'this_month'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'last_week',    label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month',   label: 'This month' },
]

interface Momentum {
  score: number
  reasoning: string
  sentiment: 'healthy' | 'at_risk' | 'critical'
}

interface NarrativeData {
  period: string
  summary: {
    tasks_created: number
    tasks_completed: number
    tasks_stuck: number
    tasks_unblocked: number
    priority_changes: number
  }
  narrative: string
  momentum: Momentum | null
}

const RADIUS = 58
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function sentimentColor(sentiment: Momentum['sentiment']): string {
  if (sentiment === 'healthy')  return '#10B981'
  if (sentiment === 'at_risk')  return '#F59E0B'
  return '#EF4444'
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - score / 100)
  return (
    <svg className="summary-ring" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
      {/* Track */}
      <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="13" />
      {/* Progress */}
      <circle
        cx="80" cy="80" r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Score number */}
      <text
        x="80" y="76"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="32"
        fontWeight="700"
        fill={color}
        fontFamily="inherit"
      >
        {score}
      </text>
      <text
        x="80" y="104"
        textAnchor="middle"
        fontSize="11"
        fill="#9ca3af"
        fontFamily="inherit"
        letterSpacing="1"
      >
        / 100
      </text>
    </svg>
  )
}

export default function SummaryView() {
  const [period, setPeriod] = useState<Period>('last_week')
  const [data, setData] = useState<NarrativeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prevMomentum, setPrevMomentum] = useState<Momentum | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    setPrevMomentum(null)

    const fetchNarrative = (p: string): Promise<NarrativeData> =>
      apiFetch('/api/narrative', {
        method: 'POST',
        body: JSON.stringify({ period: p }),
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })

    const prevFetch: Promise<NarrativeData | null> = period === 'last_week'
      ? fetchNarrative('previous_7_days').catch(() => null)
      : Promise.resolve(null)

    Promise.all([fetchNarrative(period), prevFetch])
      .then(([current, prev]) => {
        if (!cancelled) {
          setData(current)
          setPrevMomentum(prev?.momentum ?? null)
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) { setError('Failed to load summary. Is the server running?'); setLoading(false) } })

    return () => { cancelled = true }
  }, [period])

  const momentum = data?.momentum
  const color = momentum ? sentimentColor(momentum.sentiment) : '#8B5CF6'
  const sentimentLabel = momentum?.sentiment === 'healthy' ? 'Healthy'
    : momentum?.sentiment === 'at_risk' ? 'At Risk'
    : momentum?.sentiment === 'critical' ? 'Critical'
    : null

  const trendDelta = (momentum && prevMomentum) ? Math.round(momentum.score - prevMomentum.score) : null
  const trendArrow = trendDelta === null ? null : trendDelta > 3 ? '↗' : trendDelta < -3 ? '↘' : '→'
  const trendColor = trendArrow === '↗' ? '#10B981' : trendArrow === '↘' ? '#EF4444' : '#9ca3af'
  const trendLabel = trendDelta === null ? null
    : trendDelta === 0 ? 'same as last week'
    : `${trendDelta > 0 ? '+' : ''}${trendDelta} from last week`

  return (
    <div className="summary-view">

      {/* Period selector */}
      <div className="summary-period-bar">
        <span className="summary-period-label">Period</span>
        <div className="summary-period-tabs">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`summary-period-btn${period === opt.value ? ' active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="summary-loading">
          <span className="modal-spinner" />
          <span>Generating summary…</span>
        </div>
      )}

      {/* Error */}
      {error && <div className="summary-error">{error}</div>}

      {/* Main content */}
      {!loading && data && (
        <div className="summary-content">

          {/* ── Left: Momentum score ── */}
          <div className="summary-card summary-score-card">
            <h2 className="summary-card-title">Momentum</h2>

            {momentum ? (
              <>
                <div className="summary-ring-wrapper">
                  <ScoreRing score={momentum.score} color={color} />
                </div>
                <div className="summary-sentiment-chip" style={{ background: color + '22', color }}>
                  <span className="summary-sentiment-dot" style={{ background: color }} />
                  {sentimentLabel}
                </div>
                {trendArrow && (
                  <div className="summary-trend" style={{ color: trendColor }}>
                    <span className="summary-trend-arrow">{trendArrow}</span>
                    <span className="summary-trend-label">{trendLabel}</span>
                  </div>
                )}
                <p className="summary-reasoning">{momentum.reasoning}</p>
              </>
            ) : (
              <div className="summary-no-momentum">
                <svg className="summary-ring" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                  <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="13" strokeDasharray="6 6" />
                  <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fontSize="28" fill="#9ca3af" fontFamily="inherit">—</text>
                </svg>
                <p className="summary-reasoning" style={{ color: '#9ca3af' }}>Score unavailable</p>
              </div>
            )}
          </div>

          {/* ── Right: Narrative + stats ── */}
          <div className="summary-card summary-narrative-card">
            <h2 className="summary-card-title">What happened</h2>

            {data.narrative ? (
              <p className="summary-narrative-text">{data.narrative}</p>
            ) : (
              <p className="summary-narrative-empty">No activity recorded in this period.</p>
            )}

            {/* Quick stats */}
            <div className="summary-stats">
              <Stat value={data.summary.tasks_created}   label="created"   />
              <Stat value={data.summary.tasks_completed} label="completed" color="#10B981" />
              <Stat value={data.summary.tasks_stuck}     label="stuck"     color="#F59E0B" />
              <Stat value={data.summary.tasks_unblocked} label="unblocked" color="#3B82F6" />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="summary-stat">
      <span className="summary-stat-value" style={color ? { color } : undefined}>{value}</span>
      <span className="summary-stat-label">{label}</span>
    </div>
  )
}
