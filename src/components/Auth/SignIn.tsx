// src/components/Auth/SignIn.tsx
// Email + password sign-in form using Supabase auth.

import React, { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Page, Card, AuthLogo, AuthWordMark,
  Title, Subtitle,
  ErrorMsg, GuestBtn, Footer, FooterLink, DemoHint,
} from './SignIn.styles'
import { Logo } from '@/components/ui/Logo/Logo'
import { signInAsGuest } from '@/lib/guestLogin'

interface SignInProps {
  onSwitchToSignUp: () => void
}

export const SignIn = ({ onSwitchToSignUp }: SignInProps): React.ReactElement => {
  const { signIn } = useAuth()

  const [error, setError]             = useState<string | null>(null)
  const [guestLoading, setGuestLoading] = useState(false)
  const isDev = import.meta.env.MODE === 'development'
  const hasDevCreds = !!import.meta.env.VITE_DEMO_PASSWORD

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    setError(null)
    try {
      const { error } = await signInAsGuest()
      if (error) {
        console.error('Guest login error:', error.message)
        const msg = error.message?.includes('Invalid login credentials')
          ? (isDev && hasDevCreds
              ? 'Demo login failed: invalid credentials. Check VITE_DEMO_EMAIL/VITE_DEMO_PASSWORD and the Supabase demo user.'
              : 'Demo login failed. Please try again.')
          : error.message || 'Demo login unavailable. Please try again.'
        setError(msg)
      }
      // On success, AuthContext picks up the new session automatically.
    } catch (err) {
      console.error('Guest login exception:', err)
      setError('Demo login unavailable. Please try again or sign in.')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <Page>
      <Card>
        <AuthLogo>
          <Logo size={32} />
          <AuthWordMark>Flow</AuthWordMark>
        </AuthLogo>

        <Title>Welcome back</Title>
        <Subtitle>Start a fresh demo board in one click</Subtitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <GuestBtn type="button" onClick={handleGuestLogin} disabled={guestLoading}>
          {guestLoading ? 'Loading…' : '▶ Try demo'}
        </GuestBtn>
        <DemoHint>No email or password required</DemoHint>

        <Footer>
          Want to save your work?{' '}
          <FooterLink type="button" onClick={onSwitchToSignUp}>
            Create an account
          </FooterLink>
        </Footer>
      </Card>
    </Page>
  )
}
