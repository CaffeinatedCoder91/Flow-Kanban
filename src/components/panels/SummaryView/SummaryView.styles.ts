import styled from '@emotion/styled'

export const ProgressCircle = styled('circle')`
  transition: stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1);
`

export const SentimentChip = styled.div<{ accentColor: string }>`
  background: ${p => `${p.accentColor}22`};
  color: ${p => p.accentColor};
`

export const SentimentDot = styled.span<{ accentColor: string }>`
  background: ${p => p.accentColor};
`

export const TrendIndicator = styled.div<{ accentColor: string }>`
  color: ${p => p.accentColor};
`

export const MutedText = styled.p`
  color: #9ca3af;
`

export const StatValueSpan = styled.span<{ accentColor?: string }>`
  color: ${p => p.accentColor ?? 'inherit'};
`
