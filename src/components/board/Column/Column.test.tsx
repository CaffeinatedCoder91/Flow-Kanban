import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { describe, it, expect, vi } from 'vitest'
import { Column } from './Column'
import type { Item } from '@/types'
import { DndContext } from '@dnd-kit/core'

const items: Item[] = [
  {
    id: 'mock-1',
    title: 'Task one',
    description: null,
    status: 'not_started',
    priority: 'medium',
    color: null,
    assignee: null,
    due_date: null,
    position: 0,
    created_at: '2026-01-01 00:00:00',
    last_modified: '2026-01-01 00:00:00',
    history: [],
  },
]

const noop = vi.fn()

function wrap(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>)
}

const defaultProps = {
  statusKey: 'not_started',
  label: 'Not Started',
  color: '#8B5CF6',
  items,
  highlightedItems: new Set<string>(),
  onAdd: vi.fn().mockResolvedValue(undefined),
  onDelete: noop,
  onUpdateStatus: noop,
  onUpdatePriority: noop,
  onUpdateDescription: noop,
  onUpdateDueDate: noop,
  onUpdateAssignee: noop,
  onUpdateColor: noop,
}

describe('Column', () => {
  it('renders the column label', () => {
    const { container } = wrap(<Column {...defaultProps} />)
    expect(container.querySelector('.column-label')).toHaveTextContent('Not Started')
  })

  it('renders the item count', () => {
    wrap(<Column {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders items in the column', () => {
    wrap(<Column {...defaultProps} />)
    expect(screen.getByText('Task one')).toBeInTheDocument()
  })

  it('shows inline add form when "+ Add task" is clicked', () => {
    wrap(<Column {...defaultProps} />)
    fireEvent.click(screen.getByText('+ Add task'))
    expect(screen.getByPlaceholderText('Task name...')).toBeInTheDocument()
  })

  it('calls onAdd with text and statusKey on form submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    wrap(<Column {...defaultProps} onAdd={onAdd} />)
    fireEvent.click(screen.getByText('+ Add task'))
    fireEvent.change(screen.getByPlaceholderText('Task name...'), { target: { value: 'New task' } })
    fireEvent.submit(screen.getByPlaceholderText('Task name...').closest('form')!)
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith('New task', 'not_started')
    })
  })

  it('hides form and shows "+ Add task" after cancel', () => {
    wrap(<Column {...defaultProps} />)
    fireEvent.click(screen.getByText('+ Add task'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.getByText('+ Add task')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Task name...')).not.toBeInTheDocument()
  })

  it('does not call onAdd when input is empty', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    wrap(<Column {...defaultProps} onAdd={onAdd} />)
    fireEvent.click(screen.getByText('+ Add task'))
    fireEvent.submit(screen.getByPlaceholderText('Task name...').closest('form')!)
    await waitFor(() => {
      expect(onAdd).not.toHaveBeenCalled()
    })
  })

  it('renders empty state with 0 count when no items', () => {
    wrap(<Column {...defaultProps} items={[]} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
