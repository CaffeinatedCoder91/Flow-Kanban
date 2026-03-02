import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AssistantPanel from './AssistantPanel'

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onRefresh: vi.fn(),
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AssistantPanel', () => {
  it('renders the greeting message when open', () => {
    render(<AssistantPanel {...defaultProps} />)
    expect(screen.getByText(/Hey, I'm Flow/)).toBeInTheDocument()
  })

  it('is hidden when isOpen is false', () => {
    const { container } = render(<AssistantPanel {...defaultProps} isOpen={false} />)
    const panel = container.querySelector('.assistant-panel')
    expect(panel).not.toHaveClass('assistant-panel-open')
  })

  it('is visible when isOpen is true', () => {
    const { container } = render(<AssistantPanel {...defaultProps} isOpen={true} />)
    const panel = container.querySelector('.assistant-panel')
    expect(panel).toHaveClass('assistant-panel-open')
  })

  it('shows overlay when open', () => {
    const { container } = render(<AssistantPanel {...defaultProps} isOpen={true} />)
    expect(container.querySelector('.assistant-overlay')).toBeInTheDocument()
  })

  it('hides overlay when closed', () => {
    const { container } = render(<AssistantPanel {...defaultProps} isOpen={false} />)
    expect(container.querySelector('.assistant-overlay')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AssistantPanel {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('send button is disabled when input is empty', () => {
    render(<AssistantPanel {...defaultProps} />)
    expect(screen.getByLabelText('Send message')).toBeDisabled()
  })

  it('send button is enabled when input has text', () => {
    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'How many tasks do I have?' },
    })
    expect(screen.getByLabelText('Send message')).not.toBeDisabled()
  })

  it('prefills input when prefillMessage is set and panel is open', () => {
    render(<AssistantPanel {...defaultProps} isOpen={true} prefillMessage="Help me merge duplicates" onPrefillConsumed={vi.fn()} />)
    expect(screen.getByDisplayValue('Help me merge duplicates')).toBeInTheDocument()
  })

  it('calls onPrefillConsumed after prefill', () => {
    const onPrefillConsumed = vi.fn()
    render(<AssistantPanel {...defaultProps} isOpen={true} prefillMessage="test" onPrefillConsumed={onPrefillConsumed} />)
    expect(onPrefillConsumed).toHaveBeenCalledTimes(1)
  })

  it('sends message and shows response', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ response: 'You have 3 tasks.' }),
      } as Response)

    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'How many tasks?' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Ask me anything about your tasks...').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('How many tasks?')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('You have 3 tasks.')).toBeInTheDocument()
    })
  })

  it('shows action messages from tool use', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ response: 'Done!', actions: ['Created task: Fix bug'] }),
      } as Response)

    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'Add a task' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Ask me anything about your tasks...').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Created task: Fix bug')).toBeInTheDocument()
    })
  })

  it('shows error message on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'Hello' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Ask me anything about your tasks...').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/AI is unavailable/)).toBeInTheDocument()
    })
  })

  it('shows "Try again" button after network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'Hello' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Ask me anything about your tasks...').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('clicking "Try again" retries and shows response', async () => {
    vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'))    // first /api/items fails → error shown
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) } as Response) // retry /api/items
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ response: 'Retry worked!' }),
      } as Response) // /api/chat

    render(<AssistantPanel {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Ask me anything about your tasks...'), {
      target: { value: 'Hello' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Ask me anything about your tasks...').closest('form')!)

    await waitFor(() => expect(screen.getByText('Try again')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Try again'))

    await waitFor(() => {
      expect(screen.getByText('Retry worked!')).toBeInTheDocument()
    })
  })

  it('clears input after sending', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) } as Response)
      .mockResolvedValueOnce({ json: () => Promise.resolve({ response: 'OK' }) } as Response)

    render(<AssistantPanel {...defaultProps} />)
    const input = screen.getByPlaceholderText('Ask me anything about your tasks...')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })
})
