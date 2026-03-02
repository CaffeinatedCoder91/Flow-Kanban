import { Insight } from '../../../types'

export interface InsightCardProps {
  insight: Insight
  onDismiss: () => void
  onAction: (insight: Insight) => void
}
