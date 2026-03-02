import styled from '@emotion/styled'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Container = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: 420px;
  max-width: calc(100vw - 2rem);
  padding: 2rem 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const Icon = styled.div`
  font-size: 2rem;
  text-align: center;
`

export const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  text-align: center;
`

export const Body = styled.p`
  margin: 0;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  line-height: 1.5;
`

export const Footer = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
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

export const ConfirmBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: ${p => p.theme.borderRadius.md};
  background: ${p => p.theme.colors.danger};
  color: white;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.dangerDark}; }
`
