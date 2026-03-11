import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { ERROR_MESSAGES, getApiErrorMessage } from '@/lib/errors'
import { Item, ProposedTask } from '@/types'

interface UseImportTasksParams {
  setItems: React.Dispatch<React.SetStateAction<Item[]>>
  showImportSuccess: (message: string) => void
  onImported: () => void
}

export function useImportTasks({ setItems, showImportSuccess, onImported }: UseImportTasksParams) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<ProposedTask[]>([])
  const [extractError, setExtractError] = useState<string | null>(null)

  const resetImportState = useCallback(() => {
    setImportText('')
    setImportFileName(null)
    setExtractedTasks([])
    setExtractError(null)
    setIsExtracting(false)
    setIsConfirming(false)
  }, [])

  const closeImportModal = useCallback(() => {
    setIsImportOpen(false)
    resetImportState()
  }, [resetImportState])

  const openImportModal = useCallback(() => {
    resetImportState()
    setIsImportOpen(true)
  }, [resetImportState])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedExts = ['.txt', '.pdf', '.docx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExts.includes(ext)) {
      setExtractError(ERROR_MESSAGES.FILE_TYPE)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setExtractError(ERROR_MESSAGES.FILE_SIZE)
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
        setExtractError(getApiErrorMessage(res.status, data.error))
        setImportFileName(null)
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
        setImportFileName(null)
      }
    } catch {
      setExtractError(ERROR_MESSAGES.SERVER)
      setImportFileName(null)
    } finally {
      setIsExtracting(false)
      e.target.value = ''
    }
  }, [])

  const handleExtractTasks = useCallback(async () => {
    setIsExtracting(true)
    setExtractError(null)
    try {
      const res = await apiFetch('/api/extract-tasks', {
        method: 'POST',
        body: JSON.stringify({ text: importText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(getApiErrorMessage(res.status, data.error))
        return
      }
      setExtractedTasks(data.tasks ?? [])
      if ((data.tasks ?? []).length === 0 && data.message) {
        setExtractError(data.message)
      }
    } catch {
      setExtractError(ERROR_MESSAGES.SERVER)
    } finally {
      setIsExtracting(false)
    }
  }, [importText])

  const handleConfirmAll = useCallback(async () => {
    setIsConfirming(true)
    try {
      const res = await apiFetch('/api/items/bulk', {
        method: 'POST',
        body: JSON.stringify({ tasks: extractedTasks }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExtractError(getApiErrorMessage(res.status, data.error))
        return
      }
      const count = data.items.length
      setItems(prev => [...prev, ...data.items.map((item: Item) => ({ ...item, history: [] }))])
      closeImportModal()
      showImportSuccess(`✓ Added ${count} task${count !== 1 ? 's' : ''} from imported text`)
      onImported()
    } catch {
      setExtractError(ERROR_MESSAGES.SERVER)
    } finally {
      setIsConfirming(false)
    }
  }, [extractedTasks, setItems, closeImportModal, showImportSuccess, onImported])

  return {
    isImportOpen,
    importText,
    setImportText,
    importFileName,
    isExtracting,
    isConfirming,
    extractedTasks,
    setExtractedTasks,
    extractError,
    setExtractError,
    openImportModal,
    closeImportModal,
    handleFileUpload,
    handleExtractTasks,
    handleConfirmAll,
  }
}
