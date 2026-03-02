import { Item } from './types'

interface Recommendation {
  recommendedItemId: number
  reason: string
}

interface SpotlightCardProps {
  recommendation: Recommendation
  item: Item | undefined
  onDismiss: () => void
  onStartWorking: (id: number) => void
}

export default function SpotlightCard({ recommendation, item, onDismiss, onStartWorking }: SpotlightCardProps) {
  const scrollToItem = () => {
    const el = document.querySelector(`[data-item-id="${recommendation.recommendedItemId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="spotlight-card">
      <span className="insight-icon">⭐</span>
      <div className="insight-content">
        <span className="insight-title">Recommended next task</span>
        <button className="spotlight-task-link" onClick={scrollToItem}>
          {item?.title ?? `Task #${recommendation.recommendedItemId}`}
        </button>
        <span className="insight-description">{recommendation.reason}</span>
        <button className="spotlight-start-btn" onClick={() => onStartWorking(recommendation.recommendedItemId)}>
          Start working
        </button>
      </div>
      <button className="insight-dismiss" onClick={onDismiss} aria-label="Dismiss">&times;</button>
    </div>
  )
}
