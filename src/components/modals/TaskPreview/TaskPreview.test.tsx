import { render, screen, fireEvent } from '../../../test/utils'
import { describe, it, expect, vi } from 'vitest'
import { TaskPreview } from './TaskPreview'
import { baseTask } from './TaskPreview.mockdata'

describe('TaskPreview', () => {
  it('renders the task title in the input', () => {
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByDisplayValue('Write release notes')).toBeInTheDocument()
  })

  it('renders the description in the textarea', () => {
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByDisplayValue('Document all changes for the v2 release.')).toBeInTheDocument()
  })

  it('renders priority and status selects with correct values', () => {
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Not Started')).toBeInTheDocument()
  })

  it('calls onChange with updated title when title input changes', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Write release notes'), { target: { value: 'Updated title' } })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, title: 'Updated title' })
  })

  it('calls onChange with updated description when textarea changes', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Document all changes for the v2 release.'), {
      target: { value: 'New description' },
    })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, description: 'New description' })
  })

  it('calls onChange with null description when textarea is cleared', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Document all changes for the v2 release.'), {
      target: { value: '' },
    })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, description: null })
  })

  it('calls onChange with updated priority when select changes', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Medium'), { target: { value: 'high' } })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, priority: 'high' })
  })

  it('calls onChange with updated status when select changes', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Not Started'), { target: { value: 'in_progress' } })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, status: 'in_progress' })
  })

  it('calls onChange with updated assignee', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Assign to...'), { target: { value: 'Alice' } })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, assignee: 'Alice' })
  })

  it('calls onChange with null assignee when cleared', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={{ ...baseTask, assignee: 'Alice' }} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, assignee: null })
  })

  it('calls onChange with selected color when color swatch is clicked', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={baseTask} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByTitle('Red'))
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, color: '#EF4444' })
  })

  it('shows Clear button when a color is set and calls onChange with null on click', () => {
    const onChange = vi.fn()
    render(<TaskPreview task={{ ...baseTask, color: '#EF4444' }} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('Clear'))
    expect(onChange).toHaveBeenCalledWith({ ...baseTask, color: null })
  })

  it('calls onRemove when × button is clicked', () => {
    const onRemove = vi.fn()
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText('Remove task'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('shows status reasoning badge when status_reasoning is set', () => {
    render(<TaskPreview task={{ ...baseTask, status_reasoning: 'text says "currently working on this"' }} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByLabelText('Status reasoning: text says "currently working on this"')).toBeInTheDocument()
  })

  it('does not show status reasoning badge when status_reasoning is null', () => {
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.queryByLabelText(/Status reasoning/)).not.toBeInTheDocument()
  })

  it('shows confidence warning badge for a field with score < 70', () => {
    render(<TaskPreview task={{ ...baseTask, confidence: { title: 55, priority: 85, due_date: 100, assignee: 100, description: 80 } }} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByLabelText('AI confidence: 55% — please review this field')).toBeInTheDocument()
  })

  it('shows multiple confidence badges when multiple fields are low confidence', () => {
    render(<TaskPreview task={{ ...baseTask, confidence: { title: 60, priority: 55, due_date: 100, assignee: 100, description: 65 } }} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getAllByLabelText(/AI confidence/)).toHaveLength(3)
  })

  it('does not show confidence badges when all scores are >= 70', () => {
    render(<TaskPreview task={{ ...baseTask, confidence: { title: 90, priority: 85, due_date: 100, assignee: 100, description: 70 } }} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.queryByLabelText(/AI confidence/)).not.toBeInTheDocument()
  })

  it('does not show confidence badges when confidence is null', () => {
    render(<TaskPreview task={baseTask} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.queryByLabelText(/AI confidence/)).not.toBeInTheDocument()
  })
})
