import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignUp } from './SignUp'

const mockSignUp = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}))

describe('SignUp', () => {
  const onSwitchToSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSignUp.mockResolvedValue({ error: null, needsConfirmation: false })
  })

  it('renders email, password, and confirm fields and submit button', () => {
    render(<SignUp onSwitchToSignIn={onSwitchToSignIn} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows error on password mismatch', async () => {
    render(<SignUp onSwitchToSignIn={onSwitchToSignIn} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error on short password', async () => {
    render(<SignUp onSwitchToSignIn={onSwitchToSignIn} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows confirmation banner after successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null, needsConfirmation: true })

    render(<SignUp onSwitchToSignIn={onSwitchToSignIn} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
    })
    expect(screen.getByText(/new@example.com/)).toBeInTheDocument()
  })

  it('calls onSwitchToSignIn when link clicked', () => {
    render(<SignUp onSwitchToSignIn={onSwitchToSignIn} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(onSwitchToSignIn).toHaveBeenCalled()
  })
})
