import styled from '@emotion/styled'

export const WelcomeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const WelcomeModal = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: min(420px, calc(100vw - 2rem));
  text-align: center;
  display: flex;
  flex-direction: column;
`
