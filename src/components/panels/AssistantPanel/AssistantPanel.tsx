import React, { useState, FormEvent, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import { AssistantPanelProps, Message } from './AssistantPanel.types'
import { ERROR_MESSAGES } from '@/lib/errors'
import {
  Overlay, Panel, Header, HeaderIdentity, Avatar, Title, CloseBtn,
  Messages, AiRow, MsgAvatar, MessageBubble, Markdown, InlineContent,
  ErrorContent, ErrorRow, ActionIcon, ErrorIcon, UserMessageText,
  RetryBtn, TypingDot, TypingIndicator, Suggestions, SuggestionsLabel,
  SuggestionChip, InputArea, Input, SendBtn,
} from './AssistantPanel.styles'

const SUGGESTIONS = [
  'What should I work on next?',
  'Any blocked or overdue tasks?',
  'Summarise my progress this week',
  'Help me break down a large task',
]

export const AssistantPanel = ({
  isOpen, onClose, onRefresh, prefillMessage, onPrefillConsumed,
  proactiveMessages, onProactiveConsumed,
}: AssistantPanelProps): React.ReactElement => {
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
      const boardResponse = await apiFetch('/api/items')
      const boardState = await boardResponse.json()
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, items: boardState }),
      })
      const data = await response.json()
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
        content: ERROR_MESSAGES.NETWORK,
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
                <MessageBubble role="assistant">
                  <Markdown><ReactMarkdown>{message.content}</ReactMarkdown></Markdown>
                </MessageBubble>
              </AiRow>
            ) : (
              <MessageBubble key={index} role={message.role}>
                {message.role === 'action' ? (
                  <InlineContent>
                    <ActionIcon width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </ActionIcon>
                    <span>{message.content}</span>
                  </InlineContent>
                ) : message.role === 'error' ? (
                  <ErrorContent>
                    <ErrorRow>
                      <ErrorIcon width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </ErrorIcon>
                      <span>{message.content}</span>
                    </ErrorRow>
                    {message.onRetry && <RetryBtn onClick={message.onRetry}>Try again</RetryBtn>}
                  </ErrorContent>
                ) : (
                  <UserMessageText>{message.content}</UserMessageText>
                )}
              </MessageBubble>
            )
          )}
          {isLoading && (
            <AiRow>
              <MsgAvatar>✦</MsgAvatar>
              <MessageBubble role="assistant">
                <TypingIndicator>
                  <TypingDot /><TypingDot /><TypingDot />
                </TypingIndicator>
              </MessageBubble>
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
