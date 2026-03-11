import { Item } from '@/types'

export interface DeadlineNegotiationModalProps {
  item: Item
  onClose: () => void
  onDone: (message: string) => void
}
