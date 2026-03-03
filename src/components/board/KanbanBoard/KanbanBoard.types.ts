import { Item } from '../../../types'

export interface KanbanBoardProps {
  items: Item[]
  highlightedItems: Set<string>
  onAdd: (title: string, status: string) => Promise<void>
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdatePriority: (id: string, priority: string) => void
  onUpdateDescription: (id: string, description: string | null) => void
  onUpdateDueDate: (id: string, due_date: string | null) => void
  onUpdateAssignee: (id: string, assignee: string | null) => void
  onUpdateColor: (id: string, color: string | null) => void
  onNegotiate?: (item: Item) => void
}
