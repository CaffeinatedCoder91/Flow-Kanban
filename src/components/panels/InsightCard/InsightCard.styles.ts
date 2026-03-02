import styled from '@emotion/styled'
import { Insight } from '../../../types'

export const Card = styled.div<{ severity: Insight['severity'] }>`
  display: flex;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
  padding: 0.625rem 0.875rem;
  border-radius: ${p => p.theme.borderRadius.lg};
  border: 1px solid ${p => p.theme.insightSeverity[p.severity]?.border ?? p.theme.colors.border};
  background: ${p => p.theme.insightSeverity[p.severity]?.bg ?? p.theme.colors.surface};
  animation: insight-in 0.16s ease;

  @keyframes insight-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

export const Icon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`

export const Title = styled.span`
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  color: ${p => p.theme.colors.text};
`

export const Description = styled.span`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  line-height: ${p => p.theme.typography.lineHeight.normal};
`

export const ActionBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme.colors.primary};
  font-size: ${p => p.theme.typography.fontSize.xs};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-top: ${p => p.theme.spacing[1]};
  align-self: flex-start;

  &:hover { text-decoration: underline; }
`

export const DismissBtn = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme.colors.textTertiary};
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
  line-height: 1;
  border-radius: ${p => p.theme.borderRadius.sm};
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: ${p => p.theme.colors.textSecondary};
  }
`
