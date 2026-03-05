import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

export const LoadingRoot = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.colors.background};
`

export const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${p => p.theme.colors.border};
  border-top-color: ${p => p.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

export const ErrorRoot = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.text};
  font-family: system-ui, sans-serif;
`

export const ErrorMessage = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${p => p.theme.colors.textSecondary};
`

export const RefreshBtn = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${p => p.theme.borderRadius.md};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
`
