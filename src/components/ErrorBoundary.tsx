import * as Sentry from '@sentry/react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../theme'
import { ErrorRoot, ErrorMessage, RefreshBtn } from '../main.styles'
import styled from '@emotion/styled'

const ReportBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  text-decoration: underline;
  &:hover { color: ${p => p.theme.colors.textSecondary}; }
`

function ErrorFallback({ eventId }: { eventId?: string }) {
  return (
    <ThemeProvider theme={theme}>
      <ErrorRoot>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <ErrorMessage>Something broke. Try refreshing the page.</ErrorMessage>
        <RefreshBtn onClick={() => window.location.reload()}>Refresh</RefreshBtn>
        {eventId && (
          <ReportBtn onClick={() => Sentry.showReportDialog({ eventId })}>
            Report this
          </ReportBtn>
        )}
      </ErrorRoot>
    </ThemeProvider>
  )
}

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <Sentry.ErrorBoundary
    fallback={({ eventId }) => <ErrorFallback eventId={eventId ?? undefined} />}
  >
    {children}
  </Sentry.ErrorBoundary>
)
