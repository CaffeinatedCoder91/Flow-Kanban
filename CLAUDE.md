# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start frontend (Vite) and backend (Express) concurrently
npm run dev:client   # Start only frontend (http://localhost:5173)
npm run dev:server   # Start only backend (http://localhost:3001)
npm run lint         # Run ESLint
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run db:reset     # Delete SQLite database and restart server
```

Run a single test file:
```bash
npx vitest run src/App.test.tsx
```

## Architecture

This is a full-stack TypeScript todo app with three layers:

- **Frontend** (`src/`): React app built with Vite. Single-page app that fetches from `/api/*` endpoints.
- **Backend** (`server/index.ts`): Express server on port 3001. Provides REST API for todos.
- **Database** (`db/todos.db`): SQLite file database using better-sqlite3. Schema is auto-created on server start.

Vite proxies `/api` requests to the backend during development.

## Browser Testing

When testing the app in Chrome:

1. **Always use `npm run dev`** (not separate client/server commands) - this ensures the Vite proxy to the backend works correctly
2. **Check the port** - Default is http://localhost:5173, but if that port is in use, Vite will pick another (5174, 5175, etc.). Check the terminal output for the actual URL
3. **Wait for both servers** - The backend takes a moment to start. Wait ~3 seconds after running the command before navigating to the app
