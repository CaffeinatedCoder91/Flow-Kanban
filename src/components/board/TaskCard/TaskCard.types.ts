import { Item } from '../../../types'

export type DueDateUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'next-week' | 'neutral'

export interface TaskCardProps {
  item: Item
  columnColor?: string
  highlighted?: boolean
  onDelete: (id: number) => void
  onUpdateStatus: (id: number, status: string) => void
  onUpdatePriority: (id: number, priority: string) => void
  onUpdateDescription: (id: number, description: string | null) => void
  onUpdateDueDate: (id: number, due_date: string | null) => void
  onUpdateAssignee: (id: number, assignee: string | null) => void
  onUpdateColor: (id: number, color: string | null) => void
  onNegotiate?: (item: Item) => void
  isDragOverlay?: boolean
}
