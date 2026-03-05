import styled from '@emotion/styled'

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ModalContainer = styled.div<{ wide?: boolean }>`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: ${p => (p.wide ? 'min(860px, 92vw)' : '560px')};
  max-width: ${p => (p.wide ? 'unset' : 'calc(100vw - 2rem)')};
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    ${p => p.wide && 'width: min(860px, 96vw);'}
  }
  @media (max-width: 767px) {
    ${p => p.wide
      ? 'width: calc(100vw - 1rem);'
      : 'max-width: calc(100vw - 1rem); border-radius: 8px;'}
  }
`

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};

  h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: ${p => p.theme.colors.text}; }

  @media (max-width: 767px) { padding-left: 1rem; padding-right: 1rem; }
`

export const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${p => p.theme.borderRadius.md};
  transition: background 0.15s, color 0.15s;

  &:hover { background: ${p => p.theme.colors.background}; color: ${p => p.theme.colors.textSecondary}; }
`

export const ModalBody = styled.div<{ preview?: boolean }>`
  padding: 1.25rem 1.5rem;
  ${p => p.preview && 'padding-bottom: 0;'}
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: 767px) { padding-left: 1rem; padding-right: 1rem; }
`

export const ModalHint = styled.p`
  margin: 0;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
`

export const ModalTextarea = styled.textarea`
  width: 100%;
  height: clamp(120px, 25vh, 200px);
  padding: 0.75rem;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }
`

export const ExtractError = styled.p`
  margin-top: 0.625rem;
  font-size: 0.8125rem;
  color: ${p => p.theme.colors.dangerDark};
`

export const SpinnerRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.theme.spacing[2]};
  margin-top: 0.75rem;
`

export const Spinner = styled.span<{ inline?: boolean }>`
  display: inline-block;
  width: ${p => (p.inline ? '13px' : '16px')};
  height: ${p => (p.inline ? '13px' : '16px')};
  ${p => p.inline && 'margin-right: 0.4rem; vertical-align: middle;'}
  flex-shrink: 0;
  border: 2px solid #e0d7f7;
  border-top-color: ${p => p.theme.colors.primary};
  border-radius: ${p => p.theme.borderRadius.full};
  animation: modal-spin 0.7s linear infinite;

  @keyframes modal-spin { to { transform: rotate(360deg); } }
`

export const SpinnerLabel = styled.span`
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.primary};
`

export const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${p => p.theme.colors.border};

  @media (max-width: 767px) {
    flex-direction: row;
    gap: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
`

export const HiddenFileInput = styled.input`
  display: none;
`

export const FileBtnLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;

  &:hover { background: ${p => p.theme.colors.background}; border-color: #c4c8d8; }
`

export const FileHint = styled.span`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textTertiary};
  white-space: nowrap;
  flex: 1;
`

export const FileSource = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${p => p.theme.colors.textSecondary};

  strong { color: ${p => p.theme.colors.text}; }
`

export const PreviewCount = styled.p`
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: #555;
  margin: 0 0 0.875rem;
`

export const PreviewList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-bottom: 1rem;

  @media (max-width: 767px) { grid-template-columns: 1fr; max-height: 55vh; }
`

export const CancelBtn = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.textSecondary};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.background}; }

  @media (max-width: 767px) { flex: 1; text-align: center; }
`

export const ProcessBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.primaryDark}; }
  &:disabled { background: ${p => p.theme.colors.borderSubtle}; cursor: not-allowed; }

  @media (max-width: 767px) { flex: 1; text-align: center; }
`
