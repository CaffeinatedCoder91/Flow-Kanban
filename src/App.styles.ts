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

export const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
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
    > button { flex: 1; text-align: center; }
  }
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

export const Toast = styled.div<{ error?: boolean }>`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  background: ${p => (p.error ? '#1c1917' : '#1a1a2e')};
  color: #fff;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  padding: 0.75rem 1.125rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  z-index: ${p => p.theme.zIndex.toast};
  pointer-events: ${p => (p.error ? 'auto' : 'none')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: toast-in 0.2s ease${p => p.error ? ', shake 0.18s ease 0.12s' : ', toast-out 0.3s ease 2.7s forwards'};

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(4px); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    18%       { transform: translateX(-5px); }
    36%       { transform: translateX(5px); }
    54%       { transform: translateX(-4px); }
    72%       { transform: translateX(4px); }
    90%       { transform: translateX(-2px); }
  }
`

export const ColumnDot = styled.span<{ accentColor: string }>`
  background-color: ${p => p.accentColor};
`

export const SkeletonLineVar = styled.div<{ $width: string }>`
  width: ${p => p.$width};
`

export const NoMarginSpinner = styled.span`
  margin-right: 0;
`

export const SignOutBtn = styled.button`
  font-size: 0.8rem;
`

export const UserAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${p => p.theme.colors.primary};
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  cursor: default;
  user-select: none;
`

export const HiddenFileInput = styled.input`
  display: none;
`

export const ToastRetryBtn = styled.button`
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  padding: 0.25rem 0.7rem;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 0.25rem;
  transition: background 0.15s;

  &:hover { background: rgba(255,255,255,0.22); }
`
