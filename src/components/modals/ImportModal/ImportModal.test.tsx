import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils'
import ImportModal from './ImportModal'

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ tasks: [] }),
  } as Response)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ImportModal', () => {
  it('renders the modal with textarea', () => {
    render(<ImportModal onClose={vi.fn()} onImported={vi.fn()} />)
    expect(screen.getByText('📋 Import Tasks')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Fix login bug/)).toBeInTheDocument()
  })

  it('Process button is disabled when textarea is empty', () => {
    render(<ImportModal onClose={vi.fn()} onImported={vi.fn()} />)
    expect(screen.getByText('Process')).toBeDisabled()
  })

  it('Process button is enabled when text is entered', () => {
    render(<ImportModal onClose={vi.fn()} onImported={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Fix login bug' } })
    expect(screen.getByText('Process')).not.toBeDisabled()
  })

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn()
    render(<ImportModal onClose={onClose} onImported={vi.fn()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Close (×) button calls onClose', () => {
    const onClose = vi.fn()
    render(<ImportModal onClose={onClose} onImported={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows file hint text', () => {
    render(<ImportModal onClose={vi.fn()} onImported={vi.fn()} />)
    expect(screen.getByText('.txt · .pdf · .docx · max 5MB')).toBeInTheDocument()
  })

  it('shows upload file button', () => {
    render(<ImportModal onClose={vi.fn()} onImported={vi.fn()} />)
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
  })
})
