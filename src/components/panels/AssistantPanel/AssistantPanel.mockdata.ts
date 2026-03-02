import { AssistantPanelProps } from './AssistantPanel.types'

const noop = () => {}

export const defaultProps: AssistantPanelProps = {
  isOpen: true,
  onClose: noop,
  onRefresh: noop,
}
