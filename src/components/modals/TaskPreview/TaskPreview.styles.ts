import styled from '@emotion/styled'

export const PreviewCard = styled.div<{ accentColor: string }>`
  border-left-color: ${p => p.accentColor};
`

export const ColorSwatch = styled.div<{ accentColor: string }>`
  background-color: ${p => p.accentColor};
`

export const PaletteBtn = styled.button<{ accentColor: string }>`
  background-color: ${p => p.accentColor};
`
