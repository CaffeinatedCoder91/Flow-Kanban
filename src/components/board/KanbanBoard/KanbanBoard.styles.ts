import styled from '@emotion/styled'

export const BoardContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  overflow-x: auto;
  flex: 1;
  align-items: flex-start;
`

export const EmptyBoardState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 4rem 2rem;
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};

  h3 {
    margin: 1rem 0 0.5rem;
    font-size: 1.125rem;
    color: ${p => p.theme.colors.text};
  }

  p {
    margin: 0;
    font-size: ${p => p.theme.typography.fontSize.sm};
    max-width: 320px;
  }
`
