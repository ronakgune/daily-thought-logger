/**
 * DatabaseService - CRUD operations for Daily Thought Logger
 * AI-10: Create DatabaseService with CRUD for all tables
 *
 * Uses better-sqlite3 for synchronous SQLite operations in Electron main process.
 * All methods are synchronous as better-sqlite3 is synchronous by design.
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

import { CREATE_TABLES_SQL, SCHEMA_VERSION, MIGRATIONS } from '../database/schema';
import {
  Log,
  Todo,
  Idea,
  Learning,
  Accomplishment,
  Summary,
  CreateLogInput,
  UpdateLogInput,
  CreateTodoInput,
  UpdateTodoInput,
  CreateIdeaInput,
  UpdateIdeaInput,
  CreateLearningInput,
  CreateAccomplishmentInput,
  CreateSummaryInput,
  LogSegments,
  LogWithSegments,
  PaginationOptions,
  TodoQueryOptions,
  IdeaQueryOptions,
  DatabaseError,
  NotFoundError,
  ValidationError,
  IdeaStatus,
} from '../types/database';

/**
 * Row types as returned from SQLite (snake_case)
 */
interface LogRow {
  id: number;
  date: string;
  audio_path: string | null;
  transcript: string | null;
  summary: string | null;
  pending_analysis: number;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface TodoRow {
  id: number;
  log_id: number;
  text: string;
  completed: number;
  due_date: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface IdeaRow {
  id: number;
  log_id: number;
  text: string;
  status: IdeaStatus;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

interface LearningRow {
  id: number;
  log_id: number;
  text: string;
  category: string | null;
  created_at: string;
}

interface AccomplishmentRow {
  id: number;
  log_id: number;
  text: string;
  impact: string;
  created_at: string;
}

interface SummaryRow {
  id: number;
  week_start: string;
  week_end: string;
  content: string;
  highlights: string | null;
  generated_at: string;
}

/**
 * DatabaseService provides CRUD operations for all Daily Thought Logger entities.
 *
 * Usage:
 * ```typescript
 * const db = new DatabaseService();
 * const log = db.createLog({ date: '2024-01-15' });
 * const todos = db.getTodosByLogId(log.id);
 * ```
 */
export class DatabaseService {
  private db: DatabaseType;

  /**
   * Creates a new DatabaseService instance.
   * @param dbPath - Optional custom path for the database file.
   *                 Defaults to user data directory in production.
   */
  constructor(dbPath?: string) {
    const defaultPath = this.getDefaultDatabasePath();
    const resolvedPath = dbPath ?? defaultPath;

    try {
      this.db = new Database(resolvedPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.initializeSchema();
    } catch (error) {
      throw new DatabaseError(
        `Failed to initialize database at ${resolvedPath}`,
        'INIT_ERROR',
        error as Error
      );
    }
  }

  /**
   * Gets the default database path based on Electron's user data directory.
   */
  private getDefaultDatabasePath(): string {
    // In test/development without Electron, use a temp path
    if (typeof app === 'undefined' || !app.getPath) {
      return ':memory:';
    }
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'daily-thought-logger.db');
  }

  /**
   * Initializes the database schema if not already present.
   */
  private initializeSchema(): void {
    const versionRow = this.db
      .prepare('SELECT name FROM sqlite_master WHERE type="table" AND name="schema_version"')
      .get() as { name: string } | undefined;

    if (!versionRow) {
      this.db.exec(CREATE_TABLES_SQL);
      this.db
        .prepare('INSERT INTO schema_version (version) VALUES (?)')
        .run(SCHEMA_VERSION);
    } else {
      // Apply any pending migrations
      this.applyMigrations();
    }
  }

  /**
   * Applies any pending database migrations.
   */
  private applyMigrations(): void {
    const currentVersionRow = this.db
      .prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
      .get() as { version: number } | undefined;

    const currentVersion = currentVersionRow?.version ?? 0;

    // Apply migrations in order
    for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
      const migration = MIGRATIONS[version];
      if (migration) {
        console.log(`Applying migration to version ${version}...`);
        this.db.exec(migration);
        this.db
          .prepare('INSERT INTO schema_version (version) VALUES (?)')
          .run(version);
        console.log(`Migration to version ${version} completed.`);
      }
    }
  }

  /**
   * Closes the database connection.
   */
  close(): void {
    this.db.close();
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  /**
   * Validates ISO 8601 date format (YYYY-MM-DD).
   */
  private validateDateFormat(date: string, fieldName: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new ValidationError(
        `${fieldName} must be in ISO 8601 format (YYYY-MM-DD), got: ${date}`
      );
    }
  }

  /**
   * Validates text length limits.
   */
  private validateTextLength(
    text: string,
    fieldName: string,
    maxLength: number
  ): void {
    if (text.length > maxLength) {
      throw new ValidationError(
        `${fieldName} exceeds maximum length of ${maxLength} characters (got ${text.length})`
      );
    }
  }

  /**
   * Validates that a log exists before creating child records.
   */
  private validateLogExists(logId: number): void {
    const log = this.getLogById(logId);
    if (!log) {
      throw new ValidationError(`Log with id ${logId} does not exist`);
    }
  }

  /**
   * Safely parses JSON with fallback to empty array.
   */
  private safeJsonParse(jsonString: string | null): string[] {
    if (!jsonString) {
      return [];
    }
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse JSON, returning empty array:', error);
      return [];
    }
  }

  /**
   * Whitelist of allowed columns for dynamic updates.
   */
  private readonly ALLOWED_TODO_UPDATE_COLUMNS = new Set([
    'text',
    'completed',
    'due_date',
    'priority',
  ]);

  private readonly ALLOWED_IDEA_UPDATE_COLUMNS = new Set([
    'text',
    'status',
    'tags',
  ]);

  private readonly ALLOWED_LOG_UPDATE_COLUMNS = new Set([
    'audio_path',
    'transcript',
    'summary',
    'pending_analysis',
    'retry_count',
    'last_error',
  ]);

  // ============================================================================
  // Row Transformers (snake_case to camelCase)
  // ============================================================================

  private transformLogRow(row: LogRow): Log {
    return {
      id: row.id,
      date: row.date,
      audioPath: row.audio_path,
      transcript: row.transcript,
      summary: row.summary,
      pendingAnalysis: Boolean(row.pending_analysis),
      retryCount: row.retry_count,
      lastError: row.last_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private transformTodoRow(row: TodoRow): Todo {
    return {
      id: row.id,
      logId: row.log_id,
      text: row.text,
      completed: Boolean(row.completed),
      dueDate: row.due_date,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private transformIdeaRow(row: IdeaRow): Idea {
    // Safely parse tags JSON with fallback
    const tags = this.safeJsonParse(row.tags);
    return {
      id: row.id,
      logId: row.log_id,
      text: row.text,
      status: row.status,
      tags: tags.length > 0 ? JSON.stringify(tags) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private transformLearningRow(row: LearningRow): Learning {
    return {
      id: row.id,
      logId: row.log_id,
      text: row.text,
      category: row.category,
      createdAt: row.created_at,
    };
  }

  private transformAccomplishmentRow(row: AccomplishmentRow): Accomplishment {
    return {
      id: row.id,
      logId: row.log_id,
      text: row.text,
      impact: row.impact as Accomplishment['impact'],
      createdAt: row.created_at,
    };
  }

  private transformSummaryRow(row: SummaryRow): Summary {
    // Safely parse highlights JSON with fallback
    const highlights = this.safeJsonParse(row.highlights);
    return {
      id: row.id,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      content: row.content,
      highlights: highlights.length > 0 ? JSON.stringify(highlights) : null,
      generatedAt: row.generated_at,
    };
  }

  // ============================================================================
  // Log CRUD Operations
  // ============================================================================

  /**
   * Creates a new log entry.
   * @param data - The log data to create
   * @returns The created log
   */
  createLog(data: CreateLogInput): Log {
    if (!data.date) {
      throw new ValidationError('Log date is required');
    }

    // Validate date format
    this.validateDateFormat(data.date, 'Log date');

    // Validate length limits
    if (data.transcript) {
      this.validateTextLength(data.transcript, 'Transcript', 10000);
    }
    if (data.summary) {
      this.validateTextLength(data.summary, 'Summary', 10000);
    }

    const stmt = this.db.prepare(`
      INSERT INTO logs (date, audio_path, transcript, summary)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.date,
      data.audioPath ?? null,
      data.transcript ?? null,
      data.summary ?? null
    );

    return this.getLogById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets a log by its ID.
   * @param id - The log ID
   * @returns The log or null if not found
   */
  getLogById(id: number): Log | null {
    const row = this.db
      .prepare('SELECT * FROM logs WHERE id = ?')
      .get(id) as LogRow | undefined;

    return row ? this.transformLogRow(row) : null;
  }

  /**
   * Gets all logs with optional pagination.
   * @param options - Pagination options
   * @returns Array of logs
   */
  getAllLogs(options?: PaginationOptions): Log[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    const rows = this.db
      .prepare('SELECT * FROM logs ORDER BY date DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as LogRow[];

    return rows.map((row) => this.transformLogRow(row));
  }

  /**
   * Gets logs within a date range.
   * @param start - Start date (inclusive)
   * @param end - End date (inclusive)
   * @returns Array of logs
   */
  getLogsByDateRange(start: Date, end: Date): Log[] {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const rows = this.db
      .prepare('SELECT * FROM logs WHERE date >= ? AND date <= ? ORDER BY date ASC')
      .all(startStr, endStr) as LogRow[];

    return rows.map((row) => this.transformLogRow(row));
  }

  /**
   * Updates a log entry.
   * @param id - The log ID to update
   * @param data - The update data
   * @returns The updated log
   */
  updateLog(id: number, data: UpdateLogInput): Log {
    const existing = this.getLogById(id);
    if (!existing) {
      throw new NotFoundError('Log', id);
    }

    const updates: string[] = [];
    const params: (string | null)[] = [];

    // Map camelCase to snake_case for database columns
    const columnMap: Record<string, string> = {
      audioPath: 'audio_path',
      transcript: 'transcript',
      summary: 'summary',
    };

    // Validate all provided fields against whitelist
    for (const key of Object.keys(data)) {
      const dbColumn = columnMap[key] || key;
      if (!this.ALLOWED_LOG_UPDATE_COLUMNS.has(dbColumn)) {
        throw new ValidationError(`Invalid update field for log: ${key}`);
      }
    }

    if (data.audioPath !== undefined) {
      updates.push('audio_path = ?');
      params.push(data.audioPath);
    }
    if (data.transcript !== undefined) {
      if (data.transcript) {
        this.validateTextLength(data.transcript, 'Transcript', 10000);
      }
      updates.push('transcript = ?');
      params.push(data.transcript);
    }
    if (data.summary !== undefined) {
      if (data.summary) {
        this.validateTextLength(data.summary, 'Summary', 10000);
      }
      updates.push('summary = ?');
      params.push(data.summary);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(id);

      this.db
        .prepare(`UPDATE logs SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);
    }

    return this.getLogById(id)!;
  }

  /**
   * Deletes a log and all associated segments (cascades).
   * @param id - The log ID to delete
   */
  deleteLog(id: number): void {
    const result = this.db.prepare('DELETE FROM logs WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Log', id);
    }
  }

  // ============================================================================
  // Todo CRUD Operations
  // ============================================================================

  /**
   * Creates a new todo item.
   * @param data - The todo data to create
   * @returns The created todo
   */
  createTodo(data: CreateTodoInput): Todo {
    if (!data.text) {
      throw new ValidationError('Todo text is required');
    }

    // Validate foreign key
    this.validateLogExists(data.logId);

    // Validate text length
    this.validateTextLength(data.text, 'Todo text', 500);

    // Validate due date format if provided
    if (data.dueDate) {
      this.validateDateFormat(data.dueDate, 'Todo due date');
    }

    const stmt = this.db.prepare(`
      INSERT INTO todos (log_id, text, completed, due_date, priority)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.logId,
      data.text,
      data.completed ? 1 : 0,
      data.dueDate ?? null,
      data.priority ?? 2
    );

    return this.getTodoById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets a todo by its ID.
   * @param id - The todo ID
   * @returns The todo or null if not found
   */
  getTodoById(id: number): Todo | null {
    const row = this.db
      .prepare('SELECT * FROM todos WHERE id = ?')
      .get(id) as TodoRow | undefined;

    return row ? this.transformTodoRow(row) : null;
  }

  /**
   * Gets all todos for a specific log.
   * @param logId - The log ID
   * @returns Array of todos
   */
  getTodosByLogId(logId: number): Todo[] {
    const rows = this.db
      .prepare('SELECT * FROM todos WHERE log_id = ? ORDER BY priority ASC, created_at ASC')
      .all(logId) as TodoRow[];

    return rows.map((row) => this.transformTodoRow(row));
  }

  /**
   * Gets all todos with optional filtering.
   * @param options - Query options
   * @returns Array of todos
   */
  getAllTodos(options?: TodoQueryOptions): Todo[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    let query = 'SELECT * FROM todos';
    const params: (number | string)[] = [];

    if (options?.completed !== undefined) {
      query += ' WHERE completed = ?';
      params.push(options.completed ? 1 : 0);
    }

    query += ' ORDER BY priority ASC, due_date ASC NULLS LAST, created_at ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = this.db.prepare(query).all(...params) as TodoRow[];

    return rows.map((row) => this.transformTodoRow(row));
  }

  /**
   * Updates a todo item.
   * @param id - The todo ID to update
   * @param data - The update data
   * @returns The updated todo
   */
  updateTodo(id: number, data: UpdateTodoInput): Todo {
    const existing = this.getTodoById(id);
    if (!existing) {
      throw new NotFoundError('Todo', id);
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    // Map camelCase to snake_case for database columns
    const columnMap: Record<string, string> = {
      text: 'text',
      completed: 'completed',
      dueDate: 'due_date',
      priority: 'priority',
    };

    // Validate all provided fields against whitelist
    for (const key of Object.keys(data)) {
      const dbColumn = columnMap[key] || key;
      if (!this.ALLOWED_TODO_UPDATE_COLUMNS.has(dbColumn)) {
        throw new ValidationError(`Invalid update field for todo: ${key}`);
      }
    }

    if (data.text !== undefined) {
      this.validateTextLength(data.text, 'Todo text', 500);
      updates.push('text = ?');
      params.push(data.text);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      params.push(data.completed ? 1 : 0);
    }
    if (data.dueDate !== undefined) {
      if (data.dueDate) {
        this.validateDateFormat(data.dueDate, 'Todo due date');
      }
      updates.push('due_date = ?');
      params.push(data.dueDate);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(id);

      this.db
        .prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);
    }

    return this.getTodoById(id)!;
  }

  /**
   * Deletes a todo item.
   * @param id - The todo ID to delete
   */
  deleteTodo(id: number): void {
    const result = this.db.prepare('DELETE FROM todos WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Todo', id);
    }
  }

  // ============================================================================
  // Idea CRUD Operations
  // ============================================================================

  /**
   * Creates a new idea.
   * @param data - The idea data to create
   * @returns The created idea
   */
  createIdea(data: CreateIdeaInput): Idea {
    if (!data.text) {
      throw new ValidationError('Idea text is required');
    }

    // Validate foreign key
    this.validateLogExists(data.logId);

    // Validate text length
    this.validateTextLength(data.text, 'Idea text', 1000);

    const tagsJson = data.tags ? JSON.stringify(data.tags) : null;

    const stmt = this.db.prepare(`
      INSERT INTO ideas (log_id, text, status, tags)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.logId,
      data.text,
      data.status ?? 'raw',
      tagsJson
    );

    return this.getIdeaById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets an idea by its ID.
   * @param id - The idea ID
   * @returns The idea or null if not found
   */
  getIdeaById(id: number): Idea | null {
    const row = this.db
      .prepare('SELECT * FROM ideas WHERE id = ?')
      .get(id) as IdeaRow | undefined;

    return row ? this.transformIdeaRow(row) : null;
  }

  /**
   * Gets all ideas for a specific log.
   * @param logId - The log ID
   * @returns Array of ideas
   */
  getIdeasByLogId(logId: number): Idea[] {
    const rows = this.db
      .prepare('SELECT * FROM ideas WHERE log_id = ? ORDER BY created_at ASC')
      .all(logId) as IdeaRow[];

    return rows.map((row) => this.transformIdeaRow(row));
  }

  /**
   * Gets all ideas with optional filtering.
   * @param options - Query options
   * @returns Array of ideas
   */
  getAllIdeas(options?: IdeaQueryOptions): Idea[] {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    let query = 'SELECT * FROM ideas';
    const params: (string | number)[] = [];

    if (options?.status) {
      query += ' WHERE status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = this.db.prepare(query).all(...params) as IdeaRow[];

    return rows.map((row) => this.transformIdeaRow(row));
  }

  /**
   * Updates an idea.
   * @param id - The idea ID to update
   * @param data - The update data
   * @returns The updated idea
   */
  updateIdea(id: number, data: UpdateIdeaInput): Idea {
    const existing = this.getIdeaById(id);
    if (!existing) {
      throw new NotFoundError('Idea', id);
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    // Map camelCase to snake_case for database columns
    const columnMap: Record<string, string> = {
      text: 'text',
      status: 'status',
      tags: 'tags',
    };

    // Validate all provided fields against whitelist
    for (const key of Object.keys(data)) {
      const dbColumn = columnMap[key] || key;
      if (!this.ALLOWED_IDEA_UPDATE_COLUMNS.has(dbColumn)) {
        throw new ValidationError(`Invalid update field for idea: ${key}`);
      }
    }

    if (data.text !== undefined) {
      this.validateTextLength(data.text, 'Idea text', 1000);
      updates.push('text = ?');
      params.push(data.text);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(id);

      this.db
        .prepare(`UPDATE ideas SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);
    }

    return this.getIdeaById(id)!;
  }

  /**
   * Deletes an idea.
   * @param id - The idea ID to delete
   */
  deleteIdea(id: number): void {
    const result = this.db.prepare('DELETE FROM ideas WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Idea', id);
    }
  }

  // ============================================================================
  // Learning CRUD Operations
  // ============================================================================

  /**
   * Creates a new learning entry.
   * @param data - The learning data to create
   * @returns The created learning
   */
  createLearning(data: CreateLearningInput): Learning {
    if (!data.text) {
      throw new ValidationError('Learning text is required');
    }

    // Validate foreign key
    this.validateLogExists(data.logId);

    // Validate text length
    this.validateTextLength(data.text, 'Learning text', 1000);

    const stmt = this.db.prepare(`
      INSERT INTO learnings (log_id, text, category)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(data.logId, data.text, data.category ?? null);

    return this.getLearningById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets a learning by its ID.
   * @param id - The learning ID
   * @returns The learning or null if not found
   */
  getLearningById(id: number): Learning | null {
    const row = this.db
      .prepare('SELECT * FROM learnings WHERE id = ?')
      .get(id) as LearningRow | undefined;

    return row ? this.transformLearningRow(row) : null;
  }

  /**
   * Gets all learnings for a specific log.
   * @param logId - The log ID
   * @returns Array of learnings
   */
  getLearningsByLogId(logId: number): Learning[] {
    const rows = this.db
      .prepare('SELECT * FROM learnings WHERE log_id = ? ORDER BY created_at ASC')
      .all(logId) as LearningRow[];

    return rows.map((row) => this.transformLearningRow(row));
  }

  /**
   * Gets all learnings.
   * @returns Array of all learnings
   */
  getAllLearnings(): Learning[] {
    const rows = this.db
      .prepare('SELECT * FROM learnings ORDER BY created_at DESC')
      .all() as LearningRow[];

    return rows.map((row) => this.transformLearningRow(row));
  }

  /**
   * Deletes a learning entry.
   * @param id - The learning ID to delete
   */
  deleteLearning(id: number): void {
    const result = this.db.prepare('DELETE FROM learnings WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Learning', id);
    }
  }

  // ============================================================================
  // Accomplishment CRUD Operations
  // ============================================================================

  /**
   * Creates a new accomplishment.
   * @param data - The accomplishment data to create
   * @returns The created accomplishment
   */
  createAccomplishment(data: CreateAccomplishmentInput): Accomplishment {
    if (!data.text) {
      throw new ValidationError('Accomplishment text is required');
    }

    // Validate foreign key
    this.validateLogExists(data.logId);

    // Validate text length
    this.validateTextLength(data.text, 'Accomplishment text', 1000);

    const stmt = this.db.prepare(`
      INSERT INTO accomplishments (log_id, text, impact)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(data.logId, data.text, data.impact ?? 'medium');

    return this.getAccomplishmentById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets an accomplishment by its ID.
   * @param id - The accomplishment ID
   * @returns The accomplishment or null if not found
   */
  getAccomplishmentById(id: number): Accomplishment | null {
    const row = this.db
      .prepare('SELECT * FROM accomplishments WHERE id = ?')
      .get(id) as AccomplishmentRow | undefined;

    return row ? this.transformAccomplishmentRow(row) : null;
  }

  /**
   * Gets all accomplishments for a specific log.
   * @param logId - The log ID
   * @returns Array of accomplishments
   */
  getAccomplishmentsByLogId(logId: number): Accomplishment[] {
    const rows = this.db
      .prepare('SELECT * FROM accomplishments WHERE log_id = ? ORDER BY created_at ASC')
      .all(logId) as AccomplishmentRow[];

    return rows.map((row) => this.transformAccomplishmentRow(row));
  }

  /**
   * Gets all accomplishments.
   * @returns Array of all accomplishments
   */
  getAllAccomplishments(): Accomplishment[] {
    const rows = this.db
      .prepare('SELECT * FROM accomplishments ORDER BY created_at DESC')
      .all() as AccomplishmentRow[];

    return rows.map((row) => this.transformAccomplishmentRow(row));
  }

  /**
   * Deletes an accomplishment.
   * @param id - The accomplishment ID to delete
   */
  deleteAccomplishment(id: number): void {
    const result = this.db.prepare('DELETE FROM accomplishments WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Accomplishment', id);
    }
  }

  // ============================================================================
  // Summary CRUD Operations
  // ============================================================================

  /**
   * Creates a new weekly summary.
   * @param data - The summary data to create
   * @returns The created summary
   */
  createSummary(data: CreateSummaryInput): Summary {
    if (!data.content) {
      throw new ValidationError('Summary content is required');
    }

    // Validate date formats
    this.validateDateFormat(data.weekStart, 'Week start date');
    this.validateDateFormat(data.weekEnd, 'Week end date');

    // Validate content length
    this.validateTextLength(data.content, 'Summary content', 10000);

    const highlightsJson = data.highlights ? JSON.stringify(data.highlights) : null;

    const stmt = this.db.prepare(`
      INSERT INTO summaries (week_start, week_end, content, highlights)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.weekStart,
      data.weekEnd,
      data.content,
      highlightsJson
    );

    return this.getSummaryById(result.lastInsertRowid as number)!;
  }

  /**
   * Gets a summary by its ID.
   * @param id - The summary ID
   * @returns The summary or null if not found
   */
  private getSummaryById(id: number): Summary | null {
    const row = this.db
      .prepare('SELECT * FROM summaries WHERE id = ?')
      .get(id) as SummaryRow | undefined;

    return row ? this.transformSummaryRow(row) : null;
  }

  /**
   * Gets a summary by week start date.
   * @param weekStart - The week start date
   * @returns The summary or null if not found
   */
  getSummaryByWeek(weekStart: Date): Summary | null {
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const row = this.db
      .prepare('SELECT * FROM summaries WHERE week_start = ?')
      .get(weekStartStr) as SummaryRow | undefined;

    return row ? this.transformSummaryRow(row) : null;
  }

  /**
   * Gets all summaries.
   * @returns Array of all summaries
   */
  getAllSummaries(): Summary[] {
    const rows = this.db
      .prepare('SELECT * FROM summaries ORDER BY week_start DESC')
      .all() as SummaryRow[];

    return rows.map((row) => this.transformSummaryRow(row));
  }

  /**
   * Deletes a summary.
   * @param id - The summary ID to delete
   */
  deleteSummary(id: number): void {
    const result = this.db.prepare('DELETE FROM summaries WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new NotFoundError('Summary', id);
    }
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  /**
   * Saves a log with all its segments in a single transaction.
   * This ensures atomicity - either all segments are saved or none are.
   *
   * @param logData - The log data to create
   * @param segments - Optional segments to create with the log
   * @returns The created log with all segments
   */
  saveLogWithSegments(logData: CreateLogInput, segments?: LogSegments): LogWithSegments {
    const saveTransaction = this.db.transaction(() => {
      // Create the log
      const log = this.createLog(logData);

      // Create todos if provided
      const todos: Todo[] = [];
      if (segments?.todos) {
        for (const todoData of segments.todos) {
          const todo = this.createTodo({ ...todoData, logId: log.id });
          todos.push(todo);
        }
      }

      // Create ideas if provided
      const ideas: Idea[] = [];
      if (segments?.ideas) {
        for (const ideaData of segments.ideas) {
          const idea = this.createIdea({ ...ideaData, logId: log.id });
          ideas.push(idea);
        }
      }

      // Create learnings if provided
      const learnings: Learning[] = [];
      if (segments?.learnings) {
        for (const learningData of segments.learnings) {
          const learning = this.createLearning({ ...learningData, logId: log.id });
          learnings.push(learning);
        }
      }

      // Create accomplishments if provided
      const accomplishments: Accomplishment[] = [];
      if (segments?.accomplishments) {
        for (const accomplishmentData of segments.accomplishments) {
          const accomplishment = this.createAccomplishment({
            ...accomplishmentData,
            logId: log.id,
          });
          accomplishments.push(accomplishment);
        }
      }

      return {
        ...log,
        todos,
        ideas,
        learnings,
        accomplishments,
      };
    });

    return saveTransaction();
  }

  /**
   * Gets a log with all its segments.
   * @param logId - The log ID
   * @returns The log with all segments or null if not found
   */
  getLogWithSegments(logId: number): LogWithSegments | null {
    const log = this.getLogById(logId);
    if (!log) {
      return null;
    }

    return {
      ...log,
      todos: this.getTodosByLogId(logId),
      ideas: this.getIdeasByLogId(logId),
      learnings: this.getLearningsByLogId(logId),
      accomplishments: this.getAccomplishmentsByLogId(logId),
    };
  }

  /**
   * Runs a function within a database transaction.
   * @param fn - The function to run in the transaction
   * @returns The result of the function
   */
  runTransaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // ============================================================================
  // Pending Analysis Operations (AI-18)
  // ============================================================================

  /**
   * Gets all logs that are pending analysis.
   * @returns Array of logs with pending_analysis = true
   */
  getPendingLogs(): Log[] {
    const rows = this.db
      .prepare('SELECT * FROM logs WHERE pending_analysis = 1 ORDER BY created_at ASC')
      .all() as LogRow[];

    return rows.map((row) => this.transformLogRow(row));
  }

  /**
   * Marks a log as pending analysis.
   * @param logId - The log ID
   * @param errorMessage - Optional error message to store
   * @returns The updated log
   */
  markLogAsPending(logId: number, errorMessage?: string): Log {
    const existing = this.getLogById(logId);
    if (!existing) {
      throw new NotFoundError('Log', logId);
    }

    this.db
      .prepare(
        `UPDATE logs
         SET pending_analysis = 1,
             retry_count = retry_count + 1,
             last_error = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(errorMessage ?? null, logId);

    return this.getLogById(logId)!;
  }

  /**
   * Marks a log as successfully analyzed (no longer pending).
   * @param logId - The log ID
   * @returns The updated log
   */
  markLogAsAnalyzed(logId: number): Log {
    const existing = this.getLogById(logId);
    if (!existing) {
      throw new NotFoundError('Log', logId);
    }

    this.db
      .prepare(
        `UPDATE logs
         SET pending_analysis = 0,
             last_error = NULL,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(logId);

    return this.getLogById(logId)!;
  }

  /**
   * Resets the retry count for a pending log.
   * @param logId - The log ID
   * @returns The updated log
   */
  resetRetryCount(logId: number): Log {
    const existing = this.getLogById(logId);
    if (!existing) {
      throw new NotFoundError('Log', logId);
    }

    this.db
      .prepare(
        `UPDATE logs
         SET retry_count = 0,
             updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(logId);

    return this.getLogById(logId)!;
  }
}

// Export singleton instance for convenience
let instance: DatabaseService | null = null;
let instancePath: string | undefined = undefined;

/**
 * Gets the shared DatabaseService instance.
 * Creates one if it doesn't exist.
 *
 * @param dbPath - Optional database path. If provided when an instance already exists
 *                 with a different path, a warning will be logged.
 */
export function getDatabaseService(dbPath?: string): DatabaseService {
  if (!instance) {
    instance = new DatabaseService(dbPath);
    instancePath = dbPath;
  } else if (dbPath !== undefined && dbPath !== instancePath) {
    console.warn(
      `getDatabaseService called with different dbPath. ` +
      `Existing instance uses "${instancePath}", ` +
      `ignoring requested path "${dbPath}". ` +
      `Call closeDatabaseService() first to create a new instance.`
    );
  }
  return instance;
}

/**
 * Closes and clears the shared DatabaseService instance.
 */
export function closeDatabaseService(): void {
  if (instance) {
    instance.close();
    instance = null;
    instancePath = undefined;
  }
}
