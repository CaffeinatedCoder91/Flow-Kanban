import { render, screen, fireEvent } from '../../../test/utils'
import { describe, it, expect, vi } from 'vitest'
import { HelpModal } from './HelpModal'

describe('HelpModal', () => {
  it('renders the dialog with correct aria attributes', () => {
    render(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Help')
  })

  it('renders the "Getting started" section heading', () => {
    render(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Getting started')).toBeInTheDocument()
  })

  it('renders the "Features" section heading', () => {
    render(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Features')).toBeInTheDocument()
  })

  it('renders the "Keyboard shortcuts" section heading', () => {
    render(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument()
  })

  it('renders keyboard shortcut keys', () => {
    render(<HelpModal onClose={vi.fn()} />)
    const enterKeys = screen.getAllByText('Enter')
    expect(enterKeys.length).toBeGreaterThan(0)
    expect(screen.getByText('Esc')).toBeInTheDocument()
    expect(screen.getByText('Tab')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByText('Help & shortcuts'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
