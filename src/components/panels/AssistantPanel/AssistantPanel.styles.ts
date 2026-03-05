import styled from '@emotion/styled'
import { Message as MsgType } from './AssistantPanel.types'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: ${p => p.theme.zIndex.overlay};
`

export const Panel = styled.aside<{ isOpen: boolean }>`
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

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: ${p => p.theme.colors.surface};
  border-bottom: 1px solid ${p => p.theme.colors.border};
`

export const HeaderIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

export const Avatar = styled.div`
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

export const Title = styled.h2`
  margin: 0;
  font-size: ${p => p.theme.typography.fontSize.lg};
  color: ${p => p.theme.colors.text};
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
`

export const CloseBtn = styled.button`
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

export const Messages = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: ${p => p.theme.colors.background};
`

export const AiRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: flex-start;
  max-width: 90%;
`

export const MsgAvatar = styled.div`
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

export const MessageBubble = styled.div<{ role: MsgType['role'] }>`
  padding: 1rem;
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

export const Markdown = styled.div`
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

export const InlineContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`

export const ErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  font-size: 0.9rem;
`

export const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const ActionIcon = styled.svg`
  color: #10b981;
  flex-shrink: 0;
`

export const ErrorIcon = styled.svg`
  color: #ef4444;
  flex-shrink: 0;
`

export const UserMessageText = styled.p`
  margin: 0;
  line-height: 1.5;
  font-size: 0.875rem;
`

export const RetryBtn = styled.button`
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

export const TypingDot = styled.span`
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

export const TypingIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;

  ${TypingDot}:nth-child(2) { animation-delay: 0.2s; }
  ${TypingDot}:nth-child(3) { animation-delay: 0.4s; }
`

export const Suggestions = styled.div`
  padding: 0 1rem 0.875rem;
  border-top: 1px solid #f0f2f8;
`

export const SuggestionsLabel = styled.p`
  font-size: 0.7rem;
  color: #9499ab;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0.625rem 0 0.5rem;
`

export const SuggestionChip = styled.button`
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

export const InputArea = styled.form`
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: ${p => p.theme.colors.surface};
  border-top: 1px solid ${p => p.theme.colors.border};
`

export const Input = styled.input`
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

export const SendBtn = styled.button`
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
