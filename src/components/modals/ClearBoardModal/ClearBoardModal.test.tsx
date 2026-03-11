import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { ClearBoardModal } from './ClearBoardModal'

describe('ClearBoardModal', () => {
  it('renders with item count', () => {
    render(<ClearBoardModal itemCount={5} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Clear the board?')).toBeInTheDocument()
    expect(screen.getByText(/5 tasks/)).toBeInTheDocument()
  })

  it('uses singular for 1 task', () => {
    render(<ClearBoardModal itemCount={1} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(/1 task\./)).toBeInTheDocument()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(<ClearBoardModal itemCount={3} onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Clear board button calls onConfirm', () => {
    const onConfirm = vi.fn()
    render(<ClearBoardModal itemCount={3} onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Clear board'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('clicking overlay calls onClose', () => {
    const onClose = vi.fn()
    const { container } = render(<ClearBoardModal itemCount={3} onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(container.firstChild!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking modal content does not call onClose', () => {
    const onClose = vi.fn()
    render(<ClearBoardModal itemCount={3} onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Clear the board?'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
