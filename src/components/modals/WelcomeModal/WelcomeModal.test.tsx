import { render, screen, fireEvent } from '../../../test/utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WelcomeModal, { hasSeenWelcome } from './WelcomeModal'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('WelcomeModal', () => {
  it('renders the dialog with correct aria attributes', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Welcome to Flow')
  })

  it('shows the first step title on mount', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    expect(screen.getByText('Welcome to Flow')).toBeInTheDocument()
  })

  it('shows "Next" CTA on the first step', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('advances to the second step when Next is clicked', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Try creating a task')).toBeInTheDocument()
  })

  it('advances to the third step from the second', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Meet your AI assistant')).toBeInTheDocument()
  })

  it('shows "Let\'s go" CTA on the last step', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText("Let's go")).toBeInTheDocument()
  })

  it('calls onClose when "Let\'s go" is clicked on the last step', () => {
    const onClose = vi.fn()
    render(<WelcomeModal onClose={onClose} />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText("Let's go"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks welcome as seen when "Let\'s go" is clicked', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText("Let's go"))
    expect(localStorage.getItem('flow-welcome-seen')).toBe('true')
  })

  it('calls onClose when Skip is clicked', () => {
    const onClose = vi.fn()
    render(<WelcomeModal onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Skip'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks welcome as seen when Skip is clicked', () => {
    render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Skip'))
    expect(localStorage.getItem('flow-welcome-seen')).toBe('true')
  })

  it('renders three progress dots', () => {
    const { container } = render(<WelcomeModal onClose={vi.fn()} />)
    expect(container.querySelectorAll('.welcome-dot')).toHaveLength(3)
  })

  it('first dot is active on mount', () => {
    const { container } = render(<WelcomeModal onClose={vi.fn()} />)
    const dots = container.querySelectorAll('.welcome-dot')
    expect(dots[0]).toHaveClass('active')
    expect(dots[1]).not.toHaveClass('active')
  })

  it('second dot becomes active after advancing one step', () => {
    const { container } = render(<WelcomeModal onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Next'))
    const dots = container.querySelectorAll('.welcome-dot')
    expect(dots[1]).toHaveClass('active')
    expect(dots[0]).not.toHaveClass('active')
  })
})

describe('hasSeenWelcome', () => {
  it('returns false when localStorage is empty', () => {
    expect(hasSeenWelcome()).toBe(false)
  })

  it('returns true when flow-welcome-seen is set to "true"', () => {
    localStorage.setItem('flow-welcome-seen', 'true')
    expect(hasSeenWelcome()).toBe(true)
  })

  it('returns false when flow-welcome-seen is set to another value', () => {
    localStorage.setItem('flow-welcome-seen', 'yes')
    expect(hasSeenWelcome()).toBe(false)
  })
})
