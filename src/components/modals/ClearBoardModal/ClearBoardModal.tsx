import { ClearBoardModalProps } from './ClearBoardModal.types'
import {
  Overlay, Container, Icon, Title, Body, Footer, CancelBtn, ConfirmBtn,
} from './ClearBoardModal.styles'

export default function ClearBoardModal({ itemCount, onConfirm, onClose }: ClearBoardModalProps) {
  return (
    <Overlay onClick={onClose}>
      <Container onClick={e => e.stopPropagation()}>
        <Icon>🗑️</Icon>
        <Title>Clear the board?</Title>
        <Body>
          This will permanently delete {itemCount} task{itemCount !== 1 ? 's' : ''}. This action cannot be undone.
        </Body>
        <Footer>
          <CancelBtn onClick={onClose}>Cancel</CancelBtn>
          <ConfirmBtn onClick={onConfirm}>Clear board</ConfirmBtn>
        </Footer>
      </Container>
    </Overlay>
  )
}
