export interface Message {
  role: 'user' | 'assistant' | 'action' | 'error'
  content: string
  onRetry?: () => void
}

export interface AssistantPanelProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  prefillMessage?: string
  onPrefillConsumed?: () => void
  proactiveMessages?: string[]
  onProactiveConsumed?: () => void
}
