<div align="center">

# Flow

### The task board that thinks with you

AI-powered Kanban board with ambient intelligence — smart insights, natural language task creation, deadline negotiation, and a conversational assistant that reads and updates your board directly.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://jojo-flame.vercel.app)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

---

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Emotion](https://img.shields.io/badge/Emotion-C865B9?style=flat-square&logo=css3&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_Haiku%2FSonnet-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat-square&logo=storybook&logoColor=white)

</div>

---

## Try It

**[jojo-flame.vercel.app](https://jojo-flame.vercel.app)** — click **Try Demo** to explore with a pre-configured guest account. No sign-up required.

---

## Why I Built This

A friend of mine runs a specialty coffee roastery. He tried Notion, then Monday.com, then a spreadsheet that lasted about a week. Each time the tool demanded more than it gave back — twenty minutes configuring a board for a problem that should've taken two minutes to solve. He quit all of them. Now he runs everything from memory and a notes app, which works until it doesn't.

The pattern repeats everywhere: founders and small teams aren't failing because they lack discipline, they're failing because the tools built for them were actually built for operations teams at mid-size companies. Everything is reactive. You move a card, update a status, log a note. The software records what happened. It never tells you what matters.

Flow treats AI as ambient intelligence woven into the workflow — not a chatbot bolted to the side. It surfaces what's at risk before you have to ask, suggests what to work on next when you're stuck, and turns a pile of meeting notes into actual tasks in seconds. The goal isn't to replace judgment. It's to protect attention so it can go where it's actually needed.

---

## Features

### Ambient Intelligence
The insight bar runs silently in the background and surfaces what matters — stale tasks that haven't moved in days, bottlenecks blocking progress, duplicate work, priority inflation, and upcoming deadline clusters. No configuration needed; it just watches and tells you.

### Conversational AI Assistant
Ask Flow anything in plain English. *"Create three tasks for the product launch"*, *"What's blocking me right now?"*, *"Mark the auth bug as done"* — the assistant reads your board, takes action, and explains its reasoning. Powered by Claude with tool use. Responses are cached for demo users (24h) and deduplicated across all users (30s) to minimise API costs.

### Natural Language Task Import
Paste a meeting transcript, email thread, or bullet list and click Process. Flow extracts the action items, assigns priorities and due dates, shows confidence scores for each extracted field, and waits for your review before adding anything. Also accepts `.txt`, `.pdf`, and `.docx` uploads (up to 2 MB).

### Recommended Next Task
A one-click spotlight that analyses your current workload and recommends the single highest-impact task to focus on next — with a plain-English explanation of why.

### Deadline Negotiation
When a deadline is at risk, Flow doesn't just warn you — it offers options. Reschedule with AI-suggested new dates, split a large task into two deliverable chunks, or deprioritise with a recorded reason. Every decision is logged.

### Momentum Reports
A weekly narrative view that generates a momentum score (0-100), health sentiment (Healthy / At Risk / Critical), a trend arrow versus the previous period, and a plain-English summary of what happened on your board. Tabs for Last 7 days, Last 30 days, and This month.

### Full Kanban Board
Drag cards between four status columns (Not Started, In Progress, Done, Stuck). Set priority, due date, assignee, and colour tag directly on the card. Inline description editing with a done-state strikethrough so completed work stays visible but out of the way.

---

## Architecture

```
Browser (React 18 + Emotion + dnd-kit)
    │
    │  fetch /api/*
    ▼
Vercel Serverless Functions (Node.js 22)
    │
    ├──► Supabase (Postgres + Auth)
    ├──► Anthropic Claude (AI features with intelligent caching)
    └──► Upstash Redis (rate limiting + response cache)
```

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Kanban Board │  │ AI Assistant │  │ Insights Bar      │  │
│  │  (dnd-kit)   │  │   (chat)     │  │  (ambient)        │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         └─────────────────┼───────────────────┘              │
│                           │  React 18 + Emotion               │
└───────────────────────────┼──────────────────────────────────┘
                            │  fetch /api/*
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel Serverless Functions                      │
│                                                              │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Items CRUD │  │   AI Routes     │  │  File Upload     │  │
│  │ /api/items │  │ /api/chat       │  │ /api/extract-    │  │
│  │            │  │ /api/insights   │  │   from-file      │  │
│  │            │  │ /api/narrative  │  │ (pdf + docx)     │  │
│  │            │  │ /api/recommend  │  │                  │  │
│  └─────┬──────┘  └───────┬─────────┘  └──────────────────┘  │
│        │                 │                                    │
│        ▼                 ▼                                    │
│  ┌───────────┐   ┌─────────────────────┐  ┌──────────────┐  │
│  │ Supabase  │   │  Anthropic Claude   │  │   Upstash    │  │
│  │ Postgres  │   │  Haiku + Sonnet     │  │    Redis     │  │
│  │           │   │                     │  │ rate limiting │  │
│  │  items    │   │  chat (Haiku)       │  └──────────────┘  │
│  │  history  │   │  insights (Haiku)   │                     │
│  │  actions  │   │  narrative (Haiku)  │                     │
│  │           │   │  extraction (Sonnet)│                     │
│  └───────────┘   └─────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Emotion (CSS-in-JS) | Themed styled components |
| **Drag & Drop** | dnd-kit | Kanban card dragging and sorting |
| **Build** | Vite | Dev server and bundler |
| **Backend** | Vercel Serverless Functions | REST API (one function per route) |
| **Database** | Supabase (Postgres) | Persistent storage + Row Level Security |
| **Auth** | Supabase Auth | JWT-based authentication with demo guest login |
| **AI** | Anthropic Claude (Haiku + Sonnet) | Chat and analysis with intelligent model selection |
| **Caching** | Upstash Redis | 24h response cache for demo users; 30s dedup for all users |
| **Rate Limiting** | Upstash Redis | Sliding window rate limits on AI endpoints |
| **File Parsing** | pdf-parse + mammoth | PDF and DOCX import support |
| **Testing** | Vitest + React Testing Library | 376 unit and component tests |
| **Component Dev** | Storybook | Visual component sandbox |

---

## API Routes

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

---

## Local Development

### Prerequisites

- **Node.js** 22+
- A **Supabase** project — [supabase.com](https://supabase.com)
- An **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/CaffeinatedCoder91/Flow-Kanban.git
cd Flow-Kanban
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys (see [Environment Variables](#environment-variables) below).

### 3. Set up the database

Run the schema in your Supabase SQL editor:

```bash
# The schema file is at db/supabase-schema.sql
```

### 4. Start the dev server

```bash
npm run dev          # Frontend only (http://localhost:5173)
npm run dev:full     # Full stack via vercel dev (http://localhost:3000)
```

Use `dev:full` to test API routes locally. Use `dev` for UI-only work.

### All commands

```bash
npm run dev             # Vite frontend (http://localhost:5173)
npm run dev:full        # Full stack via vercel dev (http://localhost:3000)
npm test                # Run all 376 tests
npm run test:watch      # Tests in watch mode
npm run storybook       # Component explorer at :6006
npm run build           # Production build
npm run lint            # ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for all AI features |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `VITE_SENTRY_DSN` | No | Sentry DSN for the frontend |

> Never commit `.env.local` to version control. It is already in `.gitignore`.

---

## Project Structure

```
Flow-Kanban/
├── src/
│   ├── components/
│   │   ├── Auth/           # LoginPage, AvatarDropdown
│   │   ├── board/          # KanbanBoard, Column, TaskCard
│   │   ├── modals/         # ImportModal, DeadlineNegotiationModal, HelpPage,
│   │   │                   # WelcomeModal, ClearBoardModal, TaskPreview
│   │   ├── panels/         # AssistantPanel, InsightCard, SpotlightCard,
│   │   │                   # NarrativeWidget, SummaryView
│   │   ├── ui/             # Button, Navbar
│   │   └── GlobalStyles/   # Emotion global CSS injector
│   ├── lib/                # supabaseBrowser, guestLogin
│   ├── test/               # Shared render wrapper (ThemeProvider) + setup
│   ├── App.tsx             # Root component — state, layout, orchestration
│   ├── types.ts            # Shared TypeScript types (Item, Insight, ProposedTask...)
│   └── theme.ts            # Design tokens (colours, spacing, typography, shadows)
├── api/                    # Vercel serverless functions (one file per route)
│   ├── _utils.ts           # Shared: auth, CORS, response helpers
│   ├── items/              # CRUD endpoints
│   ├── chat.ts             # AI assistant with tool use
│   ├── insights.ts         # Ambient intelligence
│   ├── narrative.ts        # Momentum reports
│   └── ...                 # Other AI endpoints
├── lib/                    # Server-side shared code
│   ├── supabase.ts         # Supabase admin client + types
│   ├── db.ts               # Database helpers
│   ├── validation.ts       # Zod input schemas
│   ├── sanitize.ts         # XSS sanitization
│   └── rateLimit.ts        # Upstash rate limiting
├── db/
│   └── supabase-schema.sql # Full database schema with RLS policies
├── .storybook/             # Storybook config with global ThemeProvider
└── vite.config.ts          # Vite + dual Vitest project config
```

---

## Deployment

The app is deployed on **Vercel** with Supabase as the database.

- **Frontend**: Vite builds to static assets, served by Vercel CDN
- **API**: Each file in `api/` becomes a Vercel serverless function
- **Database**: Supabase Postgres (hosted)
- **Auth**: Supabase Auth (JWT tokens)

Set all required environment variables in your Vercel project settings and deploy:

```bash
vercel --prod
```

---

## Testing

376 unit and component tests using **Vitest** and **React Testing Library**. Every component has a collocated `*.test.tsx` file. A custom render wrapper injects the Emotion `ThemeProvider` so styled components resolve correctly in tests.

```bash
npm test                                    # Full test suite
npx vitest run src/App.test.tsx             # Single file
npm run test:watch                          # Watch mode
npm run storybook                           # Visual component sandbox
```

---

## Performance & Quality Metrics

### Technical Achievements
- 376 comprehensive tests (Vitest + React Testing Library)
- Content Security Policy implemented
- Mobile-responsive design
- Cross-browser compatible
- Optimised API responses with intelligent caching
- Cost-efficient AI with Haiku/Sonnet model selection

### Quality Standards
- TypeScript strict mode
- ESLint enforced
- No console errors in production
- Rate limiting on all AI endpoints
- Graceful Redis fallbacks

---

## Roadmap

| Status | Feature |
|---|---|
| Done | Kanban board with drag-and-drop |
| Done | Claude AI chat assistant with tool use |
| Done | Ambient insight engine (stale, duplicate, deadline, bottleneck) |
| Done | Natural language task import (text + PDF + DOCX) |
| Done | Deadline negotiation (reschedule / split / deprioritise) |
| Done | Momentum score and narrative reports |
| Done | Recommended next task (Spotlight) |
| Done | Supabase Auth with demo guest login |
| Done | Vercel serverless deployment |
| Done | Upstash Redis rate limiting |
| Done | Storybook component explorer with 376 tests |
| Next | Multi-board / workspace support |
| Next | Team collaboration and real-time sync |
| Next | Recurring tasks and reminders |
| Next | GitHub / Linear / Jira integration |
| Next | Mobile app (React Native) |

---

## License

MIT

---

<div align="center">

Built with [Claude](https://anthropic.com) &nbsp;&middot;&nbsp; [Report a bug](https://github.com/CaffeinatedCoder91/Flow-Kanban/issues) &nbsp;&middot;&nbsp; [Request a feature](https://github.com/CaffeinatedCoder91/Flow-Kanban/issues)

</div>
