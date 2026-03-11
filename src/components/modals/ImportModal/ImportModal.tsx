import React from 'react'
import { Button } from '@/components/ui/Button'
import { TaskPreview } from '@/components/modals/TaskPreview'
import { ImportModalProps } from './ImportModal.types'
import {
  ModalOverlay, ModalContainer, ModalHeader, ModalClose, ModalBody,
  ModalHint, ModalTextarea, ExtractError, SpinnerRow, Spinner, SpinnerLabel,
  ModalFooter, HiddenFileInput, FileBtnLabel, FileHint, FileSource,
  PreviewCount, PreviewList,
} from './ImportModal.styles'

export const ImportModal = ({
  isExtracting, isConfirming,
  importText, importFileName, extractedTasks, extractError,
  closeImportModal, setImportText, setExtractError, setExtractedTasks,
  handleFileUpload, handleExtractTasks, handleConfirmAll,
}: ImportModalProps): React.ReactElement => {
  const canClose = !isExtracting && !isConfirming

  return (
    <ModalOverlay onClick={() => { if (canClose) closeImportModal() }}>
      <ModalContainer wide={extractedTasks.length > 0} onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>📋 Import Tasks</h2>
          <ModalClose onClick={closeImportModal} aria-label="Close" disabled={!canClose}>&times;</ModalClose>
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
                <HiddenFileInput type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} />
              </FileBtnLabel>
              <FileHint>.txt · .pdf · .docx · max 5MB</FileHint>
              <Button variant="secondary" onClick={closeImportModal} disabled={isExtracting}>Cancel</Button>
              <Button variant="primary" onClick={handleExtractTasks} disabled={!importText.trim() || isExtracting} loading={isExtracting}>
                {isExtracting ? 'Analysing...' : 'Process'}
              </Button>
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
              <Button variant="secondary" onClick={() => { setExtractedTasks([]); setExtractError(null) }} disabled={isConfirming}>Back</Button>
              <Button variant="primary" onClick={handleConfirmAll} disabled={isConfirming || extractedTasks.length === 0} loading={isConfirming}>
                {isConfirming ? 'Adding...' : `Confirm All (${extractedTasks.length})`}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContainer>
    </ModalOverlay>
  )
}
