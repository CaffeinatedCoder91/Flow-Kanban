import { Item } from '../../../types'

export interface ImportModalProps {
  onClose: () => void
  onImported: (items: Item[]) => void
}
