import { Item } from '../../../types'

export interface ColumnProps {
  statusKey: string
  label: string
  color: string
  items: Item[]
  highlightedItems: Set<number>
  onAdd: (title: string, status: string) => Promise<void>
  onDelete: (id: number) => void
  onUpdateStatus: (id: number, status: string) => void
  onUpdatePriority: (id: number, priority: string) => void
  onUpdateDescription: (id: number, description: string | null) => void
  onUpdateDueDate: (id: number, due_date: string | null) => void
  onUpdateAssignee: (id: number, assignee: string | null) => void
  onUpdateColor: (id: number, color: string | null) => void
  onNegotiate?: (item: Item) => void
}
