import { useState } from 'react'
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
import { Item, STATUS_CONFIG } from './types'
import KanbanColumn from './KanbanColumn'
import { DragOverlayCard } from './KanbanCard'

interface KanbanBoardProps {
  items: Item[]
  highlightedItems: Set<number>
  onAdd: (title: string, status: string) => Promise<void>
  onDelete: (id: number) => void
  onUpdateStatus: (id: number, status: string) => void
  onUpdatePriority: (id: number, priority: string) => void
  onUpdateDescription: (id: number, description: string | null) => void
  onUpdateDueDate: (id: number, due_date: string | null) => void
  onUpdateAssignee: (id: number, assignee: string | null) => void
  onUpdateColor: (id: number, color: string | null) => void
  onNegotiate?: (item: Item) => void
}

export default function KanbanBoard({ items, highlightedItems, onAdd, onDelete, onUpdateStatus, onUpdatePriority, onUpdateDescription, onUpdateDueDate, onUpdateAssignee, onUpdateColor, onNegotiate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)

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
    setActiveId(event.active.id as number)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeColumn = findColumn(active.id)
    const overColumn = findColumn(over.id)

    if (activeColumn && overColumn && activeColumn !== overColumn) {
      onUpdateStatus(active.id as number, overColumn)
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
        onUpdateStatus(active.id as number, overColumn)
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
          <KanbanColumn
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
