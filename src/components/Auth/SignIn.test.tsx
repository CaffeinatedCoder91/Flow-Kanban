import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignIn } from './SignIn'

const mockSignIn = vi.fn()
const mockSignInAsGuest = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}))

vi.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}))

vi.mock('@/lib/guestLogin', () => ({
  signInAsGuest: (...args: unknown[]) => mockSignInAsGuest(...args),
  DEMO_EMAIL: 'demo@flow.app',
}))

describe('SignIn', () => {
  const onSwitchToSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSignIn.mockResolvedValue({ error: null })
    mockSignInAsGuest.mockResolvedValue({ error: null })
  })

  it('renders email and password fields and submit button', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders "Try demo" button', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument()
  })

  it('shows error on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('calls onSwitchToSignUp when link clicked', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(onSwitchToSignUp).toHaveBeenCalled()
  })
})
