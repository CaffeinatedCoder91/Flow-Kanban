import { render, screen, fireEvent } from '../../../test/utils'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from './TaskCard'
import { mockItem } from './TaskCard.mockdata'
import { DndContext } from '@dnd-kit/core'

const noop = vi.fn()

function wrap(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>)
}

describe('TaskCard', () => {
  it('renders the task title', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })

  it('renders the description', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('The login form throws a 500 error.')).toBeInTheDocument()
  })

  it('renders the assignee', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows "Add description..." placeholder when description is null', () => {
    wrap(<TaskCard item={{ ...mockItem, description: null }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Add description...')).toBeInTheDocument()
  })

  it('renders the priority trigger with correct label', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByLabelText('Change priority')).toHaveTextContent('High')
  })

  it('renders the status trigger with correct label', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByLabelText('Change status')).toHaveTextContent('In Progress')
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    wrap(<TaskCard item={mockItem} onDelete={onDelete} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByTestId('delete-mock-1'))
    expect(onDelete).toHaveBeenCalledWith('mock-1')
  })

  it('calls onUpdatePriority when priority option is selected', () => {
    const onUpdatePriority = vi.fn()
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={onUpdatePriority} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByLabelText('Change priority'))
    fireEvent.click(screen.getByTestId('priority-option-critical'))
    expect(onUpdatePriority).toHaveBeenCalledWith('mock-1', 'critical')
  })

  it('calls onUpdateStatus when status option is selected', () => {
    const onUpdateStatus = vi.fn()
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={onUpdateStatus} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByLabelText('Change status'))
    fireEvent.click(screen.getByTestId('status-option-done'))
    expect(onUpdateStatus).toHaveBeenCalledWith('mock-1', 'done')
  })

  it('switches description to edit mode on click', () => {
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByText('The login form throws a 500 error.'))
    expect(screen.getByDisplayValue('The login form throws a 500 error.')).toBeInTheDocument()
  })

  it('calls onUpdateDescription on description blur', () => {
    const onUpdateDescription = vi.fn()
    wrap(<TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={onUpdateDescription} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    fireEvent.click(screen.getByText('The login form throws a 500 error.'))
    const textarea = screen.getByDisplayValue('The login form throws a 500 error.')
    fireEvent.change(textarea, { target: { value: 'Updated description' } })
    fireEvent.blur(textarea)
    expect(onUpdateDescription).toHaveBeenCalledWith('mock-1', 'Updated description')
  })

  it('applies highlighted attribute when highlighted prop is true', () => {
    const { container } = wrap(
      <TaskCard item={mockItem} highlighted onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />
    )
    expect(container.querySelector('[data-item-id="mock-1"]')).toHaveAttribute('data-highlighted', 'true')
  })

  it('sets data-item-id attribute', () => {
    const { container } = wrap(
      <TaskCard item={mockItem} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />
    )
    expect(container.querySelector('[data-item-id="mock-1"]')).toBeInTheDocument()
  })

  function relDate(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }

  it('shows "Overdue by 1 day" for yesterday', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(-1) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Overdue by 1 day')).toBeInTheDocument()
  })

  it('shows "Due today" for today', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(0) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('shows "Due tomorrow" for tomorrow', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(1) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument()
  })

  it('shows "Due in 3 days" for 3 days out', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(3) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due in 3 days')).toBeInTheDocument()
  })

  it('shows "Due next week" for 10 days out', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(10) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByText('Due next week')).toBeInTheDocument()
  })

  it('applies overdue urgency to the due date span', () => {
    const { container } = wrap(<TaskCard item={{ ...mockItem, due_date: relDate(-2) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(container.querySelector('[data-urgency="overdue"]')).toBeInTheDocument()
  })

  it('applies today urgency to the due date span', () => {
    const { container } = wrap(<TaskCard item={{ ...mockItem, due_date: relDate(0) }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(container.querySelector('[data-urgency="today"]')).toBeInTheDocument()
  })

  it('shows negotiate button when due_date is set and status is not done', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(1), status: 'in_progress' }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.getByLabelText('Negotiate deadline')).toBeInTheDocument()
  })

  it('hides negotiate button for done items', () => {
    wrap(<TaskCard item={{ ...mockItem, due_date: relDate(1), status: 'done' }} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} />)
    expect(screen.queryByLabelText('Negotiate deadline')).not.toBeInTheDocument()
  })

  it('calls onNegotiate with the item when negotiate button is clicked', () => {
    const onNegotiate = vi.fn()
    const itemWithDate = { ...mockItem, due_date: relDate(1), status: 'in_progress' }
    wrap(<TaskCard item={itemWithDate} onDelete={noop} onUpdateStatus={noop} onUpdatePriority={noop} onUpdateDescription={noop} onUpdateDueDate={noop} onUpdateAssignee={noop} onUpdateColor={noop} onNegotiate={onNegotiate} />)
    fireEvent.click(screen.getByLabelText('Negotiate deadline'))
    expect(onNegotiate).toHaveBeenCalledWith(itemWithDate)
  })
})
