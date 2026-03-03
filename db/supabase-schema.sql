-- ============================================================
-- Supabase Schema — Flow Kanban
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id            UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID                      NOT NULL REFERENCES auth.users(id),
  title         VARCHAR(500)              NOT NULL,
  description   TEXT,
  status        VARCHAR(50)               NOT NULL DEFAULT 'not_started',
  priority      VARCHAR(50)               NOT NULL DEFAULT 'medium',
  color         VARCHAR(50),
  assignee      VARCHAR(255),
  due_date      DATE,
  position      INTEGER                   NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  last_modified TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- item_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_history (
  id         UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID                      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  field      VARCHAR(100)              NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  changed_at TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_items_user_id
  ON items (user_id);

CREATE INDEX IF NOT EXISTS idx_items_status
  ON items (status);

CREATE INDEX IF NOT EXISTS idx_items_due_date
  ON items (due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_item_history_item_id
  ON item_history (item_id);

-- ------------------------------------------------------------
-- Row-Level Security
-- ------------------------------------------------------------
ALTER TABLE items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;

-- items policies
CREATE POLICY "items: select own"
  ON items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "items: insert own"
  ON items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "items: update own"
  ON items FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "items: delete own"
  ON items FOR DELETE
  USING (user_id = auth.uid());

-- item_history policies
CREATE POLICY "item_history: select own"
  ON item_history FOR SELECT
  USING (
    item_id IN (
      SELECT id FROM items WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- deadline_actions
-- Tracks what action the user took on an at-risk task.
-- Used by suggest-reschedule for pattern detection.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deadline_actions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  item_id           UUID        REFERENCES items(id) ON DELETE SET NULL,
  action_type       VARCHAR(50) NOT NULL,   -- reschedule | deprioritize | split
  original_due_date DATE,
  new_due_date      DATE,
  days_extended     INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadline_actions_user_id
  ON deadline_actions (user_id);

ALTER TABLE deadline_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_actions: select own"
  ON deadline_actions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "deadline_actions: insert own"
  ON deadline_actions FOR INSERT
  WITH CHECK (user_id = auth.uid());
