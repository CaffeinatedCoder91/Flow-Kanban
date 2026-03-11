import React from 'react'
import { ProposedTask } from '@/types'

export interface ImportModalProps {
  isExtracting: boolean
  isConfirming: boolean
  importText: string
  importFileName: string | null
  extractedTasks: ProposedTask[]
  extractError: string | null
  closeImportModal: () => void
  setImportText: (text: string) => void
  setExtractError: (error: string | null) => void
  setExtractedTasks: React.Dispatch<React.SetStateAction<ProposedTask[]>>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleExtractTasks: () => void
  handleConfirmAll: () => void
}
