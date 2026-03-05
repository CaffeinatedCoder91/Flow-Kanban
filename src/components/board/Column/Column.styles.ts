import styled from '@emotion/styled'

export const ColumnDot = styled.span<{ accentColor: string }>`
  width: 10px;
  height: 10px;
  border-radius: ${p => p.theme.borderRadius.full};
  background: ${p => p.accentColor};
  flex-shrink: 0;
`
