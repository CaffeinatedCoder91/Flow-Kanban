// src/components/Auth/SignUp.tsx
// Email + password sign-up form using Supabase auth.

import { useState, type FormEvent } from 'react'
import styled from '@emotion/styled'
import { useAuth } from '../../context/AuthContext'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.colors.background};
  padding: 1rem;
`

const Card = styled.div`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.xl};
  box-shadow: ${p => p.theme.shadows.lg};
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`

const LogoDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.theme.colors.primary};
  display: inline-block;
`

const LogoText = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  letter-spacing: -0.02em;
`

const Title = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
`

const Subtitle = styled.p`
  margin: 0 0 1.75rem;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
`

const Label = styled.label`
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  color: ${p => p.theme.colors.text};
`

const Input = styled.input`
  padding: 0.625rem 0.875rem;
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
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }
`

const ErrorMsg = styled.p`
  margin: 0 0 1rem;
  padding: 0.625rem 0.875rem;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: ${p => p.theme.borderRadius.md};
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.dangerDark};
`

const ConfirmBanner = styled.div`
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: #166534;
  line-height: 1.5;

  strong { display: block; font-weight: 600; margin-bottom: 0.25rem; }
`

const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.7rem 1rem;
  margin-top: 0.5rem;
  background: ${p => p.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${p => p.theme.borderRadius.lg};
  font-size: ${p => p.theme.typography.fontSize.sm};
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: ${p => p.theme.colors.primaryDark}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const Footer = styled.p`
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: ${p => p.theme.typography.fontSize.sm};
  color: ${p => p.theme.colors.textSecondary};
`

const FooterLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${p => p.theme.colors.primary};
  font-size: inherit;
  font-family: inherit;
  font-weight: ${p => p.theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover { text-decoration: underline; }
`

interface SignUpProps {
  onSwitchToSignIn: () => void
}

export default function SignUp({ onSwitchToSignIn }: SignUpProps) {
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
          <Logo>
            <LogoDot />
            <LogoText>Flow</LogoText>
          </Logo>
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
        <Logo>
          <LogoDot />
          <LogoText>Flow</LogoText>
        </Logo>

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
