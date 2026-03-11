import { Item } from '@/types'
import { STATUS_CONFIG } from '@/types'
import { ColumnDot, SkeletonLineVar } from '@/App.styles'
import { KanbanBoard } from './KanbanBoard'

interface BoardViewProps {
  hasFetchedBoard: boolean
  isBoardLoading: boolean
  boardLoadError: boolean
  items: Item[]
  onRetry: () => void
  highlightedItems: Set<string>
  onAdd: (title: string, status: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdatePriority: (id: string, priority: string) => void
  onUpdateDescription: (id: string, description: string) => void
  onUpdateDueDate: (id: string, date: string | null) => void
  onUpdateAssignee: (id: string, assignee: string | null) => void
  onUpdateColor: (id: string, color: string | null) => void
  onNegotiate: (item: Item) => void
  onOpenImport: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

export function BoardView({
  hasFetchedBoard, isBoardLoading, boardLoadError, items, onRetry,
  highlightedItems,
  onAdd, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription,
  onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate,
  onOpenImport, inputRef,
}: BoardViewProps) {
  if (!hasFetchedBoard && !isBoardLoading) {
    return <div className="kanban-board" />
  }

  if (isBoardLoading) {
    return (
      <div className="kanban-board">
        {STATUS_CONFIG.map(col => (
          <div key={col.key} className="kanban-column">
            <div className="column-header">
              <ColumnDot className="column-dot" accentColor={col.color} />
              <span className="column-label">{col.label}</span>
              <span className="skeleton skeleton-count" />
            </div>
            <div className="column-body">
              {[0, 1, 2].map(i => (
                <div key={i} className="skeleton-card">
                  <SkeletonLineVar className="skeleton skeleton-line" $width={`${72 - i * 10}%`} />
                  <SkeletonLineVar className="skeleton skeleton-line skeleton-line-sm" $width="48%" />
                  <SkeletonLineVar className="skeleton skeleton-line skeleton-line-xs" $width="60%" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (boardLoadError) {
    return (
      <div className="board-error-state">
        <p>Couldn't load your tasks — check your connection.</p>
        <button onClick={onRetry}>Try again</button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-board-state">
        <svg className="empty-board-illustration" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="18" width="54" height="96" rx="7" fill="#f5f3ff" stroke="#e4e0f9" strokeWidth="1.5"/>
          <rect x="16" y="26" width="38" height="7" rx="3.5" fill="#c4b5fd" opacity="0.7"/>
          <rect x="16" y="40" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
          <rect x="16" y="70" width="38" height="24" rx="5" fill="white" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="4 3"/>
          <rect x="73" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
          <rect x="81" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
          <rect x="81" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
          <rect x="138" y="18" width="54" height="96" rx="7" fill="#f8f9fc" stroke="#e6e9ef" strokeWidth="1.5"/>
          <rect x="146" y="26" width="38" height="7" rx="3.5" fill="#d1d5e0" opacity="0.7"/>
          <rect x="146" y="40" width="38" height="24" rx="5" fill="white" stroke="#e6e9ef" strokeWidth="1.5" strokeDasharray="4 3"/>
          <circle cx="35" cy="52" r="9" fill="#8B5CF6"/>
          <line x1="35" y1="47" x2="35" y2="57" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="30" y1="52" x2="40" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <h3>Your board is empty</h3>
        <p>Add your first task above, or import from email, notes, or a doc.</p>
        <div className="empty-board-actions">
          <button className="empty-action-btn empty-action-primary" onClick={() => inputRef.current?.focus()}>
            Add a task
          </button>
          <button className="empty-action-btn empty-action-secondary" onClick={onOpenImport}>
            Import tasks
          </button>
        </div>
      </div>
    )
  }

  return (
    <KanbanBoard
      items={items}
      highlightedItems={highlightedItems}
      onAdd={onAdd}
      onDelete={onDelete}
      onUpdateStatus={onUpdateStatus}
      onUpdatePriority={onUpdatePriority}
      onUpdateDescription={onUpdateDescription}
      onUpdateDueDate={onUpdateDueDate}
      onUpdateAssignee={onUpdateAssignee}
      onUpdateColor={onUpdateColor}
      onNegotiate={onNegotiate}
    />
  )
}
