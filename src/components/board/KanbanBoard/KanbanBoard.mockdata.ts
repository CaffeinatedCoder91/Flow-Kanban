import { Item } from '../../../types'
import { KanbanBoardProps } from './KanbanBoard.types'

export const mockItems: Item[] = [
  { id: 1, title: 'Not started task', description: null, status: 'not_started', priority: 'medium',   color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 2, title: 'In progress task', description: null, status: 'in_progress', priority: 'high',     color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 3, title: 'Done task',        description: null, status: 'done',        priority: 'low',      color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 4, title: 'Stuck task',       description: null, status: 'stuck',       priority: 'critical', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
]

const noop = () => {}

export const defaultBoardProps: KanbanBoardProps = {
  items: mockItems,
  highlightedItems: new Set(),
  onAdd: () => Promise.resolve(),
  onDelete: noop,
  onUpdateStatus: noop,
  onUpdatePriority: noop,
  onUpdateDescription: noop,
  onUpdateDueDate: noop,
  onUpdateAssignee: noop,
  onUpdateColor: noop,
}
