import './instrument'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { ThemeProvider } from '@emotion/react'
import App from './App'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SignIn } from './components/Auth/SignIn'
import { SignUp } from './components/Auth/SignUp'
import { theme } from './theme'
import { GlobalStyles } from './components/GlobalStyles'
import { LoadingRoot, LoadingSpinner, ErrorRoot, ErrorMessage, RefreshBtn } from './main.styles'
import './index.css'

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Rendered inside AuthProvider so useAuth() is available.

function Root() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin')

  if (loading) {
    return (
      <LoadingRoot>
        <LoadingSpinner />
      </LoadingRoot>
    )
  }

  if (!user) {
    return authView === 'signin'
      ? <SignIn onSwitchToSignUp={() => setAuthView('signup')} />
      : <SignUp onSwitchToSignIn={() => setAuthView('signin')} />
  }

  return <App />
}

// ─── Mount ────────────────────────────────────────────────────────────────────

const ErrorFallback = (): React.ReactElement => (
  <ThemeProvider theme={theme}>
    <ErrorRoot>
      <ErrorMessage>Something went wrong. Please refresh the page.</ErrorMessage>
      <RefreshBtn onClick={() => window.location.reload()}>Refresh</RefreshBtn>
    </ErrorRoot>
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
