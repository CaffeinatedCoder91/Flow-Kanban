import * as Sentry from '@sentry/node'

let initialized = false

export function initSentry(): void {
  if (initialized) return
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,
    tracesSampleRate: 0.1,
    sampleRate: 1.0,
  })

  initialized = true
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  initSentry()
  Sentry.withScope(scope => {
    if (context) scope.setExtras(context)
    Sentry.captureException(err)
  })
}
