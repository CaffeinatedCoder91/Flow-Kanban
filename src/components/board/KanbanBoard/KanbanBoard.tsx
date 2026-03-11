import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { STATUS_CONFIG } from '@/types'
import { KanbanBoardProps } from './KanbanBoard.types'
import { Column } from '../Column'
import { DragOverlayCard } from '../TaskCard'

export const KanbanBoard = ({ items, highlightedItems, onAdd, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate }: KanbanBoardProps): React.ReactElement => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const activeItem = activeId !== null ? items.find(t => t.id === activeId) : undefined

  function findColumn(id: string | number): string | undefined {
    if (STATUS_CONFIG.some(s => s.key === id)) return id as string
    const item = items.find(t => t.id === id)
    return item?.status
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeColumn = findColumn(active.id)
    const overColumn = findColumn(over.id)

    if (activeColumn && overColumn && activeColumn !== overColumn) {
      onUpdateStatus(active.id as string, overColumn)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const overColumn = findColumn(over.id)
    if (overColumn) {
      const currentItem = items.find(t => t.id === active.id)
      if (currentItem && currentItem.status !== overColumn) {
        onUpdateStatus(active.id as string, overColumn)
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const grouped = STATUS_CONFIG.map(col => ({
    ...col,
    items: items.filter(t => t.status === col.key),
  }))

  if (items.length === 0) {
    return (
      <div className="empty-board-state">
        <svg className="empty-board-illustration" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="46" height="100" rx="6" fill="#f0edff" stroke="#d4ccf7" strokeWidth="1.5"/>
          <rect x="67" y="10" width="46" height="100" rx="6" fill="#f0edff" stroke="#d4ccf7" strokeWidth="1.5"/>
          <rect x="124" y="10" width="46" height="100" rx="6" fill="#f0edff" stroke="#d4ccf7" strokeWidth="1.5"/>
          <rect x="18" y="22" width="30" height="6" rx="3" fill="#d4ccf7"/>
          <rect x="75" y="22" width="30" height="6" rx="3" fill="#d4ccf7"/>
          <rect x="132" y="22" width="30" height="6" rx="3" fill="#d4ccf7"/>
          <circle cx="90" cy="75" r="16" fill="#8B5CF6" opacity="0.15"/>
          <path d="M90 67v16M82 75h16" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <h3>Your board is empty</h3>
        <p>Add your first task using the bar above, or use the + button in any column.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board">
        {grouped.map(col => (
          <Column
            key={col.key}
            statusKey={col.key}
            label={col.label}
            color={col.color}
            items={col.items}
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
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <DragOverlayCard
            item={activeItem}
            columnColor={STATUS_CONFIG.find(s => s.key === activeItem.status)?.color}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
            onUpdatePriority={onUpdatePriority}
            onUpdateDescription={onUpdateDescription}
            onUpdateDueDate={onUpdateDueDate}
            onUpdateAssignee={onUpdateAssignee}
            onUpdateColor={onUpdateColor}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
