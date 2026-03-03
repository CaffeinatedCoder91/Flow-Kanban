# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite (frontend only, http://localhost:5173)
npm run dev:full     # Start full stack via vercel dev (frontend + API on http://localhost:3000)
npm run lint         # Run ESLint
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/App.test.tsx
```

## Architecture

This is a full-stack TypeScript kanban app:

- **Frontend** (`src/`): React + Vite + Emotion CSS-in-JS. SPA that calls `/api/*` endpoints.
- **API** (`api/`): Vercel serverless functions (one file per route). Node.js 20.
- **Database**: Supabase (Postgres). Schema in `db/supabase-schema.sql`.
- **Auth**: Supabase Auth. All API routes require `Authorization: Bearer <supabase-jwt>`.

When using `npm run dev:full`, `vercel dev` serves both Vite (frontend) and API functions on port 3000.
When using `npm run dev` (Vite only), API routes are unavailable — use this for UI-only development.

## Key files

- `lib/supabase.ts` — Supabase client setup + TypeScript types (Item, ItemHistory)
- `lib/db.ts` — All DB helpers (getItems, createItem, updateItem, deleteItem, getItemHistory)
- `api/_utils.ts` — Shared helpers: getUserId (JWT verification), CORS, response helpers
- `db/supabase-schema.sql` — Full Supabase schema with tables, indexes, and RLS policies

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/items` | GET | Load all items with history |
| `/api/items` | POST | Create item |
| `/api/items/bulk` | POST | Bulk create items |
| `/api/items/[id]` | PATCH | Update item |
| `/api/items/[id]` | DELETE | Delete item |
| `/api/chat` | POST | AI assistant with board tool use |
| `/api/insights` | POST | Board analysis (stale, bottleneck, duplicates) |
| `/api/recommend-next` | POST | AI-recommended next task |
| `/api/narrative` | POST | Standup summary + momentum score |
| `/api/check-deadline-risks` | POST | Scan for at-risk deadlines |
| `/api/deadline-actions` | POST | Record deadline action |
| `/api/suggest-reschedule` | POST | AI due-date suggestions |
| `/api/suggest-split` | POST | AI task split suggestions |
| `/api/extract-tasks` | POST | Extract tasks from text |
| `/api/extract-from-file` | POST | Extract tasks from file (.txt/.pdf/.docx) |

## Browser Testing

1. Run `npm run dev:full` (`vercel dev`) for full-stack testing — serves frontend + API on http://localhost:3000
2. Run `npm run dev` (`vite`) for UI-only testing — http://localhost:5173, no API
3. All API calls require a Supabase JWT in the `Authorization: Bearer` header
