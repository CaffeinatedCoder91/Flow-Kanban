import { forwardRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Item, STATUS_CONFIG, PRIORITY_CONFIG } from './types'

interface KanbanCardProps {
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

const COLOR_PALETTE = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
]

type DueDateUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'next-week' | 'neutral'

function dueDateDisplay(dateStr: string | null): { text: string; urgency: DueDateUrgency } | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    return { text: `Overdue by ${n} day${n === 1 ? '' : 's'}`, urgency: 'overdue' }
  }
  if (diffDays === 0) return { text: 'Due today', urgency: 'today' }
  if (diffDays === 1) return { text: 'Due tomorrow', urgency: 'tomorrow' }
  if (diffDays < 7) return { text: `Due in ${diffDays} days`, urgency: 'soon' }
  if (diffDays < 14) return { text: 'Due next week', urgency: 'next-week' }
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { text: `Due ${label}`, urgency: 'neutral' }
}

const KanbanCardInner = forwardRef<HTMLDivElement, KanbanCardProps & {
  style?: React.CSSProperties
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
  isDragging?: boolean
}>(({ item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate, style, listeners, attributes, isDragging, isDragOverlay }, ref) => {
  const accentColor = columnColor || '#8B5CF6'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.description || '')
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(item.assignee || '')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null
    onUpdateDueDate(item.id, value)
  }

  const dueInfo = dueDateDisplay(item.due_date)
  const showNegotiate = !!item.due_date && item.status !== 'done'

  const handleAssigneeBlur = () => {
    setEditingAssignee(false)
    const trimmed = assigneeDraft.trim()
    const newValue = trimmed || null
    if (newValue !== (item.assignee || null)) {
      onUpdateAssignee(item.id, newValue)
    }
  }

  const handleAssigneeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleAssigneeBlur()
    }
  }

  const handleColorSelect = (color: string) => {
    onUpdateColor(item.id, color)
    setShowColorPicker(false)
  }

  const handleColorClear = () => {
    onUpdateColor(item.id, null)
    setShowColorPicker(false)
  }

  const handleBlur = () => {
    setEditing(false)
    const trimmed = draft.trim()
    const newValue = trimmed || null
    if (newValue !== (item.description || null)) {
      onUpdateDescription(item.id, newValue)
    }
  }

  return (
    <div
      ref={ref}
      data-item-id={item.id}
      className={`kanban-card${isDragging ? ' dragging' : ''}${isDragOverlay ? ' drag-overlay' : ''}${highlighted ? ' highlighted' : ''}${item.status === 'done' ? ' card-done' : ''}`}
      style={{ ...style, borderLeftColor: accentColor }}
      {...attributes}
      {...listeners}
    >
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-color-tag" onPointerDown={e => e.stopPropagation()}>
            <button
              className="card-color-circle"
              style={{ backgroundColor: item.color || '#E5E7EB' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Change color"
            />
            {showColorPicker && (
              <div className="card-color-picker">
                <div className="card-color-picker-grid">
                  {COLOR_PALETTE.map(({ name, value }) => (
                    <button
                      key={value}
                      className="card-color-option"
                      style={{ backgroundColor: value }}
                      onClick={() => handleColorSelect(value)}
                      aria-label={name}
                      title={name}
                    />
                  ))}
                </div>
                {item.color && (
                  <button className="card-color-clear" onClick={handleColorClear}>
                    Clear color
                  </button>
                )}
              </div>
            )}
          </div>
          {item.status === 'done' && (
            <svg className="card-done-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span className="card-text">{item.title}</span>
        </div>
        <button
          className="card-delete"
          onClick={() => onDelete(item.id)}
          data-testid={`delete-${item.id}`}
          aria-label="Delete"
          onPointerDown={e => e.stopPropagation()}
        >
          &times;
        </button>
      </div>
      {editing ? (
        <textarea
          className="card-description-edit"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add description..."
          autoFocus
          rows={3}
          onPointerDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        />
      ) : (
        <div
          className={`card-description${item.description ? '' : ' card-description-empty'}`}
          onClick={() => { setDraft(item.description || ''); setEditing(true) }}
          onPointerDown={e => e.stopPropagation()}
        >
          {item.description || 'Add description...'}
        </div>
      )}
      <div className="card-meta" onPointerDown={e => e.stopPropagation()}>
        <div className="card-due-date-wrapper">
          <label className="card-due-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className={`card-due-date-text${!item.due_date ? ' card-due-date-empty' : dueInfo ? ` card-due-date-${dueInfo.urgency}` : ''}`}>
              {dueInfo ? dueInfo.text : 'Set due date'}
            </span>
            <input
              type="date"
              value={item.due_date || ''}
              onChange={handleDueDateChange}
              className="card-due-date-input"
              onKeyDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            />
          </label>
          {showNegotiate && (
            <button
              className="card-negotiate-btn"
              onClick={e => { e.stopPropagation(); onNegotiate?.(item) }}
              onPointerDown={e => e.stopPropagation()}
              aria-label="Negotiate deadline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
        </div>
        {editingAssignee ? (
          <input
            type="text"
            value={assigneeDraft}
            onChange={e => setAssigneeDraft(e.target.value)}
            onBlur={handleAssigneeBlur}
            placeholder="Assign to..."
            className="card-assignee-input"
            autoFocus
            onPointerDown={e => e.stopPropagation()}
            onKeyDown={handleAssigneeKeyDown}
          />
        ) : (
          <div
            className="card-assignee"
            onClick={() => { setAssigneeDraft(item.assignee || ''); setEditingAssignee(true) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className={`card-assignee-text${item.assignee ? '' : ' card-assignee-empty'}`}>
              {item.assignee || 'Assign'}
            </span>
          </div>
        )}
      </div>
      <div className="card-footer">
        <select
          className={`priority-select priority-${item.priority}`}
          value={item.priority}
          onChange={e => onUpdatePriority(item.id, e.target.value)}
          aria-label="Change priority"
          onPointerDown={e => e.stopPropagation()}
        >
          {PRIORITY_CONFIG.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <select
          className="status-select"
          value={item.status}
          onChange={e => onUpdateStatus(item.id, e.target.value)}
          aria-label="Change status"
          onPointerDown={e => e.stopPropagation()}
        >
          {STATUS_CONFIG.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
})

KanbanCardInner.displayName = 'KanbanCardInner'

export function DragOverlayCard(props: KanbanCardProps) {
  return <KanbanCardInner {...props} isDragOverlay />
}

export default function KanbanCard({ item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <KanbanCardInner
      ref={setNodeRef}
      item={item}
      columnColor={columnColor}
      highlighted={highlighted}
      onDelete={onDelete}
      onUpdateStatus={onUpdateStatus}
      onUpdatePriority={onUpdatePriority}
      onUpdateDescription={onUpdateDescription}
      onUpdateDueDate={onUpdateDueDate}
      onUpdateAssignee={onUpdateAssignee}
      onUpdateColor={onUpdateColor}
      onNegotiate={onNegotiate}
      style={style}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
    />
  )
}
