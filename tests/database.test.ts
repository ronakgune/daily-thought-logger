/**
 * Database service tests for Daily Thought Logger
 * Uses in-memory SQLite database for testing
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Create a test database module that doesn't depend on Electron
describe('Database Schema', () => {
  let db: Database.Database;
  let testDbPath: string;

  beforeAll(() => {
    // Create a temp database for testing
    testDbPath = path.join(os.tmpdir(), `thought-logger-test-${Date.now()}.db`);
    db = new Database(testDbPath);
    db.pragma('foreign_keys = ON');

    // Load and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  });

  afterAll(() => {
    db.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Tables exist', () => {
    const expectedTables = ['logs', 'accomplishments', 'todos', 'ideas', 'learnings', 'summaries'];

    for (const table of expectedTables) {
      it(`should have ${table} table`, () => {
        const result = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
        ).get(table) as { name: string } | undefined;
        expect(result).toBeDefined();
        expect(result?.name).toBe(table);
      });
    }
  });

  describe('Indexes exist', () => {
    const expectedIndexes = [
      'idx_logs_timestamp',
      'idx_todos_log_id',
      'idx_todos_completed',
      'idx_ideas_log_id',
      'idx_ideas_status',
      'idx_learnings_log_id',
      'idx_accomplishments_log_id',
      'idx_summaries_week',
    ];

    for (const index of expectedIndexes) {
      it(`should have ${index} index`, () => {
        const result = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name=?"
        ).get(index) as { name: string } | undefined;
        expect(result).toBeDefined();
        expect(result?.name).toBe(index);
      });
    }
  });

  describe('Logs table', () => {
    it('should insert a log entry', () => {
      const stmt = db.prepare(
        'INSERT INTO logs (transcript, raw_analysis, audio_path, duration_seconds) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run('Test transcript', '{"items": []}', '/path/to/audio.wav', 120);
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeGreaterThan(0);
    });

    it('should auto-generate timestamp', () => {
      const stmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const result = stmt.run('Auto timestamp test');

      const log = db.prepare('SELECT * FROM logs WHERE id = ?').get(result.lastInsertRowid) as {
        id: number;
        timestamp: string;
        transcript: string;
      };
      expect(log.timestamp).toBeDefined();
      expect(log.transcript).toBe('Auto timestamp test');
    });
  });

  describe('Todos table', () => {
    let logId: number;

    beforeAll(() => {
      const stmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const result = stmt.run('Log for todos test');
      logId = result.lastInsertRowid as number;
    });

    it('should insert a todo with default values', () => {
      const stmt = db.prepare('INSERT INTO todos (log_id, text) VALUES (?, ?)');
      const result = stmt.run(logId, 'Test todo item');

      const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as {
        id: number;
        log_id: number;
        text: string;
        completed: number;
        priority: string;
        user_reclassified: number;
      };

      expect(todo.completed).toBe(0); // Default false
      expect(todo.priority).toBe('medium'); // Default medium
      expect(todo.user_reclassified).toBe(0); // Default false
    });

    it('should insert a todo with custom priority', () => {
      const stmt = db.prepare('INSERT INTO todos (log_id, text, priority, confidence) VALUES (?, ?, ?, ?)');
      const result = stmt.run(logId, 'High priority todo', 'high', 0.95);

      const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as {
        priority: string;
        confidence: number;
      };

      expect(todo.priority).toBe('high');
      expect(todo.confidence).toBeCloseTo(0.95);
    });

    it('should update todo completion status', () => {
      const insertStmt = db.prepare('INSERT INTO todos (log_id, text) VALUES (?, ?)');
      const insertResult = insertStmt.run(logId, 'Todo to complete');

      const updateStmt = db.prepare('UPDATE todos SET completed = 1 WHERE id = ?');
      updateStmt.run(insertResult.lastInsertRowid);

      const todo = db.prepare('SELECT completed FROM todos WHERE id = ?').get(insertResult.lastInsertRowid) as {
        completed: number;
      };

      expect(todo.completed).toBe(1);
    });
  });

  describe('Ideas table', () => {
    let logId: number;

    beforeAll(() => {
      const stmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const result = stmt.run('Log for ideas test');
      logId = result.lastInsertRowid as number;
    });

    it('should insert an idea with default status', () => {
      const stmt = db.prepare('INSERT INTO ideas (log_id, text, category) VALUES (?, ?, ?)');
      const result = stmt.run(logId, 'Test idea', 'feature');

      const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(result.lastInsertRowid) as {
        status: string;
        category: string;
        user_reclassified: number;
      };

      expect(idea.status).toBe('new'); // Default status
      expect(idea.category).toBe('feature');
      expect(idea.user_reclassified).toBe(0);
    });

    it('should update idea status', () => {
      const insertStmt = db.prepare('INSERT INTO ideas (log_id, text) VALUES (?, ?)');
      const insertResult = insertStmt.run(logId, 'Idea to review');

      const updateStmt = db.prepare('UPDATE ideas SET status = ? WHERE id = ?');
      updateStmt.run('reviewing', insertResult.lastInsertRowid);

      const idea = db.prepare('SELECT status FROM ideas WHERE id = ?').get(insertResult.lastInsertRowid) as {
        status: string;
      };

      expect(idea.status).toBe('reviewing');
    });
  });

  describe('Learnings table', () => {
    let logId: number;

    beforeAll(() => {
      const stmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const result = stmt.run('Log for learnings test');
      logId = result.lastInsertRowid as number;
    });

    it('should insert a learning with topic', () => {
      const stmt = db.prepare('INSERT INTO learnings (log_id, text, topic, confidence) VALUES (?, ?, ?, ?)');
      const result = stmt.run(logId, 'TIL about SQLite', 'databases', 0.87);

      const learning = db.prepare('SELECT * FROM learnings WHERE id = ?').get(result.lastInsertRowid) as {
        text: string;
        topic: string;
        confidence: number;
      };

      expect(learning.text).toBe('TIL about SQLite');
      expect(learning.topic).toBe('databases');
      expect(learning.confidence).toBeCloseTo(0.87);
    });
  });

  describe('Accomplishments table', () => {
    let logId: number;

    beforeAll(() => {
      const stmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const result = stmt.run('Log for accomplishments test');
      logId = result.lastInsertRowid as number;
    });

    it('should insert an accomplishment', () => {
      const stmt = db.prepare('INSERT INTO accomplishments (log_id, text, confidence) VALUES (?, ?, ?)');
      const result = stmt.run(logId, 'Finished the database schema', 0.92);

      const accomplishment = db.prepare('SELECT * FROM accomplishments WHERE id = ?').get(result.lastInsertRowid) as {
        text: string;
        confidence: number;
        created_at: string;
      };

      expect(accomplishment.text).toBe('Finished the database schema');
      expect(accomplishment.confidence).toBeCloseTo(0.92);
      expect(accomplishment.created_at).toBeDefined();
    });
  });

  describe('Summaries table', () => {
    it('should insert a weekly summary', () => {
      const stmt = db.prepare(
        'INSERT INTO summaries (week_start, week_end, content, highlights, stats) VALUES (?, ?, ?, ?, ?)'
      );
      const result = stmt.run(
        '2024-01-08',
        '2024-01-14',
        'This week I focused on database design...',
        'Completed SQLite schema, Started testing',
        '{"todos_completed": 5, "ideas_captured": 3}'
      );

      const summary = db.prepare('SELECT * FROM summaries WHERE id = ?').get(result.lastInsertRowid) as {
        week_start: string;
        week_end: string;
        content: string;
        highlights: string;
        stats: string;
      };

      expect(summary.week_start).toBe('2024-01-08');
      expect(summary.week_end).toBe('2024-01-14');
      expect(summary.content).toContain('database design');
      expect(JSON.parse(summary.stats)).toEqual({ todos_completed: 5, ideas_captured: 3 });
    });
  });

  describe('Foreign key constraints', () => {
    it('should cascade delete related records when log is deleted', () => {
      // Insert a log
      const logStmt = db.prepare('INSERT INTO logs (transcript) VALUES (?)');
      const logResult = logStmt.run('Log for cascade test');
      const logId = logResult.lastInsertRowid as number;

      // Insert related records
      db.prepare('INSERT INTO todos (log_id, text) VALUES (?, ?)').run(logId, 'Todo 1');
      db.prepare('INSERT INTO ideas (log_id, text) VALUES (?, ?)').run(logId, 'Idea 1');
      db.prepare('INSERT INTO learnings (log_id, text) VALUES (?, ?)').run(logId, 'Learning 1');
      db.prepare('INSERT INTO accomplishments (log_id, text) VALUES (?, ?)').run(logId, 'Accomplishment 1');

      // Verify records exist
      expect((db.prepare('SELECT COUNT(*) as c FROM todos WHERE log_id = ?').get(logId) as { c: number }).c).toBe(1);
      expect((db.prepare('SELECT COUNT(*) as c FROM ideas WHERE log_id = ?').get(logId) as { c: number }).c).toBe(1);
      expect((db.prepare('SELECT COUNT(*) as c FROM learnings WHERE log_id = ?').get(logId) as { c: number }).c).toBe(1);
      expect((db.prepare('SELECT COUNT(*) as c FROM accomplishments WHERE log_id = ?').get(logId) as { c: number }).c).toBe(1);

      // Delete the log
      db.prepare('DELETE FROM logs WHERE id = ?').run(logId);

      // Verify cascade delete
      expect((db.prepare('SELECT COUNT(*) as c FROM todos WHERE log_id = ?').get(logId) as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) as c FROM ideas WHERE log_id = ?').get(logId) as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) as c FROM learnings WHERE log_id = ?').get(logId) as { c: number }).c).toBe(0);
      expect((db.prepare('SELECT COUNT(*) as c FROM accomplishments WHERE log_id = ?').get(logId) as { c: number }).c).toBe(0);
    });
  });
});
