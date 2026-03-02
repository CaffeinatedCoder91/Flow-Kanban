import { Insight } from './types'

const TYPE_ICONS: Record<Insight['type'], string> = {
  stale: '⚠️',
  bottleneck: '🚧',
  duplicate: '🔄',
  priority_inflation: '⚡',
  deadline_cluster: '📅',
  deadline_risk: '⏰',
}

interface InsightCardProps {
  insight: Insight
  onDismiss: () => void
  onAction: (insight: Insight) => void
}

function InsightCard({ insight, onDismiss, onAction }: InsightCardProps) {
  const actionLabel = insight.type === 'duplicate'     ? 'Ask AI'
    : insight.type === 'deadline_risk' ? 'Resolve'
    : 'View tasks'

  return (
    <div className={`insight-card insight-severity-${insight.severity}`}>
      <span className="insight-icon">{TYPE_ICONS[insight.type]}</span>
      <div className="insight-content">
        <span className="insight-title">{insight.title}</span>
        <span className="insight-description">{insight.description}</span>
        <button className="insight-action" onClick={() => onAction(insight)}>
          {actionLabel}
        </button>
      </div>
      <button className="insight-dismiss" onClick={onDismiss} aria-label="Dismiss insight">&times;</button>
    </div>
  )
}

export default InsightCard
