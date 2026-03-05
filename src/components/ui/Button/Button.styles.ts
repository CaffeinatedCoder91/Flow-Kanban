import styled from '@emotion/styled'
import type { ButtonVariant, ButtonSize } from './Button.types'

export const ButtonRoot = styled.button<{ variant: ButtonVariant; size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: ${p => p.theme.borderRadius.md};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  line-height: 1;

  ${p => p.size === 'sm' && `
    padding: 0.3rem 0.75rem;
    font-size: ${p.theme.typography.fontSize.xs};
  `}
  ${p => p.size === 'md' && `
    padding: 0.5rem 1rem;
    font-size: ${p.theme.typography.fontSize.sm};
  `}
  ${p => p.size === 'lg' && `
    padding: 0.625rem 1.25rem;
    font-size: ${p.theme.typography.fontSize.sm};
  `}

  ${p => p.variant === 'primary' && `
    background: ${p.theme.colors.primary};
    color: #fff;
    border: none;
    &:hover:not(:disabled) { background: ${p.theme.colors.primaryDark}; }
    &:disabled { background: ${p.theme.colors.borderSubtle}; color: ${p.theme.colors.textTertiary}; cursor: not-allowed; }
  `}

  ${p => p.variant === 'secondary' && `
    background: ${p.theme.colors.surface};
    color: ${p.theme.colors.textSecondary};
    border: 1px solid ${p.theme.colors.border};
    &:hover:not(:disabled) { background: ${p.theme.colors.background}; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `}

  ${p => p.variant === 'ghost' && `
    background: none;
    color: ${p.theme.colors.textSecondary};
    border: none;
    &:hover:not(:disabled) { background: ${p.theme.colors.background}; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  `}
`

export const ButtonSpinner = styled.span`
  display: inline-block;
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;

  @keyframes btn-spin { to { transform: rotate(360deg); } }
`
