import styled from '@emotion/styled'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Container = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: 480px;
  max-width: calc(100vw - 2rem);
  display: flex;
  flex-direction: column;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};

  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`

export const CloseBtn = styled.button`
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

export const Body = styled.div`
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

export const FieldLabel = styled.label`
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  color: ${p => p.theme.colors.text};
`

export const TextInput = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: ${p => p.theme.colors.textTertiary}; }
  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }
`

export const Textarea = styled.textarea`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  outline: none;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  box-sizing: border-box;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: ${p => p.theme.colors.textTertiary}; }
  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }
`

export const Select = styled.select`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
  }
`

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${p => p.theme.colors.border};
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
`

export const SubmitBtn = styled.button`
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
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`
