<div align="center">

# ✦ Flow

### The task board that thinks with you

AI-powered Kanban board with ambient intelligence — smart insights, natural language task creation, deadline negotiation, and a conversational assistant that reads and updates your board directly.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](#)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

---

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Emotion](https://img.shields.io/badge/Emotion-C865B9?style=flat-square&logo=css3&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_Sonnet-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat-square&logo=storybook&logoColor=white)

</div>

---

## 📸 Screenshots

> _Add a demo GIF or screenshot here after first deploy_

---

## ✨ Features

### 🧠 Ambient Intelligence
The insight bar runs silently in the background and surfaces what matters — stale tasks that haven't moved in days, bottlenecks blocking progress, duplicate work, priority inflation, and upcoming deadline clusters. No configuration needed; it just watches and tells you.

### 💬 Conversational AI Assistant
Ask Flow anything in plain English. *"Create three tasks for the product launch"*, *"What's blocking me right now?"*, *"Mark the auth bug as done"* — the assistant reads your board, takes action, and explains its reasoning. Powered by Claude Sonnet.

### 📋 Natural Language Task Import
Paste a meeting transcript, email thread, or bullet list and click Process. Flow extracts the action items, assigns priorities and due dates, shows you confidence scores for each extracted field, and waits for your review before adding anything. Also accepts `.txt`, `.pdf`, and `.docx` uploads (up to 5 MB).

### 🔮 Recommended Next Task
A one-click spotlight that analyses your current workload and recommends the single highest-impact task to focus on next — with a plain-English explanation of why.

### 📅 Deadline Negotiation
When a deadline is at risk, Flow doesn't just warn you — it offers options. Reschedule with AI-suggested new dates, split a large task into two deliverable chunks, or deprioritise with a recorded reason. Every decision is logged.

### 📊 Momentum Reports
A weekly narrative view that generates a momentum score (0–100), health sentiment (Healthy / At Risk / Critical), a trend arrow versus the previous period, and a plain-English summary of what happened on your board. Tabs for Last 7 days, Last 30 days, and This month.

### 🎯 Full Kanban Board
Drag cards between four status columns (Not Started → In Progress → Done → Stuck). Set priority, due date, assignee, and colour tag directly on the card. Inline description editing with a done-state strikethrough so completed work stays visible but out of the way.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Kanban Board │  │ AI Assistant│  │ Insights Bar  │  │
│  │  (dnd-kit)   │  │   (chat)    │  │  (ambient)    │  │
│  └──────┬───────┘  └──────┬──────┘  └───────┬───────┘  │
│         └─────────────────┼──────────────────┘          │
│                           │  React 18 + Emotion          │
└───────────────────────────┼─────────────────────────────┘
                            │  fetch /api/*
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server :3001                  │
│                                                         │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ Items CRUD │  │   AI Routes    │  │  File Upload  │  │
│  │ /api/items │  │ /api/chat      │  │ /api/extract- │  │
│  │            │  │ /api/insights  │  │   from-file   │  │
│  │            │  │ /api/narrative │  │ (pdf + docx)  │  │
│  │            │  │ /api/recommend │  │               │  │
│  └─────┬──────┘  └───────┬────────┘  └───────────────┘  │
│        │                 │                               │
│        ▼                 ▼                               │
│  ┌──────────┐   ┌────────────────────┐                   │
│  │  SQLite  │   │  Anthropic Claude  │                   │
│  │          │   │  claude-sonnet-4-5 │                   │
│  │  items   │   │                   │                   │
│  │  history │   │  chat · insights  │                   │
│  │  actions │   │  extraction ·     │                   │
│  │          │   │  narrative ·      │                   │
│  │          │   │  deadline AI      │                   │
│  └──────────┘   └────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Emotion (CSS-in-JS) | Themed styled components |
| **Drag & Drop** | dnd-kit | Kanban card dragging and sorting |
| **Build** | Vite | Dev server, bundler, API proxy |
| **Backend** | Express + TypeScript | REST API server |
| **Database** | SQLite via better-sqlite3 | Local persistent storage |
| **AI** | Anthropic Claude Sonnet | Chat, insights, task extraction, narrative |
| **File Parsing** | pdf-parse + mammoth | PDF and DOCX import support |
| **Testing** | Vitest + React Testing Library | 268 unit and component tests |
| **Component Dev** | Storybook | Visual component sandbox |

---

## 🚀 Local Development

### Prerequisites

- **Node.js** 18+
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install

```bash
git clone https://github.com/your-username/flow.git
cd flow
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your key (see [Environment Variables](#-environment-variables) below).

### 3. Start the dev server

```bash
npm run dev
```

This starts both the Vite frontend at **http://localhost:5173** and the Express backend at **http://localhost:3001** concurrently. Vite automatically proxies all `/api` requests to the backend — no CORS setup needed.

### All commands

```bash
npm run dev             # Start frontend + backend together (recommended)
npm run dev:client      # Frontend only
npm run dev:server      # Backend only
npm test                # Run all 268 unit tests
npm run test:watch      # Tests in watch mode
npm run storybook       # Component explorer at :6006
npm run build           # Production build
npm run db:reset        # Wipe SQLite database and restart fresh
npm run lint            # ESLint
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude API key. All AI features are disabled without this. |
| `PORT` | No | Express server port. Defaults to `3001`. |
| `NODE_ENV` | No | Set to `production` for the built app. |

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

> ⚠️ Never commit `.env` to version control. It is already in `.gitignore`.

---

## 📦 Project Structure

```
flow/
├── src/
│   ├── components/
│   │   ├── board/          # KanbanBoard, Column, TaskCard
│   │   ├── modals/         # ImportModal, DeadlineNegotiationModal, HelpModal,
│   │   │                   # WelcomeModal, ClearBoardModal, TaskPreview
│   │   ├── panels/         # AssistantPanel, InsightCard, SpotlightCard,
│   │   │                   # NarrativeWidget, SummaryView
│   │   └── GlobalStyles/   # Emotion global CSS injector
│   ├── test/               # Shared render wrapper (ThemeProvider) + setup
│   ├── utils/              # fetchWithRetry and other helpers
│   ├── App.tsx             # Root component — state, layout, orchestration
│   ├── types.ts            # Shared TypeScript types (Item, Insight, ProposedTask…)
│   └── theme.ts            # Design tokens (colours, spacing, typography, shadows)
├── server/
│   └── index.ts            # Express — all REST routes + Anthropic AI calls
├── db/
│   └── todos.db            # SQLite (auto-created on first run, gitignored)
├── .storybook/             # Storybook config with global ThemeProvider decorator
└── vite.config.ts          # Vite + dual Vitest project config
```

---

## 🌐 Deployment

Flow is a standard Node.js monorepo — one build command, one start command. Any platform that supports Node 18+ will work (Railway, Render, Fly.io, etc.).

### Build and start

```bash
npm run build           # Compiles TypeScript and bundles the Vite frontend
node dist/server/index.js   # Serves the API and static frontend on $PORT
```

Set the `ANTHROPIC_API_KEY` environment variable on your hosting platform.

### Persistent storage

The SQLite database writes to `db/todos.db` on the local filesystem. For platforms with ephemeral filesystems, either:

- Mount a **persistent volume** at `./db/`, or
- Swap `better-sqlite3` for a hosted database (Postgres via Drizzle, Turso, etc.)

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/server/index.js"]
```

---

## 🗺️ Roadmap

| Status | Feature |
|---|---|
| ✅ | Kanban board with drag-and-drop |
| ✅ | Claude AI chat assistant |
| ✅ | Ambient insight engine (stale, duplicate, deadline, bottleneck) |
| ✅ | Natural language task import (text + PDF + DOCX) |
| ✅ | Deadline negotiation (reschedule / split / deprioritise) |
| ✅ | Momentum score and narrative reports |
| ✅ | Recommended next task (Spotlight) |
| ✅ | Storybook component explorer with 268 tests |
| 🔜 | Multi-board / workspace support |
| 🔜 | Team collaboration and real-time sync |
| 🔜 | Recurring tasks and reminders |
| 🔜 | GitHub / Linear / Jira integration |
| 🔜 | Hosted database (Postgres / Turso) |
| 🔜 | Mobile app (React Native) |

---

## 🧪 Testing

268 unit and component tests using **Vitest** and **React Testing Library**. Every component has a collocated `*.test.tsx` file. A custom render wrapper injects the Emotion `ThemeProvider` so styled components resolve correctly in tests.

```bash
npm test                                    # Full test suite
npx vitest run src/App.test.tsx             # Single file
npm run test:watch                          # Watch mode
npm run storybook                           # Visual component sandbox
```

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests for any new components
3. Run `npm test` and `npm run lint` — both must pass
4. Open a pull request with a clear description

---

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ☕ and [Claude](https://anthropic.com) &nbsp;·&nbsp; [Report a bug](https://github.com/your-username/flow/issues) &nbsp;·&nbsp; [Request a feature](https://github.com/your-username/flow/issues)

</div>
