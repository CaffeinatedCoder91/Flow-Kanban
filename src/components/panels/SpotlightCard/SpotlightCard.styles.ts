import styled from '@emotion/styled'

export const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${p => p.theme.spacing[2]};
  padding: 0.625rem 0.875rem;
  border-radius: ${p => p.theme.borderRadius.lg};
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
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

export const Label = styled.span`
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  color: ${p => p.theme.colors.text};
`

export const TaskLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  color: #059669;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { color: #047857; }
`

export const Reason = styled.span`
  font-size: ${p => p.theme.typography.fontSize.xs};
  color: ${p => p.theme.colors.textSecondary};
  line-height: ${p => p.theme.typography.lineHeight.normal};
`

export const StartBtn = styled.button`
  margin-top: 0.35rem;
  padding: 0.3rem 0.7rem;
  font-size: ${p => p.theme.typography.fontSize.xs};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  border: none;
  border-radius: 5px;
  background: ${p => p.theme.colors.success};
  color: white;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.15s;

  &:hover { background: ${p => p.theme.colors.successDark}; }
`
