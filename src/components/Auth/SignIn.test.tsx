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

  it('renders demo-only sign in UI', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Start a fresh demo board in one click')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument()
    expect(screen.getByText('No email or password required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeInTheDocument()
  })

  it('renders "Try demo" button', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument()
  })

  it('shows error on failed demo login', async () => {
    mockSignInAsGuest.mockResolvedValue({ error: { message: 'Invalid login credentials' } })

    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)

    fireEvent.click(screen.getByRole('button', { name: /try demo/i }))

    await waitFor(() => {
      expect(screen.getByText(/demo login failed/i)).toBeInTheDocument()
    })
  })

  it('calls onSwitchToSignUp when link clicked', () => {
    render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(onSwitchToSignUp).toHaveBeenCalled()
  })
})
