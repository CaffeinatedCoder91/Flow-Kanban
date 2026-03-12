/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react({
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    // Only upload source maps when SENTRY_AUTH_TOKEN is set (CI/production builds)
    ...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })] : []),
  ],
  resolve: {
    alias: { '@': path.resolve(dirname, 'src') },
  },
  build: {
    sourcemap: true,
  },
  server: {
    hmr: {
      port: 24678,
    },
    proxy: {
      '/api': 'http://localhost:3000'
    },
    headers: {
      // Override the strict production CSP so Vite's inline React refresh
      // script and HMR WebSocket are not blocked during local development.
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:* https://*.sentry.io https://*.ingest.sentry.io",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: ['{api,lib}/**/*.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        resolve: {
          alias: {
            '@': path.resolve(dirname, 'src'),
            // Storybook vitest plugin rewrites @emotion/react → @emotion/react-vite; alias it back
            '@emotion/react-vite': '@emotion/react',
          },
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
            api: {
              host: '127.0.0.1',
            },
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  }
});