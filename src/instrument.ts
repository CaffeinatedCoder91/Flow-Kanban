import { init, browserTracingIntegration } from '@sentry/react'

init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: '0.0.1',
  sendDefaultPii: true,
  integrations: [
    browserTracingIntegration(),
  ],
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  sampleRate: 1.0,
})
