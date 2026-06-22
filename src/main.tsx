import '@/instrument'
import { StrictMode, useState, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeContextProvider } from '@/context/ThemeContext'
import { GlobalStyles } from '@/components/GlobalStyles'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingRoot, LoadingSpinner, ErrorRoot, ErrorMessage, RefreshBtn } from '@/main.styles'
import { signInAsGuest } from '@/lib/guestLogin'
import '@/index.css'

const App = lazy(() => import('@/App'))
const DemoBanner = lazy(() => import('@/components/DemoBanner').then(m => ({ default: m.DemoBanner })))

function Root() {
  const { user, loading } = useAuth()
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (loading || user) return
    let cancelled = false
    setIsAutoLoggingIn(true)
    setAutoLoginError(null)
    signInAsGuest()
      .then(result => {
        if (cancelled) return
        if (result.error) {
          setAutoLoginError(result.error.message || 'Could not start demo. Please try again.')
        }
        // On success, AuthContext's onAuthStateChange updates user → triggers re-render.
      })
      .catch(() => {
        if (cancelled) return
        setAutoLoginError('Could not start demo. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setIsAutoLoggingIn(false)
      })
    return () => { cancelled = true }
  }, [loading, user, retryCount])

  const fallback = <LoadingRoot><LoadingSpinner /></LoadingRoot>

  if (loading || isAutoLoggingIn) return fallback

  if (autoLoginError) {
    return (
      <ErrorRoot>
        <ErrorMessage>{autoLoginError}</ErrorMessage>
        <RefreshBtn onClick={() => setRetryCount(c => c + 1)}>Try again</RefreshBtn>
      </ErrorRoot>
    )
  }

  // user is null briefly while the session propagates via onAuthStateChange
  if (!user) return fallback

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
