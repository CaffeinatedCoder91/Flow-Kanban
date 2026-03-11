import { Item } from '@/types'

export interface Recommendation {
  recommendedItemId: string
  reason: string
}

export interface SpotlightCardProps {
  recommendation: Recommendation
  item: Item | undefined
  onDismiss: () => void
  onStartWorking: (id: string) => void
}
