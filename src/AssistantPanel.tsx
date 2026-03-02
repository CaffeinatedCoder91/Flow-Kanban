import { useState, FormEvent, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import styled from '@emotion/styled'

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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: ${p => p.theme.zIndex.overlay};
`

const Panel = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: ${p => p.theme.colors.background};
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: ${p => p.theme.zIndex.panel};
  transform: translateX(${p => (p.isOpen ? '0' : '100%')});
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) { width: 100vw; }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: ${p => p.theme.colors.surface};
  border-bottom: 1px solid ${p => p.theme.colors.border};
`

const HeaderIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${p => p.theme.borderRadius.full};
  background: ${p => p.theme.colors.primary};
  color: #fff;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
`

const Title = styled.h2`
  margin: 0;
  font-size: ${p => p.theme.typography.fontSize.lg};
  color: ${p => p.theme.colors.text};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  padding: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${p => p.theme.borderRadius.md};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.background};
    color: ${p => p.theme.colors.textSecondary};
  }
`

const Messages = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: ${p => p.theme.colors.background};
`

const AiRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: flex-start;
  max-width: 90%;
`

const MsgAvatar = styled.div`
  width: 22px;
  height: 22px;
  border-radius: ${p => p.theme.borderRadius.full};
  background: ${p => p.theme.colors.primary};
  color: #fff;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.6rem;
  user-select: none;
`

const Message = styled.div<{ role: Message['role'] }>`
  padding: 0.875rem 1rem;
  border-radius: ${p => p.theme.borderRadius.lg};
  max-width: 85%;
  border: 1px solid transparent;

  ${p => p.role === 'assistant' && `
    background: ${p.theme.colors.surface};
    color: ${p.theme.colors.text};
    border-color: ${p.theme.colors.border};
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  `}
  ${p => p.role === 'user' && `
    background: ${p.theme.colors.primaryLight};
    color: ${p.theme.colors.text};
    align-self: flex-end;
    border-color: ${p.theme.colors.primaryBorder};
  `}
  ${p => p.role === 'action' && `
    background: #e6f7ed;
    color: ${p.theme.colors.text};
    align-self: flex-start;
    border-color: #b3e6c8;
    padding: 0.6rem 1rem;
  `}
  ${p => p.role === 'error' && `
    background: #fef2f2;
    color: ${p.theme.colors.text};
    align-self: flex-start;
    border-color: #fecaca;
    padding: 0.6rem 1rem;
  `}
`

const Markdown = styled.div`
  line-height: ${p => p.theme.typography.lineHeight.relaxed};
  font-size: ${p => p.theme.typography.fontSize.sm};

  p { margin: 0 0 0.75rem 0; }
  p:last-child { margin-bottom: 0; }

  h1, h2, h3, h4 {
    margin: 1rem 0 0.5rem 0;
    font-weight: ${p => p.theme.typography.fontWeight.semibold};
    color: ${p => p.theme.colors.text};
    line-height: ${p => p.theme.typography.lineHeight.tight};
  }
  h1:first-child, h2:first-child, h3:first-child, h4:first-child { margin-top: 0; }
  h1 { font-size: 1.25rem; }
  h2 { font-size: 1.125rem; }
  h3 { font-size: 1rem; }
  h4 { font-size: 0.875rem; }

  ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
  li { margin: 0.25rem 0; }

  code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: ${p => p.theme.borderRadius.sm};
    font-family: ${p => p.theme.typography.fontFamilyMono};
    font-size: 0.8125rem;
    color: ${p => p.theme.colors.text};
  }

  pre {
    background: #f3f4f6;
    border: 1px solid ${p => p.theme.colors.border};
    border-radius: ${p => p.theme.borderRadius.md};
    padding: 0.75rem 1rem;
    margin: 0.75rem 0;
    overflow-x: auto;
  }
  pre code { background: transparent; padding: 0; border-radius: 0; font-size: 0.8125rem; }

  blockquote {
    margin: 0.75rem 0;
    padding-left: 1rem;
    border-left: 3px solid ${p => p.theme.colors.primary};
    color: ${p => p.theme.colors.textSecondary};
    font-style: italic;
  }

  strong { font-weight: ${p => p.theme.typography.fontWeight.semibold}; color: ${p => p.theme.colors.text}; }
  em { font-style: italic; }
  a { color: ${p => p.theme.colors.primary}; text-decoration: none; }
  a:hover { text-decoration: underline; }
`

const InlineContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`

const RetryBtn = styled.button`
  display: block;
  margin-top: 0.35rem;
  background: none;
  border: 1px solid #fca5a5;
  color: ${p => p.theme.colors.dangerDark};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  font-family: inherit;
  padding: 0.2rem 0.6rem;
  border-radius: ${p => p.theme.borderRadius.sm};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #fee2e2; }
`

const TypingDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: ${p => p.theme.borderRadius.full};
  background: ${p => p.theme.colors.textTertiary};
  animation: typing-bounce 1.4s infinite;

  @keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30%            { transform: translateY(-6px); opacity: 1; }
  }
`

const TypingIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;

  ${TypingDot}:nth-child(2) { animation-delay: 0.2s; }
  ${TypingDot}:nth-child(3) { animation-delay: 0.4s; }
`

const Suggestions = styled.div`
  padding: 0 1rem 0.875rem;
  border-top: 1px solid #f0f2f8;
`

const SuggestionsLabel = styled.p`
  font-size: 0.7rem;
  color: #9499ab;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0.625rem 0 0.5rem;
`

const SuggestionChip = styled.button`
  display: inline-block;
  margin: 0.25rem 0.3rem 0.25rem 0;
  padding: 0.35rem 0.8rem;
  background: #f3f0ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: left;

  &:hover { background: #ede9fe; border-color: #c4b5fd; }
  &:disabled { opacity: 0.5; cursor: default; }
`

const InputArea = styled.form`
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: ${p => p.theme.colors.surface};
  border-top: 1px solid ${p => p.theme.colors.border};
`

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid ${p => p.theme.colors.borderSubtle};
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: ${p => p.theme.colors.textTertiary}; }

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`

const SendBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: ${p => p.theme.borderRadius.lg};
  background: ${p => p.theme.colors.primary};
  color: white;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${p => p.theme.colors.primaryDark};
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
  }
  &:disabled { background: ${p => p.theme.colors.borderSubtle}; cursor: not-allowed; box-shadow: none; }
`

const SUGGESTIONS = [
  'Show me high priority tasks',
  'Create a task from this email',
  'What should I work on next?',
  'Summarize my week',
]

export default function AssistantPanel({
  isOpen, onClose, onRefresh, prefillMessage, onPrefillConsumed,
  proactiveMessages, onProactiveConsumed,
}: AssistantPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey, I'm Flow. What's on your mind?" },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const lastUserMessageRef = useRef('')

  useEffect(() => {
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
    const el = e.currentTarget
    shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
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
      if (data.errors?.length > 0) {
        setMessages(prev => [...prev, ...data.errors.map((e: string) => ({ role: 'error' as const, content: e }))])
      }
      if (data.actions?.length > 0) {
        setMessages(prev => [...prev, ...data.actions.map((a: string) => ({ role: 'action' as const, content: a }))])
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
      {isOpen && <Overlay data-testid="assistant-overlay" onClick={onClose} />}
      <Panel data-testid="assistant-panel" data-open={isOpen} isOpen={isOpen}>
        <Header>
          <HeaderIdentity>
            <Avatar>✦</Avatar>
            <Title>Flow</Title>
          </HeaderIdentity>
          <CloseBtn onClick={onClose} aria-label="Close">×</CloseBtn>
        </Header>

        <Messages onScroll={handleScroll}>
          {messages.map((message, index) =>
            message.role === 'assistant' ? (
              <AiRow key={index}>
                <MsgAvatar>✦</MsgAvatar>
                <Message role="assistant">
                  <Markdown><ReactMarkdown>{message.content}</ReactMarkdown></Markdown>
                </Message>
              </AiRow>
            ) : (
              <Message key={index} role={message.role}>
                {message.role === 'action' ? (
                  <InlineContent>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981', flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{message.content}</span>
                  </InlineContent>
                ) : message.role === 'error' ? (
                  <InlineContent style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444', flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{message.content}</span>
                    </div>
                    {message.onRetry && <RetryBtn onClick={message.onRetry}>Try again</RetryBtn>}
                  </InlineContent>
                ) : (
                  <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.875rem' }}>{message.content}</p>
                )}
              </Message>
            )
          )}
          {isLoading && (
            <AiRow>
              <MsgAvatar>✦</MsgAvatar>
              <Message role="assistant" style={{ padding: '1rem' }}>
                <TypingIndicator>
                  <TypingDot /><TypingDot /><TypingDot />
                </TypingIndicator>
              </Message>
            </AiRow>
          )}
          <div ref={messagesEndRef} />
        </Messages>

        {messages.length === 1 && !isLoading && (
          <Suggestions>
            <SuggestionsLabel>Try asking</SuggestionsLabel>
            {SUGGESTIONS.map(s => (
              <SuggestionChip key={s} onClick={() => handleChipClick(s)} disabled={isSending}>{s}</SuggestionChip>
            ))}
          </Suggestions>
        )}

        <InputArea onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Ask me anything about your tasks..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isSending}
          />
          <SendBtn type="submit" aria-label="Send message" disabled={isSending || !inputValue.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </SendBtn>
        </InputArea>
      </Panel>
    </>
  )
}
