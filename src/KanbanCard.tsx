import { forwardRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import styled from '@emotion/styled'
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
  { name: 'Red',    value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green',  value: '#10B981' },
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink',   value: '#EC4899' },
  { name: 'Gray',   value: '#6B7280' },
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
  if (diffDays < 7)  return { text: `Due in ${diffDays} days`, urgency: 'soon' }
  if (diffDays < 14) return { text: 'Due next week', urgency: 'next-week' }
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { text: `Due ${label}`, urgency: 'neutral' }
}

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { color: #dc3545; }
`

const Card = styled.div<{
  accentColor: string
  isDragging?: boolean
  isDragOverlay?: boolean
  highlighted?: boolean
}>`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-left: 3px solid ${p => p.accentColor};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[3]};
  cursor: ${p => (p.isDragOverlay ? 'grabbing' : 'grab')};
  touch-action: none;
  transition: box-shadow 0.15s, transform 0.15s;
  opacity: ${p => (p.isDragging ? 0.3 : 1)};

  ${p => p.isDragOverlay && `box-shadow: ${p.theme.shadows.lg};`}

  ${p => !p.isDragging && !p.isDragOverlay && `
    &:hover {
      box-shadow: ${p.theme.shadows.md};
      transform: translateY(-1px) scale(1.015);
    }
    &:hover ${DeleteBtn} { opacity: 1; }
  `}

  ${p => p.highlighted && `
    box-shadow: 0 0 0 2px ${p.theme.colors.primary}, 0 4px 12px rgba(139,92,246,0.25);
    animation: highlight-pulse 1.5s ease-in-out 2;

    @keyframes highlight-pulse {
      0%, 100% { box-shadow: 0 0 0 2px ${p.theme.colors.primary}, 0 4px 12px rgba(139,92,246,0.25); }
      50%       { box-shadow: 0 0 0 4px ${p.theme.colors.primary}, 0 4px 20px rgba(139,92,246,0.4); }
    }
  `}
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
`

const CardHeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
  flex: 1;
`

const ColorTag = styled.div`
  position: relative;
`

const ColorCircle = styled.button`
  width: 16px;
  height: 16px;
  border-radius: ${p => p.theme.borderRadius.full};
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  margin-top: 2px;

  &:hover { border-color: rgba(0,0,0,0.2); }
`

const ColorPicker = styled.div`
  position: absolute;
  top: 24px;
  left: 0;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[2]};
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
`

const ColorPickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: ${p => p.theme.spacing[2]};
`

const ColorOption = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${p => p.theme.borderRadius.full};
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s;

  &:hover { border-color: rgba(0,0,0,0.3); }
`

const ColorClear = styled.button`
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: ${p => p.theme.typography.fontSize.xs};
  cursor: pointer;
  font-family: inherit;

  &:hover { background: #f3f4f6; }
`

const DoneCheck = styled.svg`
  @keyframes check-pop {
    0%   { opacity: 0; transform: scale(0.4); }
    60%  { opacity: 1; transform: scale(1.25); }
    100% { opacity: 1; transform: scale(1); }
  }
  animation: check-pop 0.18s ease forwards;
  color: ${p => p.theme.colors.success};
  flex-shrink: 0;
  display: flex;
  align-items: center;
`

const CardText = styled.span<{ done?: boolean }>`
  flex: 1;
  word-break: break-word;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => (p.done ? '#9499ab' : p.theme.colors.text)};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  text-decoration: ${p => (p.done ? 'line-through' : 'none')};
  transition: color 0.15s;
`

const Description = styled.div<{ empty?: boolean }>`
  font-size: 0.8rem;
  color: ${p => (p.empty ? p.theme.colors.textTertiary : p.theme.colors.text)};
  font-style: ${p => (p.empty ? 'italic' : 'normal')};
  line-height: 1.4;
  margin-top: 0.25rem;
  cursor: pointer;
  word-break: break-word;
`

const DescriptionEdit = styled.textarea`
  font-size: 0.8rem;
  color: ${p => p.theme.colors.text};
  line-height: 1.4;
  margin-top: 0.25rem;
  width: 100%;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  padding: 0.35rem 0.5rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus { border-color: ${p => p.theme.colors.secondary}; }
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  margin-top: ${p => p.theme.spacing[2]};
  gap: ${p => p.theme.spacing[2]};
`

const DueDateWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`

const DueDateLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  position: relative;

  svg { flex-shrink: 0; color: ${p => p.theme.colors.textSecondary}; z-index: 1; }
`

const DueDateText = styled.span<{ urgency?: DueDateUrgency | 'empty' }>`
  z-index: 1;
  pointer-events: none;
  color: ${p => {
    if (!p.urgency || p.urgency === 'empty') return p.theme.colors.textTertiary
    return p.theme.dueDateUrgency[p.urgency] ?? p.theme.colors.textSecondary
  }};
  font-style: ${p => p.urgency === 'empty' ? 'italic' : 'normal'};
  font-weight: ${p =>
    p.urgency === 'overdue' || p.urgency === 'today' ? p.theme.typography.fontWeight.semibold :
    p.urgency === 'tomorrow' ? p.theme.typography.fontWeight.medium : 'inherit'
  };
`

const DueDateInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: pointer;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    cursor: pointer;
  }
`

const NegotiateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #c4b5fd;
  line-height: 1;
  border-radius: 3px;
  position: relative;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover { color: ${p => p.theme.colors.primary}; }

  &::after {
    content: 'Click to negotiate';
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f8fafc;
    font-size: 0.68rem;
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: ${p => p.theme.borderRadius.sm};
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 50;
  }
  &:hover::after { opacity: 1; }
`

const AssigneeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;

  svg { flex-shrink: 0; color: ${p => p.theme.colors.textSecondary}; }
`

const AssigneeText = styled.span<{ empty?: boolean }>`
  color: ${p => (p.empty ? p.theme.colors.textTertiary : 'inherit')};
  font-style: ${p => (p.empty ? 'italic' : 'normal')};
`

const AssigneeInput = styled.input`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.sm};
  padding: 0.2rem 0.4rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  min-width: 100px;

  &:focus { border-color: ${p => p.theme.colors.secondary}; }
`

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${p => p.theme.spacing[2]};
  gap: ${p => p.theme.spacing[2]};
`

const PrioritySelect = styled.select<{ priority: string }>`
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  outline: none;
  background: ${p => p.theme.priority[p.priority]?.bg ?? '#e5e7eb'};
  color: ${p => p.theme.priority[p.priority]?.text ?? p.theme.colors.textSecondary};
`

const StatusSelect = styled.select`
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 12px;
  background: ${p => p.theme.colors.primaryLight};
  color: ${p => p.theme.colors.primary};
  cursor: pointer;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  outline: none;

  &:hover { background: #e4deff; }
`

const KanbanCardInner = forwardRef<HTMLDivElement, KanbanCardProps & {
  style?: React.CSSProperties
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
  isDragging?: boolean
}>(({
  item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority,
  onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor,
  onNegotiate, style, listeners, attributes, isDragging, isDragOverlay,
}, ref) => {
  const accentColor = columnColor || '#8B5CF6'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.description || '')
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(item.assignee || '')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDueDate(item.id, e.target.value || null)
  }

  const dueInfo = dueDateDisplay(item.due_date)
  const showNegotiate = !!item.due_date && item.status !== 'done'
  const isDone = item.status === 'done'

  const handleAssigneeBlur = () => {
    setEditingAssignee(false)
    const trimmed = assigneeDraft.trim()
    const newValue = trimmed || null
    if (newValue !== (item.assignee || null)) onUpdateAssignee(item.id, newValue)
  }

  const handleAssigneeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') handleAssigneeBlur()
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
    if (newValue !== (item.description || null)) onUpdateDescription(item.id, newValue)
  }

  return (
    <Card
      ref={ref}
      data-item-id={item.id}
      data-highlighted={highlighted || undefined}
      accentColor={accentColor}
      isDragging={isDragging}
      isDragOverlay={isDragOverlay}
      highlighted={highlighted}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CardHeader>
        <CardHeaderLeft>
          <ColorTag onPointerDown={e => e.stopPropagation()}>
            <ColorCircle
              style={{ backgroundColor: item.color || '#E5E7EB' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Change color"
            />
            {showColorPicker && (
              <ColorPicker>
                <ColorPickerGrid>
                  {COLOR_PALETTE.map(({ name, value }) => (
                    <ColorOption
                      key={value}
                      style={{ backgroundColor: value }}
                      onClick={() => handleColorSelect(value)}
                      aria-label={name}
                      title={name}
                    />
                  ))}
                </ColorPickerGrid>
                {item.color && <ColorClear onClick={handleColorClear}>Clear color</ColorClear>}
              </ColorPicker>
            )}
          </ColorTag>
          {isDone && (
            <DoneCheck width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </DoneCheck>
          )}
          <CardText done={isDone}>{item.title}</CardText>
        </CardHeaderLeft>
        <DeleteBtn
          onClick={() => onDelete(item.id)}
          data-testid={`delete-${item.id}`}
          aria-label="Delete"
          onPointerDown={e => e.stopPropagation()}
        >
          &times;
        </DeleteBtn>
      </CardHeader>

      {editing ? (
        <DescriptionEdit
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
        <Description
          empty={!item.description}
          onClick={() => { setDraft(item.description || ''); setEditing(true) }}
          onPointerDown={e => e.stopPropagation()}
        >
          {item.description || 'Add description...'}
        </Description>
      )}

      <Meta onPointerDown={e => e.stopPropagation()}>
        <DueDateWrapper>
          <DueDateLabel>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <DueDateText urgency={!item.due_date ? 'empty' : dueInfo?.urgency} data-urgency={!item.due_date ? undefined : dueInfo?.urgency}>
              {dueInfo ? dueInfo.text : 'Set due date'}
            </DueDateText>
            <DueDateInput
              type="date"
              value={item.due_date || ''}
              onChange={handleDueDateChange}
              onKeyDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            />
          </DueDateLabel>
          {showNegotiate && (
            <NegotiateBtn
              onClick={e => { e.stopPropagation(); onNegotiate?.(item) }}
              onPointerDown={e => e.stopPropagation()}
              aria-label="Negotiate deadline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </NegotiateBtn>
          )}
        </DueDateWrapper>

        {editingAssignee ? (
          <AssigneeInput
            type="text"
            value={assigneeDraft}
            onChange={e => setAssigneeDraft(e.target.value)}
            onBlur={handleAssigneeBlur}
            placeholder="Assign to..."
            autoFocus
            onPointerDown={e => e.stopPropagation()}
            onKeyDown={handleAssigneeKeyDown}
          />
        ) : (
          <AssigneeDisplay onClick={() => { setAssigneeDraft(item.assignee || ''); setEditingAssignee(true) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <AssigneeText empty={!item.assignee}>
              {item.assignee || 'Assign'}
            </AssigneeText>
          </AssigneeDisplay>
        )}
      </Meta>

      <CardFooter>
        <PrioritySelect
          priority={item.priority}
          value={item.priority}
          onChange={e => onUpdatePriority(item.id, e.target.value)}
          aria-label="Change priority"
          onPointerDown={e => e.stopPropagation()}
        >
          {PRIORITY_CONFIG.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </PrioritySelect>
        <StatusSelect
          value={item.status}
          onChange={e => onUpdateStatus(item.id, e.target.value)}
          aria-label="Change status"
          onPointerDown={e => e.stopPropagation()}
        >
          {STATUS_CONFIG.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </StatusSelect>
      </CardFooter>
    </Card>
  )
})

KanbanCardInner.displayName = 'KanbanCardInner'

export function DragOverlayCard(props: KanbanCardProps) {
  return <KanbanCardInner {...props} isDragOverlay />
}

export default function KanbanCard({
  item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority,
  onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

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
