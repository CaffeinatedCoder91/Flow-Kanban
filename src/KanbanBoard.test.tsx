import { render, screen } from './test/utils'
import { describe, it, expect, vi } from 'vitest'
import KanbanBoard from './KanbanBoard'
import type { Item } from './types'

const noop = vi.fn()

const items: Item[] = [
  { id: 1, title: 'Not started task', description: null, status: 'not_started', priority: 'medium', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 2, title: 'In progress task', description: null, status: 'in_progress', priority: 'high',   color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 3, title: 'Done task',        description: null, status: 'done',        priority: 'low',    color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
  { id: 4, title: 'Stuck task',       description: null, status: 'stuck',       priority: 'critical', color: null, assignee: null, due_date: null, position: 0, created_at: '2026-01-01', last_modified: '2026-01-01', history: [] },
]

const defaultProps = {
  items,
  highlightedItems: new Set<number>(),
  onAdd: vi.fn().mockResolvedValue(undefined),
  onDelete: noop,
  onUpdateStatus: noop,
  onUpdatePriority: noop,
  onUpdateDescription: noop,
  onUpdateDueDate: noop,
  onUpdateAssignee: noop,
  onUpdateColor: noop,
}

describe('KanbanBoard', () => {
  it('renders all four columns', () => {
    const { container } = render(<KanbanBoard {...defaultProps} />)
    const labelTexts = Array.from(container.querySelectorAll('.column-label')).map(el => el.textContent)
    expect(labelTexts).toContain('Not Started')
    expect(labelTexts).toContain('In Progress')
    expect(labelTexts).toContain('Done')
    expect(labelTexts).toContain('Stuck')
  })

  it('renders items in the correct column', () => {
    render(<KanbanBoard {...defaultProps} />)
    expect(screen.getByText('Not started task')).toBeInTheDocument()
    expect(screen.getByText('In progress task')).toBeInTheDocument()
    expect(screen.getByText('Done task')).toBeInTheDocument()
    expect(screen.getByText('Stuck task')).toBeInTheDocument()
  })

  it('renders with empty items list', () => {
    render(<KanbanBoard {...defaultProps} items={[]} />)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('passes highlightedItems to cards', () => {
    const { container } = render(
      <KanbanBoard {...defaultProps} highlightedItems={new Set([1])} />
    )
    expect(container.querySelector('[data-item-id="1"]')).toHaveAttribute('data-highlighted', 'true')
    expect(container.querySelector('[data-item-id="2"]')).not.toHaveAttribute('data-highlighted')
  })
})
