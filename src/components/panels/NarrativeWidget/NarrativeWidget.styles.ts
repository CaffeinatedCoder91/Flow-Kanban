import styled from '@emotion/styled'

export const WidgetBadge = styled.div<{ accentColor: string }>`
  background: ${p => `${p.accentColor}18`};
  color: ${p => p.accentColor};
`

export const WidgetDot = styled.span<{ accentColor: string }>`
  background: ${p => p.accentColor};
`

export const SkeletonLineWide = styled.div`
  width: 82%;
`

export const SkeletonLineNarrow = styled.div`
  width: 55%;
`
