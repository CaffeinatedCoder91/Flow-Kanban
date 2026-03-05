// src/components/Auth/SignIn.tsx
// Email + password sign-in form using Supabase auth.

import React, { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Page, Card, Logo, LogoDot, LogoText,
  Title, Subtitle, Field, Label, Input,
  ErrorMsg, SubmitBtn, Footer, FooterLink,
} from './SignIn.styles'

interface SignInProps {
  onSwitchToSignUp: () => void
}

export const SignIn = ({ onSwitchToSignUp }: SignInProps): React.ReactElement => {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

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
        <Logo>
          <LogoDot />
          <LogoText>Flow</LogoText>
        </Logo>

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
