import React, { useState, FormEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ColumnProps } from './Column.types'
import { TaskCard } from '../TaskCard'
import { ColumnDot } from './Column.styles'

export const Column = React.memo(({
  statusKey, label, color, items, highlightedItems, onAdd, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate
}: ColumnProps): React.ReactElement => {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: statusKey })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setIsSubmitting(true)
    try {
      await onAdd(text, statusKey)
      setText('')
      setAdding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`kanban-column${isOver ? ' column-over' : ''}`}>
      <div className="column-header">
        <ColumnDot className="column-dot" accentColor={color} />
        <span className="column-label">{label}</span>
        <span className="column-count">{items.length}</span>
      </div>
      <div className="column-body" ref={setNodeRef}>
        <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <TaskCard
              key={item.id}
              item={item}
              columnColor={color}
              highlighted={highlightedItems.has(item.id)}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onUpdatePriority={onUpdatePriority}
              onUpdateDescription={onUpdateDescription}
              onUpdateDueDate={onUpdateDueDate}
              onUpdateAssignee={onUpdateAssignee}
              onUpdateColor={onUpdateColor}
              onNegotiate={onNegotiate}
            />
          ))}
        </SortableContext>
        {items.length === 0 && !adding && (
          <div className="column-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3"/>
            </svg>
            <span>
              {statusKey === 'not_started' && 'Nothing queued yet'}
              {statusKey === 'in_progress' && 'Nothing in progress'}
              {statusKey === 'done' && 'No completed tasks yet'}
              {statusKey === 'stuck' && 'Nothing blocked — nice!'}
            </span>
          </div>
        )}
        {adding ? (
          <form className="inline-add-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Task name..."
              autoFocus
            />
            <div className="inline-add-actions">
              <button type="submit" disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? <span className="modal-spinner modal-spinner-inline" /> : null}
                {isSubmitting ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => { setAdding(false); setText('') }} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="add-task-btn" onClick={() => setAdding(true)}>
            + Add task
          </button>
        )}
      </div>
    </div>
  )
})

Column.displayName = 'Column'
