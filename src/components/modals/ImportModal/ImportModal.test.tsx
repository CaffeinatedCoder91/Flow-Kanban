import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { ImportModal } from './ImportModal'
import { ImportModalProps } from './ImportModal.types'

function makeProps(overrides: Partial<ImportModalProps> = {}): ImportModalProps {
  return {
    isExtracting: false,
    isConfirming: false,
    importText: '',
    importFileName: null,
    extractedTasks: [],
    extractError: null,
    closeImportModal: vi.fn(),
    setImportText: vi.fn(),
    setExtractError: vi.fn(),
    setExtractedTasks: vi.fn(),
    handleFileUpload: vi.fn(),
    handleExtractTasks: vi.fn(),
    handleConfirmAll: vi.fn(),
    ...overrides,
  }
}

describe('ImportModal', () => {
  it('renders the modal with textarea', () => {
    render(<ImportModal {...makeProps()} />)
    expect(screen.getByText('📋 Import Tasks')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Fix login bug/)).toBeInTheDocument()
  })

  it('Process button is disabled when importText is empty', () => {
    render(<ImportModal {...makeProps({ importText: '' })} />)
    expect(screen.getByText('Process')).toBeDisabled()
  })

  it('Process button is enabled when importText has content', () => {
    render(<ImportModal {...makeProps({ importText: 'Fix login bug' })} />)
    expect(screen.getByText('Process')).not.toBeDisabled()
  })

  it('Cancel button calls closeImportModal', () => {
    const closeImportModal = vi.fn()
    render(<ImportModal {...makeProps({ closeImportModal })} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(closeImportModal).toHaveBeenCalledTimes(1)
  })

  it('Close (×) button calls closeImportModal', () => {
    const closeImportModal = vi.fn()
    render(<ImportModal {...makeProps({ closeImportModal })} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(closeImportModal).toHaveBeenCalledTimes(1)
  })

  it('shows file hint text', () => {
    render(<ImportModal {...makeProps()} />)
    expect(screen.getByText('.txt · .pdf · .docx · max 5MB')).toBeInTheDocument()
  })

  it('shows upload file button', () => {
    render(<ImportModal {...makeProps()} />)
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
  })

  it('shows error message when extractError is set', () => {
    render(<ImportModal {...makeProps({ extractError: 'Something went wrong.' })} />)
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })
})
