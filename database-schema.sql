-- ============================================================
-- SQLite Schema — Flow Kanban
-- Source: server/db.ts
-- Generated for conversion to Postgres
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: items
--
-- The primary data table. One row per task card on the board.
--
-- Column notes:
--   id           AUTOINCREMENT integer PK. SQLite stores as 64-bit signed int.
--   title        Required. No length constraint enforced at DB level.
--   description  Optional freeform text.
--   status       Enum-like TEXT. App enforces: not_started | in_progress | done | stuck
--   priority     Enum-like TEXT. App enforces: low | medium | high | critical
--   color        Optional label color (free string, no palette constraint in DB).
--   assignee     Optional name string.
--   due_date     Stored as TEXT in YYYY-MM-DD format. No DATE type in SQLite.
--   position     Integer used to order cards within a status column. Lower = higher.
--   created_at   Set to SQLite datetime('now') on insert (UTC, format: 'YYYY-MM-DD HH:MM:SS').
--   last_modified Updated to datetime('now') on every PATCH. Same format as created_at.
--
-- Indexes:
--   PRIMARY KEY on id  → implicit unique index (SQLite rowid alias)
--   No explicit secondary indexes defined.
--
-- Relationships:
--   Referenced by item_history.item_id  (ON DELETE CASCADE)
--   Referenced by deadline_actions.item_id  (no FK constraint on that side)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS items (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    title         TEXT     NOT NULL,
    description   TEXT,
    status        TEXT     NOT NULL DEFAULT 'not_started',
    priority      TEXT     NOT NULL DEFAULT 'medium',
    color         TEXT,
    assignee      TEXT,
    due_date      TEXT,
    position      INTEGER  NOT NULL DEFAULT 0,
    created_at    TEXT     NOT NULL DEFAULT (datetime('now')),
    last_modified TEXT     NOT NULL DEFAULT (datetime('now'))
);


-- ------------------------------------------------------------
-- TABLE: item_history
--
-- Append-only audit log. One row per field change on an item.
-- Written by the PATCH /api/items/:id route whenever a field
-- value actually changes (old != new).
--
-- Column notes:
--   id          AUTOINCREMENT PK.
--   item_id     FK → items(id). Cascade-deleted when the parent item is deleted.
--   changed_at  Set to datetime('now') on insert. Same TEXT format as items.created_at.
--   description Human-readable summary of the change. Examples:
--                 "status changed from 'not_started' to 'in_progress'"
--                 "priority set to 'high'"
--                 "due_date cleared"
--                 "title changed"
--                 "description changed"
--
-- Indexes:
--   PRIMARY KEY on id  → implicit unique index
--   No explicit index on item_id (all history fetches use a WHERE item_id = ? or
--   a full table scan that is grouped in application memory).
--
-- Relationships:
--   item_id → items(id)  FOREIGN KEY with ON DELETE CASCADE
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS item_history (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER  NOT NULL,
    changed_at  TEXT     NOT NULL DEFAULT (datetime('now')),
    description TEXT     NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- TABLE: deadline_actions
--
-- Analytics log. Records user decisions on at-risk deadlines.
-- Written by POST /api/deadline-actions.
-- Read by POST /api/suggest-reschedule to detect reschedule patterns.
--
-- Column notes:
--   id                 AUTOINCREMENT PK.
--   item_id            References the task acted on. Intentionally nullable
--                      (no FK constraint — rows are kept even if the item is deleted).
--   action_type        App enforces: reschedule | deprioritize | split
--   original_due_date  YYYY-MM-DD TEXT. Nullable.
--   new_due_date       YYYY-MM-DD TEXT. Nullable. Only set for 'reschedule'.
--   days_extended      Integer computed server-side: round((new - orig) / 86400000).
--                      Nullable. Only set for 'reschedule' actions where both dates present.
--   created_at         Set to datetime('now') on insert.
--
-- Indexes:
--   PRIMARY KEY on id  → implicit unique index
--   No explicit index on item_id or action_type.
--
-- Relationships:
--   item_id loosely references items(id) but NO FOREIGN KEY CONSTRAINT is declared.
--   Rows are intentionally orphaned when an item is deleted (audit trail is preserved).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS deadline_actions (
    id                 INTEGER  PRIMARY KEY AUTOINCREMENT,
    item_id            INTEGER,
    action_type        TEXT     NOT NULL,
    original_due_date  TEXT,
    new_due_date       TEXT,
    days_extended      INTEGER,
    created_at         TEXT     NOT NULL DEFAULT (datetime('now'))
);


-- ============================================================
-- RELATIONSHIPS SUMMARY
--
--   items (1) ──< item_history (many)
--     items.id = item_history.item_id
--     ON DELETE CASCADE (enforced by FK constraint)
--
--   items (1) ──< deadline_actions (many)
--     items.id = deadline_actions.item_id
--     NO FK constraint — orphan rows allowed
--
-- ============================================================


-- ============================================================
-- POSTGRES CONVERSION NOTES
--
-- 1. INTEGER PRIMARY KEY AUTOINCREMENT
--      SQLite: INTEGER PRIMARY KEY AUTOINCREMENT
--      Postgres: SERIAL PRIMARY KEY  or  BIGSERIAL PRIMARY KEY
--      (AUTOINCREMENT in SQLite prevents rowid reuse; SERIAL in Postgres
--      uses a sequence — equivalent behaviour for new inserts)
--
-- 2. TEXT columns storing dates
--      SQLite: TEXT (no native date type)
--      Postgres: Use DATE for due_date, TIMESTAMPTZ for created_at / last_modified / changed_at
--      App currently stores dates as 'YYYY-MM-DD' and datetimes as 'YYYY-MM-DD HH:MM:SS' (UTC).
--      All reads/writes go through the app layer — safe to change column type in Postgres
--      as long as insert/select logic is updated.
--
-- 3. Default datetime('now')
--      SQLite: DEFAULT (datetime('now'))
--      Postgres: DEFAULT NOW()  or  DEFAULT CURRENT_TIMESTAMP
--
-- 4. ON DELETE CASCADE
--      Supported identically in Postgres — no change needed.
--
-- 5. TEXT NOT NULL with no CHECK constraint
--      status and priority columns have app-level enum validation only.
--      In Postgres you can optionally add:
--        status   TEXT NOT NULL DEFAULT 'not_started'
--                 CHECK (status IN ('not_started','in_progress','done','stuck')),
--        priority TEXT NOT NULL DEFAULT 'medium'
--                 CHECK (priority IN ('low','medium','high','critical')),
--
-- 6. Missing indexes to consider adding in Postgres
--      CREATE INDEX ON item_history (item_id);          -- frequent WHERE item_id = ?
--      CREATE INDEX ON items (status);                  -- board column queries
--      CREATE INDEX ON items (due_date) WHERE due_date IS NOT NULL;  -- deadline checks
--      CREATE INDEX ON deadline_actions (action_type, days_extended); -- pattern query
--
-- ============================================================
