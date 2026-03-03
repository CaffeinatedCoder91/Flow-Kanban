# API Routes Inventory

Generated from `server/index.ts`. Covers all 15 endpoints as they exist today (better-sqlite3, no auth).

---

## Database Schema

### `items`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| title | TEXT NOT NULL | |
| description | TEXT | nullable |
| status | TEXT NOT NULL | default `'not_started'` |
| priority | TEXT NOT NULL | default `'medium'` |
| color | TEXT | nullable |
| assignee | TEXT | nullable |
| due_date | TEXT | nullable, YYYY-MM-DD |
| position | INTEGER NOT NULL | default 0, used for column ordering |
| created_at | TEXT NOT NULL | default `datetime('now')` |
| last_modified | TEXT NOT NULL | default `datetime('now')` |

### `item_history`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| item_id | INTEGER NOT NULL | FK → items(id) ON DELETE CASCADE |
| changed_at | TEXT NOT NULL | default `datetime('now')` |
| description | TEXT NOT NULL | human-readable change summary |

### `deadline_actions`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| item_id | INTEGER | nullable (no FK constraint) |
| action_type | TEXT NOT NULL | `reschedule` \| `deprioritize` \| `split` |
| original_due_date | TEXT | nullable |
| new_due_date | TEXT | nullable |
| days_extended | INTEGER | nullable, computed for reschedule actions |
| created_at | TEXT NOT NULL | default `datetime('now')` |

---

## Shared Types

### `Item` (full row returned to client)
```ts
{
  id: number
  title: string
  description: string | null
  status: 'not_started' | 'in_progress' | 'done' | 'stuck'
  priority: 'low' | 'medium' | 'high' | 'critical'
  color: string | null
  assignee: string | null
  due_date: string | null          // YYYY-MM-DD
  position: number
  created_at: string               // SQLite datetime string
  last_modified: string
  history: HistoryEntry[]
}
```

### `HistoryEntry`
```ts
{
  id: number
  item_id: number
  changed_at: string
  description: string
}
```

---

## Routes

---

### 1. `GET /api/items`

**Purpose:** Load the full board state — all items with their change history.

**Request:** none (no body, no query params)

**Response:** `Item[]` — array of items, each with nested `history` array

**Database queries:**
```sql
SELECT * FROM items ORDER BY position ASC, id ASC;
SELECT * FROM item_history ORDER BY changed_at DESC;
```
History is grouped by `item_id` in memory and joined onto each item before returning.

**Dependencies:** none

---

### 2. `POST /api/items`

**Purpose:** Create a single new item.

**Request body:**
```ts
{
  title: string                    // required
  description?: string | null      // default null
  status?: string                  // default 'not_started'
  priority?: string                // default 'medium'
  color?: string | null            // default null
  assignee?: string | null         // default null
  due_date?: string | null         // default null, YYYY-MM-DD
}
```

**Response:** `Item` — the newly created item with `history: []`

**Database queries:**
```sql
INSERT INTO items (title, description, status, priority, color, assignee, due_date)
VALUES (?, ?, ?, ?, ?, ?, ?);

SELECT * FROM items WHERE id = ?;   -- fetch back the inserted row
```

**Dependencies:** none

---

### 3. `POST /api/items/bulk`

**Purpose:** Insert multiple items atomically (used for import confirmation and sample data seeding).

**Request body:**
```ts
{
  tasks: Array<{
    title: string
    description?: string | null
    status?: string
    priority?: string
    color?: string | null
    assignee?: string | null
    due_date?: string | null
  }>
}
```
Returns `400` if `tasks` is not a non-empty array.

**Response:**
```ts
{ items: Item[] }
```

**Database queries:**
```sql
-- Wrapped in a SQLite transaction; per row:
INSERT INTO items (title, description, status, priority, color, assignee, due_date)
VALUES (?, ?, ?, ?, ?, ?, ?);

SELECT * FROM items WHERE id = ?;   -- per row
```

**Dependencies:** none

**Notes:** Uses `db.transaction()` for atomicity — all inserts succeed or none do.

---

### 4. `PATCH /api/items/:id`

**Purpose:** Update one or more fields on an existing item. Appends history entries for every changed field.

**URL param:** `id` — item ID (integer as string)

**Request body:** any subset of:
```ts
{
  title?: string
  description?: string | null
  status?: string
  priority?: string
  color?: string | null
  assignee?: string | null
  due_date?: string | null
  position?: number
}
```
Returns `400` if no valid fields are present. Returns `404` if item not found.

**Response:** `Item` — the updated item with full `history` array

**Database queries:**
```sql
-- Fetch old values for history diffing
SELECT * FROM items WHERE id = ?;

-- Dynamic UPDATE (only fields present in body)
UPDATE items SET <field> = ?, ..., last_modified = datetime('now') WHERE id = ?;

-- Per changed field (0–N inserts):
INSERT INTO item_history (item_id, description) VALUES (?, ?);

-- Fetch updated item + history
SELECT * FROM items WHERE id = ?;
SELECT * FROM item_history WHERE item_id = ? ORDER BY changed_at DESC;
```

**Dependencies:** none

**History entry format:**
- `title` / `description` changed → `"title changed"` / `"description changed"`
- Field was null, now set → `"<field> set to '<value>'"`
- Field cleared to null → `"<field> cleared"`
- Otherwise → `"<field> changed from '<old>' to '<new>'"`

---

### 5. `DELETE /api/items/:id`

**Purpose:** Delete an item. History rows are cascade-deleted by the FK constraint.

**URL param:** `id` — item ID

**Request:** none

**Response:**
```ts
{ ok: true }
```

**Database queries:**
```sql
DELETE FROM items WHERE id = ?;
```
`item_history` rows are removed automatically via `ON DELETE CASCADE`.

**Dependencies:** none

---

### 6. `POST /api/chat`

**Purpose:** Agentic AI assistant. Accepts a user message plus the current board state. Claude can call four tools to mutate the board directly; the route executes those mutations and returns Claude's text reply along with a log of actions taken.

**Request body:**
```ts
{
  message: string      // user message
  items: Item[]        // current board state (sent by client, not fetched from DB)
}
```
Returns `400` if either field is missing.

**Response:**
```ts
{
  response: string       // Claude's text reply
  actions?: string[]     // list of action summaries, e.g. ["Created task: Fix bug", "Moved task 'X' to Done"]
  errors?: string[]      // per-tool error messages if a tool call failed
}
```

**Database queries (inside tool handlers):**

| Tool | Queries |
|---|---|
| `create_item` | `INSERT INTO items (...)` · `SELECT * FROM items WHERE id = ?` |
| `update_item` | `UPDATE items SET ... WHERE id = ?` · `SELECT * FROM items WHERE id = ?` |
| `delete_item` | `SELECT * FROM items WHERE id = ?` · `DELETE FROM items WHERE id = ?` |
| `move_item` | `SELECT id FROM items WHERE id = ?` · `UPDATE items SET status = ? ... WHERE id = ?` · `SELECT * FROM items WHERE id = ?` |

**Claude tools defined:**

| Tool name | Description | Required input |
|---|---|---|
| `create_item` | Create a task | `title`, `status` |
| `update_item` | Update a task | `id` |
| `delete_item` | Delete a task | `id` |
| `move_item` | Change a task's status | `id`, `new_status` |

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 1024)
- May make 2 API calls: initial turn + follow-up after tool results

---

### 7. `POST /api/insights`

**Purpose:** Analyse the board state and return a list of typed insight objects (stale tasks, bottlenecks, priority inflation, deadline clusters, semantic duplicates).

**Request body:**
```ts
{ items: Item[] }    // client sends current board state
```
Returns `400` if `items` is missing or not an array.

**Response:**
```ts
{
  insights: Array<{
    type: 'stale' | 'bottleneck' | 'duplicate' | 'priority_inflation' | 'deadline_cluster'
    severity: 'low' | 'medium' | 'high'
    title: string
    description: string
    items: number[]   // item IDs implicated
  }>
}
```

**Database queries:** none — works entirely on the `items` array passed in the request body.

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 1024) — **only for duplicate detection** (semantic analysis). All other insight types are computed in JavaScript with no AI call.

**Insight detection logic (no AI):**
- **Stale:** `in_progress` items where `last_modified < now - 7 days`. Severity: low (<3), medium (3–4), high (5+).
- **Bottleneck:** Any status column with 5+ items and 3× more than any other column. Severity: high if 8+, else medium.
- **Priority inflation:** ≥60% of items are `high` or `critical`. Always medium severity.
- **Deadline cluster:** 3+ items with `due_date` within a 2-day window (excluding `done`). Severity: high if 5+, else medium.
- **Duplicate:** AI call to `claude-sonnet-4-5-20250929`. Sends item IDs + titles + descriptions; expects `{"groups": [[id, id], ...]}`.

---

### 8. `POST /api/recommend-next`

**Purpose:** Ask Claude to pick the single highest-priority task the user should work on next.

**Request body:**
```ts
{ items: Item[] }
```
Returns `400` if `items` is missing, not an array, or empty. Returns `400` if all items are `done`.

**Response:**
```ts
{
  recommendedItemId: number
  reason: string        // 1-sentence explanation
}
```

**Database queries:** none

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 256)
- Sends only non-done items; expects `{"itemId": N, "reason": "..."}`.

---

### 9. `POST /api/narrative`

**Purpose:** Generate a plain-English standup summary and a momentum score (0–100) for a given time period, based on activity pulled directly from the database.

**Request body:**
```ts
{
  period: 'last_week' | 'last_30_days' | 'this_month' | 'previous_7_days'
}
```
Returns `400` for unrecognised period.

**Response:**
```ts
{
  period: string
  period_start: string           // SQLite datetime string
  period_end: string
  summary: {
    tasks_created: number
    tasks_completed: number
    tasks_stuck: number
    tasks_unblocked: number
    status_changes: number
    priority_changes: number
  }
  tasks_created: CreatedItem[]
  tasks_completed: HistoryEntry[]
  tasks_stuck: HistoryEntry[]
  tasks_unblocked: HistoryEntry[]
  status_changes: HistoryEntry[]
  priority_changes: HistoryEntry[]
  narrative: string              // 2–3 sentence AI summary
  momentum: {
    score: number                // 0–100
    reasoning: string
    sentiment: 'healthy' | 'at_risk' | 'critical'
  } | null
}
```

**Period definitions:**
| Period key | DB start modifier | DB end modifier |
|---|---|---|
| `last_week` | `-7 days` | now |
| `last_30_days` | `-30 days` | now |
| `this_month` | `start of month` | now |
| `previous_7_days` | `-14 days` | `-7 days` |

**Database queries:**
```sql
-- Compute period boundaries using SQLite datetime()
SELECT datetime('now', ?) AS t;   -- for start
SELECT datetime('now', ?) AS t;   -- for end (if bounded period)
SELECT datetime('now') AS t;      -- for 'now' end

-- Tasks created in period
SELECT id, title, status, priority, assignee, created_at
FROM items
WHERE created_at >= ? [AND created_at < ?]
ORDER BY created_at ASC;

-- All history in period (with item title via JOIN)
SELECT h.item_id, i.title, h.changed_at, h.description
FROM item_history h
JOIN items i ON i.id = h.item_id
WHERE h.changed_at >= ? [AND h.changed_at < ?]
ORDER BY h.changed_at ASC;
```
History is then partitioned in memory by description prefix to produce `status_changes`, `priority_changes`, `tasks_completed` (status → `'done'`), `tasks_stuck` (status → `'stuck'`), `tasks_unblocked` (status from `'stuck'`).

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 256) — called **twice in parallel**:
  1. Narrative text (prose summary)
  2. Momentum score (JSON object)

---

### 10. `POST /api/check-deadline-risks`

**Purpose:** Scan the DB for tasks that are at risk of missing their deadline based on their current status and due date proximity. Pure server-side logic — no AI.

**Request:** none (no body needed)

**Response:**
```ts
{
  at_risk: Array<{
    item_id: number
    title: string
    due_date: string
    status: string
    risk_level: 'high' | 'medium'
  }>
}
```

**Risk rules:**
| Condition | Risk level |
|---|---|
| `not_started` AND due within 24 h | `high` |
| `stuck` AND due within 48 h | `high` |
| `in_progress` AND due today | `medium` |

**Database queries:**
```sql
SELECT id, title, status, due_date
FROM items
WHERE due_date IS NOT NULL AND status != 'done';
```
Risk evaluation is done in JavaScript after fetching.

**Dependencies:** none

---

### 11. `POST /api/deadline-actions`

**Purpose:** Record that the user took an action (reschedule / deprioritize / split) on a deadline-at-risk task. Used to build up a pattern for `suggest-reschedule`.

**Request body:**
```ts
{
  item_id?: number | null
  action_type: 'reschedule' | 'deprioritize' | 'split'   // required
  original_due_date?: string | null    // YYYY-MM-DD
  new_due_date?: string | null         // YYYY-MM-DD
}
```
Returns `400` if `action_type` is missing or invalid.

**Response:**
```ts
{ ok: true }
```

**Database queries:**
```sql
INSERT INTO deadline_actions (item_id, action_type, original_due_date, new_due_date, days_extended)
VALUES (?, ?, ?, ?, ?);
```
`days_extended` is computed server-side for `reschedule` actions: `round((new_date - orig_date) / 86400000)`.

**Dependencies:** none

---

### 12. `POST /api/suggest-reschedule`

**Purpose:** Given a task ID, suggest 2–3 realistic new due dates (AI-generated), optionally prepending the user's historical reschedule pattern if they have a consistent one.

**Request body:**
```ts
{ itemId: number }    // required
```
Returns `400` if missing, `404` if item not found.

**Response:**
```ts
{
  suggestions: Array<{
    date: string          // YYYY-MM-DD
    label: string         // e.g. "Friday (3 days out)"
    isPattern?: true      // present only on the pattern suggestion
  }>
  pattern: { days: number; count: number } | null
}
```

**Database queries:**
```sql
-- Fetch the item being rescheduled
SELECT id, title, priority, status, due_date FROM items WHERE id = ?;

-- Other upcoming tasks (workload context, next 14 days)
SELECT title, due_date, priority FROM items
WHERE due_date IS NOT NULL AND due_date >= ? AND due_date <= ?
  AND id != ? AND status != 'done'
ORDER BY due_date ASC LIMIT 10;

-- Recent completions (effort estimate context)
SELECT title, created_at, last_modified FROM items
WHERE status = 'done' ORDER BY last_modified DESC LIMIT 5;

-- User's most common reschedule extension (pattern detection)
SELECT days_extended, COUNT(*) AS count
FROM deadline_actions
WHERE action_type = 'reschedule' AND days_extended > 0
GROUP BY days_extended
ORDER BY count DESC, days_extended ASC
LIMIT 1;
```

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 256)
- Prompt includes today's date, task details, upcoming workload, and recent completion times.
- Expects a JSON array: `[{"date": "YYYY-MM-DD", "label": "..."}, ...]`
- If a pattern exists (same `days_extended` used ≥ 2 times), a pattern suggestion is prepended.

---

### 13. `POST /api/suggest-split`

**Purpose:** Given an overdue/large task, suggest 2–4 smaller subtasks the user could break it into.

**Request body:**
```ts
{ itemId: number }    // required
```
Returns `400` if missing, `404` if item not found.

**Response:**
```ts
{
  suggestions: Array<{
    title: string
    description: string
    estimated_priority: 'low' | 'medium' | 'high' | 'critical'
  }>
}
```

**Database queries:**
```sql
SELECT id, title, description FROM items WHERE id = ?;
```

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 512)
- Sends task title + description; expects a JSON array of subtask objects.

---

### 14. `POST /api/extract-tasks`

**Purpose:** Extract actionable tasks from freeform text (emails, meeting notes, etc.).

**Request body:**
```ts
{ text: string }    // required, min 10 chars
```
Returns `400` if missing, too short, or empty.

**Response:**
```ts
{
  tasks: Array<{
    title: string
    description: string | null
    priority: 'low' | 'medium' | 'high' | 'critical'
    due_date: string | null
    assignee: string | null
    status: 'not_started' | 'in_progress' | 'stuck' | 'done'
    status_reasoning: string | null
    color: string | null          // always null
    confidence: {
      title: number               // 0–100
      priority: number
      due_date: number
      assignee: number
      description: number
    }
  }>
  message?: string                // present when tasks array is empty
}
```

**Database queries:** none

**Dependencies:**
- Anthropic API (`claude-sonnet-4-5-20250929`, max_tokens 2048)
- Uses prefill trick (`assistant: "["`) to force JSON array output.

---

### 15. `POST /api/extract-from-file`

**Purpose:** Upload a file (.txt, .pdf, .docx), extract its text, then run the same extraction logic as `/api/extract-tasks`.

**Request:** `multipart/form-data`
```
file: <binary>    // field name "file", max 5 MB
```
Accepted extensions: `.txt`, `.pdf`, `.docx`.
Returns `400` for wrong type, oversized file, or too-little text after extraction.

**Response:** same shape as `/api/extract-tasks`

**Database queries:** none

**Dependencies:**
- `multer` — multipart parsing, memory storage, file type + size validation
- `pdf-parse` (`PDFParse`) — PDF text extraction
- `mammoth` — .docx text extraction
- Anthropic API — same call as `extract-tasks` after text is extracted

---

## Cross-cutting notes

### Error middleware
A global Express error handler (last middleware) catches `multer.MulterError` with code `LIMIT_FILE_SIZE` → 400, and any error whose message starts with `"Unsupported file type"` → 400. All other errors fall through to Express's default 500 handler.

### Static data, no DB reads (client sends board state)
These routes accept `items` in the request body rather than querying the DB. They work entirely on client-supplied data:
- `POST /api/chat` (items for context; DB writes happen inside tool calls)
- `POST /api/insights`
- `POST /api/recommend-next`

### DB-reads-own-data routes (fetch from DB server-side)
These routes query the DB directly and would need per-user filtering once auth is added:
- `GET /api/items`
- `PATCH /api/items/:id` (reads old values for history diff)
- `POST /api/narrative` (complex period queries)
- `POST /api/check-deadline-risks`
- `POST /api/suggest-reschedule` (item + upcoming + done + pattern)
- `POST /api/suggest-split` (item lookup)

### Anthropic model used throughout
All AI calls use `claude-sonnet-4-5-20250929`. Several routes use the prefill trick (`{ role: 'assistant', content: '{' }` or `'['`) to force valid JSON output without a wrapping code block.

### Serverless conversion considerations
| Concern | Detail |
|---|---|
| DB connection | better-sqlite3 is synchronous and file-based — incompatible with serverless. Needs Turso/libsql or PlanetScale/Neon. |
| File uploads | `multer` with `memoryStorage()` — compatible with serverless as long as memory limits are respected (5 MB max enforced). |
| Transactions | `POST /api/items/bulk` uses `db.transaction()` — needs equivalent in the new DB client. |
| Cold starts | `/api/narrative` and `/api/suggest-reschedule` each make multiple DB round-trips; warm invocations won't be affected. |
| AI latency | `/api/chat`, `/api/narrative` can make 2 sequential AI calls. `/api/narrative` runs 2 in parallel with `Promise.all`. |
| No auth today | All routes are currently unauthenticated. Every DB-read route touches all rows with no user filter. |
