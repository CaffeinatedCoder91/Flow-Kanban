import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useAuth } from '@/context/AuthContext'

export const DemoBanner = (): React.ReactElement | null => {
  const { user, signOut } = useAuth()
  const [closed, setClosed] = useState(false)

  if (!user || !user.user_metadata?.demo || closed) return null

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault()
    await signOut()
    // After sign-out, Root in main.tsx renders the auth screen.
    // Dispatch event so Root can switch directly to the sign-up form.
    document.dispatchEvent(new CustomEvent('flow:show-signup'))
  }

  return (
    <Banner>
      <span>
        You're in demo mode — data resets between sessions.{' '}
        <BannerLink href="#" onClick={handleSignUp}>
          Create a free account
        </BannerLink>{' '}
        to save your work.
      </span>
      <CloseBtn onClick={() => setClosed(true)} aria-label="Dismiss">×</CloseBtn>
    </Banner>
  )
}

const Banner = styled.div`
  position: sticky;
  top: 0;
  z-index: ${p => p.theme.zIndex.panel};
  background: ${p => p.theme.colors.primary};
  color: #fff;
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  padding: 0.5rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`

const BannerLink = styled.a`
  color: #fff;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { opacity: 0.85; }
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
  margin-left: auto;

  &:hover { color: #fff; }
`
