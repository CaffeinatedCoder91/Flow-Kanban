import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { useTheme } from '@emotion/react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/types'
import { TaskCardProps, DueDateUrgency } from './TaskCard.types'
import {
  DeleteBtn, Card, CardHeader, CardHeaderLeft, ColorTag, ColorCircle,
  ColorPicker, ColorPickerGrid, ColorOption, ColorClear, DoneCheck,
  CardText, Description, DescriptionEdit, Meta, DueDateWrapper, DueDateLabel,
  DueDateText, DueDateInput, NegotiateBtn, AssigneeDisplay, AssigneeText,
  AssigneeInput, CardFooter, DropdownWrapper, DropdownTrigger, DropdownMenu,
  DropdownOption, DropdownDot,
} from './TaskCard.styles'

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

const TaskCardInner = forwardRef<HTMLDivElement, TaskCardProps & {
  style?: React.CSSProperties
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
  isDragging?: boolean
}>(({
  item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority,
  onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor,
  onNegotiate, style, listeners, attributes, isDragging, isDragOverlay,
}, ref) => {
  const theme = useTheme()
  const accentColor = columnColor || '#8B5CF6'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.description || '')
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(item.assignee || '')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const priorityTriggerRef = useRef<HTMLButtonElement>(null)
  const statusTriggerRef = useRef<HTMLButtonElement>(null)

  const openMenu = (which: 'priority' | 'status', triggerRef: React.RefObject<HTMLButtonElement | null>) => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setMenuPos({ top: rect.bottom + 5, left: rect.left })
    if (which === 'priority') { setShowPriorityMenu(true); setShowStatusMenu(false) }
    else { setShowStatusMenu(true); setShowPriorityMenu(false) }
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDueDate(item.id, e.target.value || null)
  }

  const dueInfo = dueDateDisplay(item.due_date)
  const showNegotiate = !!item.due_date && item.status !== 'done'
  const isDone = item.status === 'done'

  const prevIsDoneRef = useRef(isDone)
  const [donePulse, setDonePulse] = useState(false)
  useEffect(() => {
    if (!prevIsDoneRef.current && isDone) {
      setDonePulse(true)
      const t = setTimeout(() => setDonePulse(false), 400)
      return () => clearTimeout(t)
    }
    prevIsDoneRef.current = isDone
  }, [isDone])

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
      donePulse={donePulse}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CardHeader>
        <CardHeaderLeft>
          <ColorTag onPointerDown={e => e.stopPropagation()}>
            <ColorCircle
              accentColor={item.color || '#E5E7EB'}
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Change color"
            />
            {showColorPicker && (
              <ColorPicker>
                <ColorPickerGrid>
                  {COLOR_PALETTE.map(({ name, value }) => (
                    <ColorOption
                      key={value}
                      accentColor={value}
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

      <CardFooter onPointerDown={e => e.stopPropagation()}>
        {/* Priority dropdown */}
        <DropdownWrapper
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowPriorityMenu(false) }}
        >
          <DropdownTrigger
            ref={priorityTriggerRef}
            bg={theme.priority[item.priority]?.bg ?? '#e5e7eb'}
            fgColor={theme.priority[item.priority]?.text ?? '#374151'}
            onClick={() => showPriorityMenu ? setShowPriorityMenu(false) : openMenu('priority', priorityTriggerRef)}
            aria-label="Change priority"
            tabIndex={0}
          >
            {PRIORITY_CONFIG.find(p => p.key === item.priority)?.label ?? item.priority}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </DropdownTrigger>
          {showPriorityMenu && menuPos && createPortal(
            <DropdownMenu top={menuPos.top} left={menuPos.left}>
              {PRIORITY_CONFIG.map(p => (
                <DropdownOption
                  key={p.key}
                  data-testid={`priority-option-${p.key}`}
                  active={item.priority === p.key}
                  optBg={theme.priority[p.key]?.bg}
                  optColor={theme.priority[p.key]?.text}
                  tabIndex={0}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onUpdatePriority(item.id, p.key); setShowPriorityMenu(false) }}
                >
                  <DropdownDot dotColor={theme.priority[p.key]?.text ?? '#6b7280'} />
                  {p.label}
                </DropdownOption>
              ))}
            </DropdownMenu>,
            document.body
          )}
        </DropdownWrapper>

        {/* Status dropdown */}
        <DropdownWrapper
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setShowStatusMenu(false) }}
        >
          <DropdownTrigger
            ref={statusTriggerRef}
            bg={(STATUS_CONFIG.find(s => s.key === item.status)?.color ?? '#8B5CF6') + '20'}
            fgColor={STATUS_CONFIG.find(s => s.key === item.status)?.color ?? '#8B5CF6'}
            onClick={() => showStatusMenu ? setShowStatusMenu(false) : openMenu('status', statusTriggerRef)}
            aria-label="Change status"
            tabIndex={0}
          >
            {STATUS_CONFIG.find(s => s.key === item.status)?.label ?? item.status}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </DropdownTrigger>
          {showStatusMenu && menuPos && createPortal(
            <DropdownMenu top={menuPos.top} left={menuPos.left}>
              {STATUS_CONFIG.map(s => (
                <DropdownOption
                  key={s.key}
                  data-testid={`status-option-${s.key}`}
                  active={item.status === s.key}
                  optBg={s.color + '20'}
                  optColor={s.color}
                  tabIndex={0}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onUpdateStatus(item.id, s.key); setShowStatusMenu(false) }}
                >
                  <DropdownDot dotColor={s.color} />
                  {s.label}
                </DropdownOption>
              ))}
            </DropdownMenu>,
            document.body
          )}
        </DropdownWrapper>
      </CardFooter>
    </Card>
  )
})

TaskCardInner.displayName = 'TaskCardInner'

export const DragOverlayCard = (props: TaskCardProps): React.ReactElement => {
  return <TaskCardInner {...props} isDragOverlay />
}

export const TaskCard = ({
  item, columnColor, highlighted, onDelete, onUpdateStatus, onUpdatePriority,
  onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate,
}: TaskCardProps): React.ReactElement => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TaskCardInner
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
