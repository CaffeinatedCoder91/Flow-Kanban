import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'

mkdirSync('db', { recursive: true })

const db = new Database('db/todos.db')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started',
    priority TEXT NOT NULL DEFAULT 'medium',
    color TEXT,
    assignee TEXT,
    due_date TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS item_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS deadline_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    action_type TEXT NOT NULL,
    original_due_date TEXT,
    new_due_date TEXT,
    days_extended INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

export default db
