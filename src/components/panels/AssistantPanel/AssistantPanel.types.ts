let _nextMessageId = 0

export interface Message {
  id: number
  role: 'user' | 'assistant' | 'action' | 'error'
  content: string
  onRetry?: () => void
}

export function createMessage(msg: Omit<Message, 'id'>): Message {
  return { ...msg, id: ++_nextMessageId }
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
