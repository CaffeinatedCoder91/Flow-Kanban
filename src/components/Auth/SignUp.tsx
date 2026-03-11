// src/components/Auth/SignUp.tsx
// Email + password sign-up form using Supabase auth.

import React, { useState, type FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Page, Card, AuthLogo, AuthWordMark,
  Title, Subtitle, Field, Label, Input,
  ErrorMsg, ConfirmBanner, SubmitBtn, Footer, FooterLink,
} from './SignUp.styles'
import { Logo } from '@/components/ui/Logo/Logo'

interface SignUpProps {
  onSwitchToSignIn: () => void
}

export const SignUp = ({ onSwitchToSignIn }: SignUpProps): React.ReactElement => {
  const { signUp } = useAuth()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [confirmed, setConfirmed]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError(null)
    setLoading(true)

    const { error, needsConfirmation } = await signUp(email.trim(), password)

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    if (needsConfirmation) {
      setConfirmed(true)
      setLoading(false)
    }
    // If no confirmation needed, AuthContext updates `user` → board renders automatically.
  }

  if (confirmed) {
    return (
      <Page>
        <Card>
          <AuthLogo>
            <Logo size={32} />
            <AuthWordMark>Flow</AuthWordMark>
          </AuthLogo>
          <ConfirmBanner>
            <strong>Check your email</strong>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then sign in.
          </ConfirmBanner>
          <Footer>
            Already confirmed?{' '}
            <FooterLink type="button" onClick={onSwitchToSignIn}>
              Sign in
            </FooterLink>
          </Footer>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <Card>
        <AuthLogo>
          <Logo size={32} />
          <AuthWordMark>Flow</AuthWordMark>
        </AuthLogo>

        <Title>Create account</Title>
        <Subtitle>Start managing your tasks with Flow</Subtitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </Field>

          <Field>
            <Label htmlFor="signup-confirm">Confirm password</Label>
            <Input
              id="signup-confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </Field>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </SubmitBtn>
        </form>

        <Footer>
          Already have an account?{' '}
          <FooterLink type="button" onClick={onSwitchToSignIn}>
            Sign in
          </FooterLink>
        </Footer>
      </Card>
    </Page>
  )
}
