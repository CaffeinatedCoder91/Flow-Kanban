// src/components/Auth/SignIn.tsx
// Email + password sign-in form using Supabase auth.

import React, { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseBrowser'
import {
  Page, Card, AuthLogo, AuthWordMark,
  Title, Subtitle, Field, Label, Input,
  ErrorMsg, SubmitBtn, Divider, GoogleBtn, GuestBtn, Footer, FooterLink,
} from './SignIn.styles'
import { Logo } from '@/components/ui/Logo/Logo'
import { signInAsGuest } from '@/lib/guestLogin'

interface SignInProps {
  onSwitchToSignUp: () => void
}

export const SignIn = ({ onSwitchToSignUp }: SignInProps): React.ReactElement => {
  const { signIn } = useAuth()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGuestLogin = async () => {
    setGuestLoading(true)
    setError(null)
    try {
      const { error } = await signInAsGuest()
      if (error) {
        console.error('Guest login error:', error.message)
        setError('Demo login unavailable. Please try again or sign in.')
      }
      // On success, AuthContext picks up the new session automatically.
    } catch (err) {
      console.error('Guest login exception:', err)
      setError('Demo login unavailable. Please try again or sign in.')
    } finally {
      setGuestLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setError(null)
    setLoading(true)

    const { error } = await signIn(email.trim(), password)

    if (error) {
      setError(error)
      setLoading(false)
    }
    // On success, AuthContext updates `user` → main.tsx re-renders the board automatically.
  }

  return (
    <Page>
      <Card>
        <AuthLogo>
          <Logo size={32} />
          <AuthWordMark>Flow</AuthWordMark>
        </AuthLogo>

        <Title>Welcome back</Title>
        <Subtitle>Sign in to your board</Subtitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </SubmitBtn>
        </form>

        <Divider>or</Divider>

        <GoogleBtn type="button" onClick={handleGoogleSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </GoogleBtn>

        <GuestBtn type="button" onClick={handleGuestLogin} disabled={guestLoading || loading}>
          {guestLoading ? 'Loading…' : '▶ Try demo'}
        </GuestBtn>

        <Footer>
          Don't have an account?{' '}
          <FooterLink type="button" onClick={onSwitchToSignUp}>
            Sign up
          </FooterLink>
        </Footer>
      </Card>
    </Page>
  )
}
