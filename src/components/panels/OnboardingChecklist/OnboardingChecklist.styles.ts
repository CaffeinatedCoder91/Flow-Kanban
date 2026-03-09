import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const Widget = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: ${p => p.theme.zIndex.modal - 1};
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.lg};
  width: 240px;
  animation: ${slideIn} 0.25s ease;
`

export const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem 0.5rem;
`

export const WidgetTitle = styled.span`
  font-size: 0.8rem;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  color: ${p => p.theme.colors.text};
`

export const DismissBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${p => p.theme.colors.textTertiary};
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;

  &:hover { color: ${p => p.theme.colors.textSecondary}; }
`

export const StepList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0 1rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

export const Step = styled.li<{ done: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${p => p.done ? p.theme.colors.textTertiary : p.theme.colors.text};
  text-decoration: ${p => p.done ? 'line-through' : 'none'};
`

export const StepIcon = styled.span<{ done: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  background: ${p => p.done ? p.theme.colors.success ?? '#22c55e' : 'transparent'};
  border: 1.5px solid ${p => p.done ? p.theme.colors.success ?? '#22c55e' : p.theme.colors.border};
  color: white;
`

export const ProgressBar = styled.div<{ pct: number }>`
  height: 3px;
  background: ${p => p.theme.colors.borderSubtle};
  border-radius: 0 0 ${p => p.theme.borderRadius.xl} ${p => p.theme.borderRadius.xl};
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${p => p.pct}%;
    background: ${p => p.theme.colors.primary};
    transition: width 0.4s ease;
  }
`
