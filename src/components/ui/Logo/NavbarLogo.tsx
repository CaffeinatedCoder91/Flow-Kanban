import styled from '@emotion/styled'
import { Logo } from './Logo'

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`

const WordMark = styled.span`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${p => p.theme.colors.text};
`

interface NavbarLogoProps {
  onClick?: () => void
}

export const NavbarLogo = ({ onClick }: NavbarLogoProps) => (
  <Container onClick={onClick} role="link" aria-label="Go to board">
    <Logo size={28} style={{ marginTop: '3px' }} />
    <WordMark>Flow</WordMark>
  </Container>
)
