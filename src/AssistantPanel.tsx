import { useState, FormEvent, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant' | 'action' | 'error'
  content: string
  onRetry?: () => void
}

interface AssistantPanelProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  prefillMessage?: string
  onPrefillConsumed?: () => void
  proactiveMessages?: string[]
  onProactiveConsumed?: () => void
}

export default function AssistantPanel({ isOpen, onClose, onRefresh, prefillMessage, onPrefillConsumed, proactiveMessages, onProactiveConsumed }: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey, I'm Flow. What's on your mind?"
    }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const lastUserMessageRef = useRef('')

  useEffect(() => {
    // Only auto-scroll if we should (user hasn't manually scrolled up)
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (prefillMessage && isOpen) {
      setInputValue(prefillMessage)
      onPrefillConsumed?.()
    }
  }, [prefillMessage, isOpen])

  useEffect(() => {
    if (!proactiveMessages || proactiveMessages.length === 0) return
    setMessages(prev => [
      ...prev,
      ...proactiveMessages.map(content => ({ role: 'assistant' as const, content })),
    ])
    shouldAutoScrollRef.current = true
    onProactiveConsumed?.()
  }, [proactiveMessages])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50
    shouldAutoScrollRef.current = isAtBottom
  }

  const sendMessage = async (userMessage: string) => {
    setIsSending(true)
    setIsLoading(true)
    try {
      const boardResponse = await fetch('/api/items')
      const boardState = await boardResponse.json()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, items: boardState }),
      })

      const data = await response.json()
      console.log('AI Response:', data)

      if (data.errors && data.errors.length > 0) {
        setMessages(prev => [
          ...prev,
          ...data.errors.map((error: string) => ({ role: 'error' as const, content: error })),
        ])
      }

      if (data.actions && data.actions.length > 0) {
        setMessages(prev => [
          ...prev,
          ...data.actions.map((action: string) => ({ role: 'action' as const, content: action })),
        ])
      }

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }

      onRefresh()
    } catch {
      const retry = () => {
        setMessages(prev => prev.filter(m => !m.onRetry))
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        sendMessage(userMessage)
      }
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'AI is unavailable — check your connection',
        onRetry: retry,
      }])
    } finally {
      setIsSending(false)
      setIsLoading(false)
    }
  }

  const handleChipClick = (suggestion: string) => {
    setMessages(prev => [...prev, { role: 'user', content: suggestion }])
    sendMessage(suggestion)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSending) return
    const userMessage = inputValue.trim()
    setInputValue('')
    lastUserMessageRef.current = userMessage
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    sendMessage(userMessage)
  }
  return (
    <>
      {isOpen && <div className="assistant-overlay" onClick={onClose} />}
      <div className={`assistant-panel${isOpen ? ' assistant-panel-open' : ''}`}>
        <div className="assistant-header">
          <div className="assistant-header-identity">
            <div className="assistant-avatar">✦</div>
            <h2>Flow</h2>
          </div>
          <button className="assistant-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="assistant-messages" onScroll={handleScroll}>
          {messages.map((message, index) => (
            message.role === 'assistant' ? (
              <div key={index} className="assistant-ai-row">
                <div className="assistant-msg-avatar">✦</div>
                <div className="assistant-message assistant-message-ai">
                  <div className="assistant-markdown">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={index}
                className={`assistant-message ${
                  message.role === 'action'
                    ? 'assistant-message-action'
                    : message.role === 'error'
                    ? 'assistant-message-error'
                    : 'assistant-message-user'
                }`}
              >
                {message.role === 'action' ? (
                  <div className="assistant-action">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{message.content}</span>
                  </div>
                ) : message.role === 'error' ? (
                  <div className="assistant-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <span>{message.content}</span>
                      {message.onRetry && (
                        <button className="assistant-retry-btn" onClick={message.onRetry}>Try again</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            )
          ))}
          {isLoading && (
            <div className="assistant-ai-row">
              <div className="assistant-msg-avatar">✦</div>
              <div className="assistant-message assistant-message-ai assistant-typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {messages.length === 1 && !isLoading && (
          <div className="assistant-suggestions">
            <p className="assistant-suggestions-label">Try asking</p>
            {['Show me high priority tasks', 'Create a task from this email', 'What should I work on next?', 'Summarize my week'].map(s => (
              <button key={s} className="assistant-suggestion-chip" onClick={() => handleChipClick(s)} disabled={isSending}>
                {s}
              </button>
            ))}
          </div>
        )}
        <form className="assistant-input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            className="assistant-input"
            placeholder="Ask me anything about your tasks..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="assistant-send-btn"
            aria-label="Send message"
            disabled={isSending || !inputValue.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}
