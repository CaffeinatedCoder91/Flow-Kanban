import React from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
`

const Root = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
  text-align: center;
`

const Illustration = styled.svg`
  animation: ${float} 3s ease-in-out infinite;
  opacity: 0.18;
  margin-bottom: 0.5rem;
`

const Heading = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text);
`

const Sub = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: var(--c-text-2);
`

const BackBtn = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--c-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--c-primary-dark); }
`

interface NotFoundProps {
  onBack?: () => void
}

export function NotFound({ onBack }: NotFoundProps) {
  return (
    <Root>
      <Illustration width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" /><line x1="11" y1="16" x2="11.01" y2="16" />
      </Illustration>
      <Heading>This page doesn't exist</Heading>
      <Sub>You may have followed a broken link, or the page was moved.</Sub>
      {onBack && <BackBtn onClick={onBack}>Go to your board</BackBtn>}
    </Root>
  )
}
