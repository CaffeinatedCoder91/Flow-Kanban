import { render, screen, fireEvent } from './test/utils'
import { describe, it, expect, vi } from 'vitest'
import KanbanCard from './KanbanCard'
import type { Item } from './types'

// @dnd-kit requires a DndContext — provide a minimal wrapper
import { DndContext } from '@dnd-kit/core'

const item: Item = {
  id: 1,
  title: 'Fix login bug',
  description: 'The login form throws a 500 error.',
  status: 'in_progress',
  priority: 'high',
  color: null,
  assignee: 'Alice',
  due_date: '2026-03-01',
  position: 0,
  created_at: '2026-01-01 00:00:00',
  last_modified: '2026-01-01 00:00:00',
  history: [],
}

const noop = vi.fn()

function wrap(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>)
}

describe('KanbanCard', () => {
  it('renders the task title', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })

  it('renders the description', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('The login form throws a 500 error.')).toBeInTheDocument()
  })

  it('renders the assignee', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows "Add description..." placeholder when description is null', () => {
    wrap(<KanbanCard item={{ ...item, description: null }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Add description...')).toBeInTheDocument()
  })

  it('renders the priority select with correct value', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByDisplayValue('High')).toBeInTheDocument()
  })

  it('renders the status select with correct value', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    wrap(<KanbanCard item={item} onDelete={onDelete} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByTestId('delete-1'))
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('calls onUpdatePriority when priority select changes', () => {
    const onUpdatePriority = vi.fn()
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={onUpdatePriority} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.change(screen.getByDisplayValue('High'), { target: { value: 'critical' } })
    expect(onUpdatePriority).toHaveBeenCalledWith(1, 'critical')
  })

  it('calls onUpdateStatus when status select changes', () => {
    const onUpdateStatus = vi.fn()
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={onUpdateStatus} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.change(screen.getByDisplayValue('In Progress'), { target: { value: 'done' } })
    expect(onUpdateStatus).toHaveBeenCalledWith(1, 'done')
  })

  it('switches description to edit mode on click', () => {
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByText('The login form throws a 500 error.'))
    expect(screen.getByDisplayValue('The login form throws a 500 error.')).toBeInTheDocument()
  })

  it('calls onUpdateDescription on description blur', () => {
    const onUpdateDescription = vi.fn()
    wrap(<KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={onUpdateDescription} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByText('The login form throws a 500 error.'))
    const textarea = screen.getByDisplayValue('The login form throws a 500 error.')
    fireEvent.change(textarea, { target: { value: 'Updated description' } })
    fireEvent.blur(textarea)
    expect(onUpdateDescription).toHaveBeenCalledWith(1, 'Updated description')
  })

  it('applies highlighted class when highlighted prop is true', () => {
    const { container } = wrap(
      <KanbanCard item={item} highlighted onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />
    )
    expect(container.querySelector('[data-item-id="1"]')).toHaveAttribute('data-highlighted', 'true')
  })

  it('sets data-item-id attribute', () => {
    const { container } = wrap(
      <KanbanCard item={item} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />
    )
    expect(container.querySelector('[data-item-id="1"]')).toBeInTheDocument()
  })

  // ── Due date contextual display ──────────────────────────────────────────────

  function relDate(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }

  it('shows "Overdue by 1 day" for yesterday', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(-1) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Overdue by 1 day')).toBeInTheDocument()
  })

  it('shows "Due today" for today', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(0) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('shows "Due tomorrow" for tomorrow', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(1) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument()
  })

  it('shows "Due in 3 days" for 3 days out', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(3) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due in 3 days')).toBeInTheDocument()
  })

  it('shows "Due next week" for 10 days out', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(10) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due next week')).toBeInTheDocument()
  })

  it('shows formatted date for 20 days out', () => {
    const dateStr = relDate(20)
    const due = new Date(dateStr + 'T00:00:00')
    const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    wrap(<KanbanCard item={{ ...item, due_date: dateStr }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText(`Due ${label}`)).toBeInTheDocument()
  })

  it('applies overdue urgency class to the due date span', () => {
    const { container } = wrap(<KanbanCard item={{ ...item, due_date: relDate(-2) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(container.querySelector('[data-urgency="overdue"]')).toBeInTheDocument()
  })

  it('applies today urgency class to the due date span', () => {
    const { container } = wrap(<KanbanCard item={{ ...item, due_date: relDate(0) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(container.querySelector('[data-urgency="today"]')).toBeInTheDocument()
  })

  it('shows negotiate button when due_date is set and status is not done', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(1), status: 'in_progress' }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByLabelText('Negotiate deadline')).toBeInTheDocument()
  })

  it('hides negotiate button for done items', () => {
    wrap(<KanbanCard item={{ ...item, due_date: relDate(1), status: 'done' }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.queryByLabelText('Negotiate deadline')).not.toBeInTheDocument()
  })

  it('hides negotiate button when no due_date', () => {
    wrap(<KanbanCard item={{ ...item, due_date: null }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.queryByLabelText('Negotiate deadline')).not.toBeInTheDocument()
  })

  it('calls onNegotiate with the item when negotiate button is clicked', () => {
    const onNegotiate = vi.fn()
    const itemWithDate = { ...item, due_date: relDate(1), status: 'in_progress' }
    wrap(<KanbanCard item={itemWithDate} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} onNegotiate={onNegotiate} />)
    fireEvent.click(screen.getByLabelText('Negotiate deadline'))
    expect(onNegotiate).toHaveBeenCalledWith(itemWithDate)
  })
})
