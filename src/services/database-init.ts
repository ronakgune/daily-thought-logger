/**
 * Database initialization service for Daily Thought Logger
 * Uses better-sqlite3 for synchronous SQLite operations
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

/**
 * Get the path to the database file in the app data directory
 */
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'thought-logger.db');
}

/**
 * Get the path to the schema SQL file
 */
function getSchemaPath(): string {
  // In development, schema is in the project root
  // In production, it's bundled with the app
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'database', 'schema.sql');
  }
  return path.join(__dirname, '..', '..', 'database', 'schema.sql');
}

/**
 * Initialize the database connection and create tables if they don't exist
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);

  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Open or create the database
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Initialize schema
  initializeSchema(db);

  console.log(`Database initialized at: ${dbPath}`);

  return db;
}

/**
 * Initialize the database schema from the SQL file
 */
function initializeSchema(database: Database.Database): void {
  const schemaPath = getSchemaPath();

  if (!fs.existsSync(schemaPath)) {
    console.warn(`Schema file not found at ${schemaPath}, using embedded schema`);
    initializeEmbeddedSchema(database);
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
}

/**
 * Fallback: Initialize schema directly if schema.sql is not found
 */
function initializeEmbeddedSchema(database: Database.Database): void {
  database.exec(`
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

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_todos_log_id ON todos(log_id);
    CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
    CREATE INDEX IF NOT EXISTS idx_ideas_log_id ON ideas(log_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
    CREATE INDEX IF NOT EXISTS idx_learnings_log_id ON learnings(log_id);
    CREATE INDEX IF NOT EXISTS idx_accomplishments_log_id ON accomplishments(log_id);
    CREATE INDEX IF NOT EXISTS idx_summaries_week ON summaries(week_start, week_end);
  `);
}

/**
 * Get the current database instance
 * Throws if database is not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Check if the database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
  logsCount: number;
  todosCount: number;
  ideasCount: number;
  learningsCount: number;
  accomplishmentsCount: number;
  summariesCount: number;
} {
  const database = getDatabase();

  return {
    logsCount: (database.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number }).count,
    todosCount: (database.prepare('SELECT COUNT(*) as count FROM todos').get() as { count: number }).count,
    ideasCount: (database.prepare('SELECT COUNT(*) as count FROM ideas').get() as { count: number }).count,
    learningsCount: (database.prepare('SELECT COUNT(*) as count FROM learnings').get() as { count: number }).count,
    accomplishmentsCount: (database.prepare('SELECT COUNT(*) as count FROM accomplishments').get() as { count: number }).count,
    summariesCount: (database.prepare('SELECT COUNT(*) as count FROM summaries').get() as { count: number }).count,
  };
}
