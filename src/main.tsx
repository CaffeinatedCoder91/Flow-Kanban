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
import './index.css'

// ─── Auth gate ────────────────────────────────────────────────────────────────
// Rendered inside AuthProvider so useAuth() is available.

function Root() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.background,
      }}>
        <div style={{
          width: 32, height: 32,
          border: `3px solid ${theme.colors.border}`,
          borderTopColor: theme.colors.primary,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
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
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    background: theme.colors.background,
    color: theme.colors.text,
    fontFamily: 'system-ui, sans-serif',
  }}>
    <p style={{ margin: 0, fontSize: '1rem', color: theme.colors.textSecondary }}>
      Something went wrong. Please refresh the page.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '0.5rem 1.25rem',
        background: theme.colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: theme.borderRadius.md,
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 600,
      }}
    >
      Refresh
    </button>
  </div>
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
