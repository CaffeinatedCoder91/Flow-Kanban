import styled from '@emotion/styled'

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.colors.background};
  padding: 1rem;
`

export const Card = styled.div`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.lg};
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
`

export const AuthLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  justify-content: center;
`

export const AuthWordMark = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${p => p.theme.colors.text};
`

export const Title = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  text-align: center;
`

export const Subtitle = styled.p`
  margin: 0 0 1.75rem;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
`

export const Label = styled.label`
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  color: ${p => p.theme.colors.text};
`

export const Input = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: #6B7280; }
  html.dark &::placeholder { color: ${p => p.theme.colors.textSecondary}; }

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
`

export const ErrorMsg = styled.p`
  margin: 0 0 1rem;
  padding: 0.625rem 0.875rem;
  background: ${p => p.theme.semantic.errorBgSubtle};
  border: 1px solid ${p => p.theme.semantic.errorBorder};
  border-radius: ${p => p.theme.borderRadius.md};
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.dangerDark};
`

export const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.7rem 1rem;
  margin-top: 0.5rem;
  background: #6D28D9;
  color: #fff;
  border: none;
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #5B21B6; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const Footer = styled.p`
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
`

export const FooterLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #6D28D9;
  font-size: inherit;
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;

  html.dark & { color: ${p => p.theme.colors.primaryDark}; }
  &:hover { text-decoration: underline; }
`

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
  color: #6B7280;
  html.dark & { color: ${p => p.theme.colors.textSecondary}; }
  font-size: ${p => p.theme.typography.fontSize.sm};

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${p => p.theme.colors.border};
  }
`

export const GoogleBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.7rem 1rem;
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.text};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.backgroundAlt ?? p.theme.colors.background};
    border-color: ${p => p.theme.colors.borderSubtle};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const GuestBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  margin-top: 0.25rem;
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  border: 1px dashed ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.background};
    border-color: ${p => p.theme.colors.primary};
    color: ${p => p.theme.colors.primary};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

export const DemoHint = styled.p`
  margin: 0.75rem 0 0;
  text-align: center;
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
`
