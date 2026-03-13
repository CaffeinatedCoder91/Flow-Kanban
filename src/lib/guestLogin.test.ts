import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signInAsGuest } from './guestLogin'

const mockSignInWithPassword = vi.fn()
const mockUpdateUser = vi.fn()
const mockSetSession = vi.fn()
const mockInvoke = vi.fn()

vi.mock('./supabaseBrowser', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      setSession: (...args: unknown[]) => mockSetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}))

const originalTestEnv = (globalThis as { __FLOW_ENV__?: unknown }).__FLOW_ENV__

function setEnv(mode: string, demoPassword?: string) {
  ;(globalThis as { __FLOW_ENV__?: unknown }).__FLOW_ENV__ = {
    MODE: mode,
    VITE_DEMO_PASSWORD: demoPassword,
  }
}

describe('signInAsGuest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    ;(globalThis as { __FLOW_ENV__?: unknown }).__FLOW_ENV__ = originalTestEnv
  })

  it('uses dev password flow when configured', async () => {
    setEnv('development', 'secret')
    mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    const result = await signInAsGuest()

    expect(mockSignInWithPassword).toHaveBeenCalled()
    expect(mockUpdateUser).toHaveBeenCalled()
    expect(localStorage.getItem('flow-demo-session')).toBe('1')
    expect(localStorage.getItem('flow-demo-session-started-at')).toBeTruthy()
    expect(result.error).toBeFalsy()
  })

  it('uses edge function flow in production', async () => {
    setEnv('production', undefined)
    mockInvoke.mockResolvedValue({ data: { access_token: 'at', refresh_token: 'rt' }, error: null })
    mockSetSession.mockResolvedValue({ data: { session: {} }, error: null })

    const result = await signInAsGuest()

    expect(mockInvoke).toHaveBeenCalledWith('demo-login')
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'at', refresh_token: 'rt' })
    expect(localStorage.getItem('flow-demo-session')).toBe('1')
    expect(localStorage.getItem('flow-demo-session-started-at')).toBeTruthy()
    expect(result.error).toBeFalsy()
  })

  it('returns an error when edge function fails', async () => {
    setEnv('production', undefined)
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Boom' } })

    const result = await signInAsGuest()

    expect(result.error?.message).toMatch(/boom/i)
    expect(mockSetSession).not.toHaveBeenCalled()
  })
})
