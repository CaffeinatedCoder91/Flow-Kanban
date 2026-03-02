import { Item } from '../../../types'

export interface Recommendation {
  recommendedItemId: number
  reason: string
}

export interface SpotlightCardProps {
  recommendation: Recommendation
  item: Item | undefined
  onDismiss: () => void
  onStartWorking: (id: number) => void
}
