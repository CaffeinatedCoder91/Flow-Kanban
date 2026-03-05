import styled from '@emotion/styled'

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: ${p => p.theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Modal = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.xl};
  width: min(480px, calc(100vw - 2rem));
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`
