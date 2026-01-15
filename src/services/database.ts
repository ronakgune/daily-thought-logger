/**
 * Database service for Daily Thought Logger
 * Provides CRUD operations for all tables
 */

import { getDatabase } from './database-init';
import type {
  Log,
  Accomplishment,
  Todo,
  Idea,
  Learning,
  Summary,
  CreateLog,
  CreateAccomplishment,
  CreateTodo,
  CreateIdea,
  CreateLearning,
  CreateSummary,
  UpdateTodo,
  UpdateIdea,
} from '../types/database';

// ============================================
// Helper functions
// ============================================

/**
 * Convert SQLite boolean (0/1) to JavaScript boolean
 */
function convertBoolean(value: number | boolean): boolean {
  return value === 1 || value === true;
}

/**
 * Convert database row with boolean fields for Todo
 */
function convertTodoRow(row: any): Todo {
  return {
    ...row,
    completed: convertBoolean(row.completed),
    user_reclassified: convertBoolean(row.user_reclassified),
  };
}

/**
 * Convert database row with boolean fields for Idea
 */
function convertIdeaRow(row: any): Idea {
  return {
    ...row,
    user_reclassified: convertBoolean(row.user_reclassified),
  };
}

class DatabaseError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ============================================
// Logs
// ============================================

export function createLog(data: CreateLog): Log {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO logs (transcript, raw_analysis, audio_path, duration_seconds)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.transcript,
      data.raw_analysis,
      data.audio_path,
      data.duration_seconds
    );
    const log = getLogById(result.lastInsertRowid as number);
    if (!log) {
      throw new DatabaseError('Failed to retrieve created log', 'createLog');
    }
    return log;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create log: ${error instanceof Error ? error.message : String(error)}`,
      'createLog'
    );
  }
}

export function getLogById(id: number): Log | undefined {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM logs WHERE id = ?').get(id) as Log | undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get log by id: ${error instanceof Error ? error.message : String(error)}`,
      'getLogById'
    );
  }
}

export function getAllLogs(limit = 100, offset = 0): Log[] {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as Log[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all logs: ${error instanceof Error ? error.message : String(error)}`,
      'getAllLogs'
    );
  }
}

export function getLogsByDateRange(startDate: string, endDate: string): Log[] {
  try {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM logs
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `).all(startDate, endDate) as Log[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get logs by date range: ${error instanceof Error ? error.message : String(error)}`,
      'getLogsByDateRange'
    );
  }
}

export function deleteLog(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM logs WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete log: ${error instanceof Error ? error.message : String(error)}`,
      'deleteLog'
    );
  }
}

// ============================================
// Accomplishments
// ============================================

export function createAccomplishment(data: CreateAccomplishment): Accomplishment {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO accomplishments (log_id, text, confidence)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(data.log_id, data.text, data.confidence);
    const accomplishment = getAccomplishmentById(result.lastInsertRowid as number);
    if (!accomplishment) {
      throw new DatabaseError('Failed to retrieve created accomplishment', 'createAccomplishment');
    }
    return accomplishment;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create accomplishment: ${error instanceof Error ? error.message : String(error)}`,
      'createAccomplishment'
    );
  }
}

export function getAccomplishmentById(id: number): Accomplishment | undefined {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM accomplishments WHERE id = ?').get(id) as Accomplishment | undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get accomplishment by id: ${error instanceof Error ? error.message : String(error)}`,
      'getAccomplishmentById'
    );
  }
}

export function getAccomplishmentsByLogId(logId: number): Accomplishment[] {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM accomplishments WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Accomplishment[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get accomplishments by log id: ${error instanceof Error ? error.message : String(error)}`,
      'getAccomplishmentsByLogId'
    );
  }
}

export function getAllAccomplishments(limit = 100, offset = 0): Accomplishment[] {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM accomplishments ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Accomplishment[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all accomplishments: ${error instanceof Error ? error.message : String(error)}`,
      'getAllAccomplishments'
    );
  }
}

export function deleteAccomplishment(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM accomplishments WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete accomplishment: ${error instanceof Error ? error.message : String(error)}`,
      'deleteAccomplishment'
    );
  }
}

// ============================================
// Todos
// ============================================

export function createTodo(data: CreateTodo): Todo {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO todos (log_id, text, priority, confidence)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.log_id,
      data.text,
      data.priority || 'medium',
      data.confidence
    );
    const todo = getTodoById(result.lastInsertRowid as number);
    if (!todo) {
      throw new DatabaseError('Failed to retrieve created todo', 'createTodo');
    }
    return todo;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create todo: ${error instanceof Error ? error.message : String(error)}`,
      'createTodo'
    );
  }
}

export function getTodoById(id: number): Todo | undefined {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    return row ? convertTodoRow(row) : undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get todo by id: ${error instanceof Error ? error.message : String(error)}`,
      'getTodoById'
    );
  }
}

export function getTodosByLogId(logId: number): Todo[] {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM todos WHERE log_id = ? ORDER BY created_at DESC').all(logId);
    return rows.map(convertTodoRow);
  } catch (error) {
    throw new DatabaseError(
      `Failed to get todos by log id: ${error instanceof Error ? error.message : String(error)}`,
      'getTodosByLogId'
    );
  }
}

export function getAllTodos(includeCompleted = false, limit = 100, offset = 0): Todo[] {
  try {
    const db = getDatabase();
    let rows: any[];
    if (includeCompleted) {
      rows = db.prepare('SELECT * FROM todos ORDER BY completed ASC, created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    } else {
      rows = db.prepare('SELECT * FROM todos WHERE completed = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    }
    return rows.map(convertTodoRow);
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all todos: ${error instanceof Error ? error.message : String(error)}`,
      'getAllTodos'
    );
  }
}

export function updateTodo(id: number, data: UpdateTodo): Todo | undefined {
  try {
    const db = getDatabase();

    // Whitelist of allowed columns to prevent SQL injection
    const allowedColumns = new Set(['text', 'completed', 'priority', 'user_reclassified']);
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.text !== undefined) {
      updates.push('text = ?');
      values.push(data.text);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.priority !== undefined) {
      // Validate priority value
      if (!['low', 'medium', 'high'].includes(data.priority)) {
        throw new DatabaseError('Invalid priority value', 'updateTodo');
      }
      updates.push('priority = ?');
      values.push(data.priority);
    }
    if (data.user_reclassified !== undefined) {
      updates.push('user_reclassified = ?');
      values.push(data.user_reclassified ? 1 : 0);
    }

    if (updates.length === 0) {
      return getTodoById(id);
    }

    values.push(id);
    db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return getTodoById(id);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to update todo: ${error instanceof Error ? error.message : String(error)}`,
      'updateTodo'
    );
  }
}

export function deleteTodo(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete todo: ${error instanceof Error ? error.message : String(error)}`,
      'deleteTodo'
    );
  }
}

export function completeTodo(id: number): Todo | undefined {
  return updateTodo(id, { completed: true });
}

// ============================================
// Ideas
// ============================================

export function createIdea(data: CreateIdea): Idea {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ideas (log_id, text, category, confidence)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.log_id,
      data.text,
      data.category,
      data.confidence
    );
    const idea = getIdeaById(result.lastInsertRowid as number);
    if (!idea) {
      throw new DatabaseError('Failed to retrieve created idea', 'createIdea');
    }
    return idea;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create idea: ${error instanceof Error ? error.message : String(error)}`,
      'createIdea'
    );
  }
}

export function getIdeaById(id: number): Idea | undefined {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return row ? convertIdeaRow(row) : undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get idea by id: ${error instanceof Error ? error.message : String(error)}`,
      'getIdeaById'
    );
  }
}

export function getIdeasByLogId(logId: number): Idea[] {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ideas WHERE log_id = ? ORDER BY created_at DESC').all(logId);
    return rows.map(convertIdeaRow);
  } catch (error) {
    throw new DatabaseError(
      `Failed to get ideas by log id: ${error instanceof Error ? error.message : String(error)}`,
      'getIdeasByLogId'
    );
  }
}

export function getAllIdeas(status?: string, limit = 100, offset = 0): Idea[] {
  try {
    const db = getDatabase();
    let rows: any[];
    if (status) {
      rows = db.prepare('SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(status, limit, offset);
    } else {
      rows = db.prepare('SELECT * FROM ideas ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    }
    return rows.map(convertIdeaRow);
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all ideas: ${error instanceof Error ? error.message : String(error)}`,
      'getAllIdeas'
    );
  }
}

export function updateIdea(id: number, data: UpdateIdea): Idea | undefined {
  try {
    const db = getDatabase();

    // Whitelist of allowed columns to prevent SQL injection
    const allowedColumns = new Set(['text', 'status', 'category', 'user_reclassified']);
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.text !== undefined) {
      updates.push('text = ?');
      values.push(data.text);
    }
    if (data.status !== undefined) {
      // Validate status value
      if (!['new', 'reviewing', 'implemented', 'archived'].includes(data.status)) {
        throw new DatabaseError('Invalid status value', 'updateIdea');
      }
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }
    if (data.user_reclassified !== undefined) {
      updates.push('user_reclassified = ?');
      values.push(data.user_reclassified ? 1 : 0);
    }

    if (updates.length === 0) {
      return getIdeaById(id);
    }

    values.push(id);
    db.prepare(`UPDATE ideas SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return getIdeaById(id);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to update idea: ${error instanceof Error ? error.message : String(error)}`,
      'updateIdea'
    );
  }
}

export function deleteIdea(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete idea: ${error instanceof Error ? error.message : String(error)}`,
      'deleteIdea'
    );
  }
}

// ============================================
// Learnings
// ============================================

export function createLearning(data: CreateLearning): Learning {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO learnings (log_id, text, topic, confidence)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.log_id,
      data.text,
      data.topic,
      data.confidence
    );
    const learning = getLearningById(result.lastInsertRowid as number);
    if (!learning) {
      throw new DatabaseError('Failed to retrieve created learning', 'createLearning');
    }
    return learning;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create learning: ${error instanceof Error ? error.message : String(error)}`,
      'createLearning'
    );
  }
}

export function getLearningById(id: number): Learning | undefined {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM learnings WHERE id = ?').get(id) as Learning | undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get learning by id: ${error instanceof Error ? error.message : String(error)}`,
      'getLearningById'
    );
  }
}

export function getLearningsByLogId(logId: number): Learning[] {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM learnings WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Learning[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get learnings by log id: ${error instanceof Error ? error.message : String(error)}`,
      'getLearningsByLogId'
    );
  }
}

export function getAllLearnings(topic?: string, limit = 100, offset = 0): Learning[] {
  try {
    const db = getDatabase();
    if (topic) {
      return db.prepare('SELECT * FROM learnings WHERE topic = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(topic, limit, offset) as Learning[];
    }
    return db.prepare('SELECT * FROM learnings ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Learning[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all learnings: ${error instanceof Error ? error.message : String(error)}`,
      'getAllLearnings'
    );
  }
}

export function deleteLearning(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM learnings WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete learning: ${error instanceof Error ? error.message : String(error)}`,
      'deleteLearning'
    );
  }
}

// ============================================
// Summaries
// ============================================

export function createSummary(data: CreateSummary): Summary {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO summaries (week_start, week_end, content, highlights, stats)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.week_start,
      data.week_end,
      data.content,
      data.highlights,
      data.stats
    );
    const summary = getSummaryById(result.lastInsertRowid as number);
    if (!summary) {
      throw new DatabaseError('Failed to retrieve created summary', 'createSummary');
    }
    return summary;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Failed to create summary: ${error instanceof Error ? error.message : String(error)}`,
      'createSummary'
    );
  }
}

export function getSummaryById(id: number): Summary | undefined {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM summaries WHERE id = ?').get(id) as Summary | undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get summary by id: ${error instanceof Error ? error.message : String(error)}`,
      'getSummaryById'
    );
  }
}

export function getSummaryByWeek(weekStart: string): Summary | undefined {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM summaries WHERE week_start = ?').get(weekStart) as Summary | undefined;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get summary by week: ${error instanceof Error ? error.message : String(error)}`,
      'getSummaryByWeek'
    );
  }
}

export function getAllSummaries(limit = 52, offset = 0): Summary[] {
  try {
    const db = getDatabase();
    return db.prepare('SELECT * FROM summaries ORDER BY week_start DESC LIMIT ? OFFSET ?').all(limit, offset) as Summary[];
  } catch (error) {
    throw new DatabaseError(
      `Failed to get all summaries: ${error instanceof Error ? error.message : String(error)}`,
      'getAllSummaries'
    );
  }
}

export function deleteSummary(id: number): boolean {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM summaries WHERE id = ?').run(id);
    return result.changes > 0;
  } catch (error) {
    throw new DatabaseError(
      `Failed to delete summary: ${error instanceof Error ? error.message : String(error)}`,
      'deleteSummary'
    );
  }
}

// ============================================
// Utility functions
// ============================================

/**
 * Get all items extracted from a specific log
 */
export function getLogWithExtractedItems(logId: number): {
  log: Log;
  accomplishments: Accomplishment[];
  todos: Todo[];
  ideas: Idea[];
  learnings: Learning[];
} | undefined {
  try {
    const log = getLogById(logId);
    if (!log) {
      return undefined;
    }

    return {
      log,
      accomplishments: getAccomplishmentsByLogId(logId),
      todos: getTodosByLogId(logId),
      ideas: getIdeasByLogId(logId),
      learnings: getLearningsByLogId(logId),
    };
  } catch (error) {
    throw new DatabaseError(
      `Failed to get log with extracted items: ${error instanceof Error ? error.message : String(error)}`,
      'getLogWithExtractedItems'
    );
  }
}

/**
 * Batch insert extracted items from a log analysis
 */
export function insertExtractedItems(
  logId: number,
  items: {
    accomplishments?: Array<{ text: string; confidence?: number }>;
    todos?: Array<{ text: string; priority?: 'low' | 'medium' | 'high'; confidence?: number }>;
    ideas?: Array<{ text: string; category?: string; confidence?: number }>;
    learnings?: Array<{ text: string; topic?: string; confidence?: number }>;
  }
): void {
  try {
    const db = getDatabase();

    const insertAccomplishment = db.prepare(`
      INSERT INTO accomplishments (log_id, text, confidence) VALUES (?, ?, ?)
    `);
    const insertTodo = db.prepare(`
      INSERT INTO todos (log_id, text, priority, confidence) VALUES (?, ?, ?, ?)
    `);
    const insertIdea = db.prepare(`
      INSERT INTO ideas (log_id, text, category, confidence) VALUES (?, ?, ?, ?)
    `);
    const insertLearning = db.prepare(`
      INSERT INTO learnings (log_id, text, topic, confidence) VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const item of items.accomplishments || []) {
        insertAccomplishment.run(logId, item.text, item.confidence ?? null);
      }
      for (const item of items.todos || []) {
        insertTodo.run(logId, item.text, item.priority ?? 'medium', item.confidence ?? null);
      }
      for (const item of items.ideas || []) {
        insertIdea.run(logId, item.text, item.category ?? null, item.confidence ?? null);
      }
      for (const item of items.learnings || []) {
        insertLearning.run(logId, item.text, item.topic ?? null, item.confidence ?? null);
      }
    });

    transaction();
  } catch (error) {
    throw new DatabaseError(
      `Failed to insert extracted items: ${error instanceof Error ? error.message : String(error)}`,
      'insertExtractedItems'
    );
  }
}
