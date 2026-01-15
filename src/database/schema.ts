/**
 * SQLite Schema for Daily Thought Logger
 * AI-9/AI-10: Database schema definitions
 */

export const SCHEMA_VERSION = 1;

/**
 * SQL statements to create all database tables.
 * Uses SQLite best practices:
 * - INTEGER PRIMARY KEY for auto-increment
 * - FOREIGN KEY constraints with CASCADE delete
 * - DEFAULT values for timestamps
 * - CHECK constraints for enums
 */
export const CREATE_TABLES_SQL = `
-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Logs table: Main daily log entries
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  audio_path TEXT,
  transcript TEXT,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);

-- Todos table: Action items from logs
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  due_date TEXT,
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);

-- Indexes for todo queries
CREATE INDEX IF NOT EXISTS idx_todos_log_id ON todos(log_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

-- Ideas table: Captured ideas from logs
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'raw' CHECK (status IN ('raw', 'developing', 'actionable', 'archived')),
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);

-- Indexes for idea queries
CREATE INDEX IF NOT EXISTS idx_ideas_log_id ON ideas(log_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- Learnings table: Things learned from logs
CREATE TABLE IF NOT EXISTS learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);

-- Index for learning queries
CREATE INDEX IF NOT EXISTS idx_learnings_log_id ON learnings(log_id);

-- Accomplishments table: Completed achievements from logs
CREATE TABLE IF NOT EXISTS accomplishments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);

-- Index for accomplishment queries
CREATE INDEX IF NOT EXISTS idx_accomplishments_log_id ON accomplishments(log_id);

-- Summaries table: Weekly AI-generated summaries
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  week_end TEXT NOT NULL,
  content TEXT NOT NULL,
  highlights TEXT,
  generated_at TEXT DEFAULT (datetime('now'))
);

-- Index for summary queries
CREATE INDEX IF NOT EXISTS idx_summaries_week_start ON summaries(week_start);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
`;

/**
 * Migration SQL statements for future schema updates
 */
export const MIGRATIONS: Record<number, string> = {
  // Future migrations will be added here
  // 2: 'ALTER TABLE logs ADD COLUMN mood TEXT;',
};
