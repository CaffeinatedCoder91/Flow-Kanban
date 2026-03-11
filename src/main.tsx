import '@/instrument'
import { StrictMode, useState, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeContextProvider } from '@/context/ThemeContext'
import { GlobalStyles } from '@/components/GlobalStyles'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingRoot, LoadingSpinner } from '@/main.styles'
import '@/index.css'

const App    = lazy(() => import('@/App'))
const SignIn = lazy(() => import('@/components/Auth/SignIn').then(m => ({ default: m.SignIn })))
const SignUp = lazy(() => import('@/components/Auth/SignUp').then(m => ({ default: m.SignUp })))
const DemoBanner = lazy(() => import('@/components/DemoBanner').then(m => ({ default: m.DemoBanner })))

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Rendered inside AuthProvider so useAuth() is available.

function Root() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin')

  // DemoBanner dispatches this event when the guest clicks "Create a free account"
  // after signing out, so we land directly on the sign-up form.
  useEffect(() => {
    const handler = () => setAuthView('signup')
    document.addEventListener('flow:show-signup', handler)
    return () => document.removeEventListener('flow:show-signup', handler)
  }, [])

  const fallback = <LoadingRoot><LoadingSpinner /></LoadingRoot>

  if (loading) return fallback

  if (!user) {
    return (
      <Suspense fallback={fallback}>
        {authView === 'signin'
          ? <SignIn onSwitchToSignUp={() => setAuthView('signup')} />
          : <SignUp onSwitchToSignIn={() => setAuthView('signin')} />}
      </Suspense>
    )
  }

  return (
    <Suspense fallback={fallback}>
      <DemoBanner />
      <App />
    </Suspense>
  )
}

// ─── Mount ────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeContextProvider>
        <GlobalStyles />
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  </StrictMode>,
)
