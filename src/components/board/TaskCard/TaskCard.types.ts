import { Item } from '@/types'

export type DueDateUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'next-week' | 'neutral'

export interface TaskCardProps {
  item: Item
  columnColor?: string
  highlighted?: boolean
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdatePriority: (id: string, priority: string) => void
  onUpdateDescription: (id: string, description: string | null) => void
  onUpdateDueDate: (id: string, due_date: string | null) => void
  onUpdateAssignee: (id: string, assignee: string | null) => void
  onUpdateColor: (id: string, color: string | null) => void
  onNegotiate?: (item: Item) => void
  isDragOverlay?: boolean
}
