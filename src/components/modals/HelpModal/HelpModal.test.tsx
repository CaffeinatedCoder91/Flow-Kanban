import { render, screen, fireEvent } from '@/test/utils'
import { describe, it, expect, vi } from 'vitest'
import { HelpModal } from './HelpModal'

describe('HelpModal', () => {
  it('renders the page title', () => {
    render(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Help & shortcuts')).toBeInTheDocument()
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

  it('calls onClose when the Back button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Back to board'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
