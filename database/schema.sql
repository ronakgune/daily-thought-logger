-- Daily Thought Logger Database Schema
-- SQLite database for storing voice recordings, extracted insights, and summaries

-- Raw logs from voice recordings
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  transcript TEXT NOT NULL,
  raw_analysis TEXT,
  audio_path TEXT,
  duration_seconds INTEGER
);

-- Extracted accomplishments
CREATE TABLE IF NOT EXISTS accomplishments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted todos
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  confidence REAL,
  user_reclassified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted ideas
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  category TEXT,
  confidence REAL,
  user_reclassified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted learnings
CREATE TABLE IF NOT EXISTS learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  topic TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly summaries
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content TEXT NOT NULL,
  highlights TEXT,
  stats TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_todos_log_id ON todos(log_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_ideas_log_id ON ideas(log_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_learnings_log_id ON learnings(log_id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_log_id ON accomplishments(log_id);
CREATE INDEX IF NOT EXISTS idx_summaries_week ON summaries(week_start, week_end);
