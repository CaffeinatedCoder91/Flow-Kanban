import { Item, Insight } from '@/types'
import { InsightCard } from './InsightCard'
import { SpotlightCard } from './SpotlightCard'
import { NoMarginSpinner } from '@/App.styles'

interface Recommendation {
  recommendedItemId: string
  reason: string
}

interface InsightsBarProps {
  isAllClear: boolean
  onDismissAllClear: () => void
  insightsError: boolean
  onRetryInsights: () => void
  recommendation: Recommendation | null
  recommendationDismissed: boolean
  onDismissRecommendation: () => void
  onStartWorking: (id: string) => void
  visibleInsights: Insight[]
  onDismissInsight: (insight: Insight) => void
  onInsightAction: (insight: Insight) => void
  isInsightsLoading: boolean
  onRefresh: () => void
  refreshMessage: string | null
  items: Item[]
}

export function InsightsBar({
  isAllClear, onDismissAllClear,
  insightsError, onRetryInsights,
  recommendation, recommendationDismissed, onDismissRecommendation, onStartWorking,
  visibleInsights, onDismissInsight, onInsightAction,
  isInsightsLoading, onRefresh,
  refreshMessage,
  items,
}: InsightsBarProps) {
  const hasContent =
    (!recommendationDismissed && recommendation) ||
    visibleInsights.length > 0 ||
    refreshMessage ||
    insightsError ||
    isAllClear

  if (!hasContent) return null

  return (
    <div className="insights-bar">
      {isAllClear && (
        <div className="insights-clear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          All clear — no issues detected
          <button className="insights-clear-dismiss" onClick={onDismissAllClear} aria-label="Dismiss">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      {insightsError && (
        <div className="insights-error-card">
          <span>Couldn't load insights</span>
          <button onClick={onRetryInsights}>Try again</button>
        </div>
      )}
      {!recommendationDismissed && recommendation && (
        <SpotlightCard
          recommendation={recommendation}
          item={items.find(t => t.id === recommendation.recommendedItemId)}
          onDismiss={onDismissRecommendation}
          onStartWorking={onStartWorking}
        />
      )}
      {visibleInsights.map((insight, i) => (
        <InsightCard
          key={i}
          insight={insight}
          onDismiss={() => onDismissInsight(insight)}
          onAction={onInsightAction}
        />
      ))}
      {refreshMessage && (
        <div className="insights-empty-message">{refreshMessage}</div>
      )}
      <button
        className="insights-refresh"
        onClick={onRefresh}
        aria-label="Refresh insights"
        data-tooltip="Proactive suggestions from AI"
        disabled={isInsightsLoading}
      >
        {isInsightsLoading
          ? <NoMarginSpinner className="modal-spinner modal-spinner-inline" />
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
        }
        {isInsightsLoading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}
