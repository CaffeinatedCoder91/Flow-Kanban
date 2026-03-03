import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import { Item, ProposedTask } from '../../../types'
import TaskPreview from '../TaskPreview'
import { ImportModalProps } from './ImportModal.types'
import {
  ModalOverlay, ModalContainer, ModalHeader, ModalClose, ModalBody,
  ModalHint, ModalTextarea, ExtractError, SpinnerRow, Spinner, SpinnerLabel,
  ModalFooter, FileBtnLabel, FileHint, FileSource, PreviewCount, PreviewList,
  CancelBtn, ProcessBtn,
} from './ImportModal.styles'

export default function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [importText, setImportText] = useState('')
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<ProposedTask[]>([])
  const [extractError, setExtractError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExts = ['.txt', '.pdf', '.docx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExts.includes(ext)) {
      setExtractError('Unsupported file type. Please upload a .txt, .pdf, or .docx file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setExtractError('File is too large. Maximum size is 5MB.')
      return
    }

    setExtractError(null)
    setIsExtracting(true)
    setImportFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiFetch('/api/extract-from-file', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to process file.')
        setImportFileName(null)
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
        setImportFileName(null)
      }
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
      setImportFileName(null)
    } finally {
      setIsExtracting(false)
      e.target.value = ''
    }
  }

  const handleExtractTasks = async () => {
    setIsExtracting(true)
    setExtractError(null)
    try {
      const res = await apiFetch('/api/extract-tasks', {
        method: 'POST',
        body: JSON.stringify({ text: importText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Something went wrong.')
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
      }
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirmAll = async () => {
    setIsConfirming(true)
    try {
      const res = await apiFetch('/api/items/bulk', {
        method: 'POST',
        body: JSON.stringify({ tasks: extractedTasks }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(data.error ?? 'Failed to add tasks. Please try again.')
        return
      }
      const newItems: Item[] = data.items.map((item: Item) => ({ ...item, history: [] }))
      onImported(newItems)
      onClose()
    } catch {
      setExtractError('Failed to reach the server. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  const canClose = !isExtracting && !isConfirming

  return (
    <ModalOverlay onClick={() => { if (canClose) onClose() }}>
      <ModalContainer wide={extractedTasks.length > 0} onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>📋 Import Tasks</h2>
          <ModalClose onClick={onClose} aria-label="Close" disabled={!canClose}>&times;</ModalClose>
        </ModalHeader>

        {extractedTasks.length === 0 ? (
          <>
            <ModalBody>
              <ModalHint>Paste your tasks below, or upload a file.</ModalHint>
              <ModalTextarea
                placeholder={'e.g.\n- Fix login bug\n- Update homepage banner\n- Write release notes'}
                value={importText}
                onChange={e => { setImportText(e.target.value); setExtractError(null) }}
                autoFocus
                disabled={isExtracting}
              />
              {extractError && <ExtractError>{extractError}</ExtractError>}
              {isExtracting && (
                <SpinnerRow>
                  <Spinner />
                  <SpinnerLabel>Analysing...</SpinnerLabel>
                </SpinnerRow>
              )}
            </ModalBody>
            <ModalFooter>
              <FileBtnLabel aria-label="Upload file">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload file
                <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} style={{ display: 'none' }} />
              </FileBtnLabel>
              <FileHint>.txt · .pdf · .docx · max 5MB</FileHint>
              <CancelBtn onClick={onClose} disabled={isExtracting}>Cancel</CancelBtn>
              <ProcessBtn onClick={handleExtractTasks} disabled={!importText.trim() || isExtracting}>
                {isExtracting ? 'Analysing...' : 'Process'}
              </ProcessBtn>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody preview>
              {importFileName && (
                <FileSource>📄 Tasks from: <strong>{importFileName}</strong></FileSource>
              )}
              <PreviewCount>
                {extractedTasks.length} task{extractedTasks.length !== 1 ? 's' : ''} found — edit or remove before adding
              </PreviewCount>
              <PreviewList>
                {extractedTasks.map((task, i) => (
                  <TaskPreview
                    key={i}
                    task={task}
                    onChange={updated => setExtractedTasks(prev => prev.map((t, j) => j === i ? updated : t))}
                    onRemove={() => setExtractedTasks(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </PreviewList>
              {extractError && <ExtractError>{extractError}</ExtractError>}
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => { setExtractedTasks([]); setExtractError(null) }} disabled={isConfirming}>Back</CancelBtn>
              <ProcessBtn onClick={handleConfirmAll} disabled={isConfirming || extractedTasks.length === 0}>
                {isConfirming ? <><Spinner inline /> Adding...</> : `Confirm All (${extractedTasks.length})`}
              </ProcessBtn>
            </ModalFooter>
          </>
        )}
      </ModalContainer>
    </ModalOverlay>
  )
}
