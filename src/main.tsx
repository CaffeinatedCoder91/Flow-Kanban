import './instrument'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeContextProvider } from './context/ThemeContext'
import { SignIn } from './components/Auth/SignIn'
import { SignUp } from './components/Auth/SignUp'
import { GlobalStyles } from './components/GlobalStyles'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingRoot, LoadingSpinner } from './main.styles'
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
