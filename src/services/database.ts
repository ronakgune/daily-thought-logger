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
// Logs
// ============================================

export function createLog(data: CreateLog): Log {
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
  return getLogById(result.lastInsertRowid as number)!;
}

export function getLogById(id: number): Log | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM logs WHERE id = ?').get(id) as Log | undefined;
}

export function getAllLogs(limit = 100, offset = 0): Log[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as Log[];
}

export function getLogsByDateRange(startDate: string, endDate: string): Log[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM logs
    WHERE timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp DESC
  `).all(startDate, endDate) as Log[];
}

export function deleteLog(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM logs WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================
// Accomplishments
// ============================================

export function createAccomplishment(data: CreateAccomplishment): Accomplishment {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO accomplishments (log_id, text, confidence)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(data.log_id, data.text, data.confidence);
  return getAccomplishmentById(result.lastInsertRowid as number)!;
}

export function getAccomplishmentById(id: number): Accomplishment | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM accomplishments WHERE id = ?').get(id) as Accomplishment | undefined;
}

export function getAccomplishmentsByLogId(logId: number): Accomplishment[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM accomplishments WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Accomplishment[];
}

export function getAllAccomplishments(limit = 100, offset = 0): Accomplishment[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM accomplishments ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Accomplishment[];
}

export function deleteAccomplishment(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM accomplishments WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================
// Todos
// ============================================

export function createTodo(data: CreateTodo): Todo {
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
  return getTodoById(result.lastInsertRowid as number)!;
}

export function getTodoById(id: number): Todo | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo | undefined;
}

export function getTodosByLogId(logId: number): Todo[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM todos WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Todo[];
}

export function getAllTodos(includeCompleted = false, limit = 100, offset = 0): Todo[] {
  const db = getDatabase();
  if (includeCompleted) {
    return db.prepare('SELECT * FROM todos ORDER BY completed ASC, created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Todo[];
  }
  return db.prepare('SELECT * FROM todos WHERE completed = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Todo[];
}

export function updateTodo(id: number, data: UpdateTodo): Todo | undefined {
  const db = getDatabase();
  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];

  if (data.text !== undefined) {
    updates.push('text = ?');
    values.push(data.text);
  }
  if (data.completed !== undefined) {
    updates.push('completed = ?');
    values.push(data.completed ? 1 : 0);
  }
  if (data.priority !== undefined) {
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
}

export function deleteTodo(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}

export function completeTodo(id: number): Todo | undefined {
  return updateTodo(id, { completed: true });
}

// ============================================
// Ideas
// ============================================

export function createIdea(data: CreateIdea): Idea {
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
  return getIdeaById(result.lastInsertRowid as number)!;
}

export function getIdeaById(id: number): Idea | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea | undefined;
}

export function getIdeasByLogId(logId: number): Idea[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ideas WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Idea[];
}

export function getAllIdeas(status?: string, limit = 100, offset = 0): Idea[] {
  const db = getDatabase();
  if (status) {
    return db.prepare('SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(status, limit, offset) as Idea[];
  }
  return db.prepare('SELECT * FROM ideas ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Idea[];
}

export function updateIdea(id: number, data: UpdateIdea): Idea | undefined {
  const db = getDatabase();
  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];

  if (data.text !== undefined) {
    updates.push('text = ?');
    values.push(data.text);
  }
  if (data.status !== undefined) {
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
}

export function deleteIdea(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================
// Learnings
// ============================================

export function createLearning(data: CreateLearning): Learning {
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
  return getLearningById(result.lastInsertRowid as number)!;
}

export function getLearningById(id: number): Learning | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM learnings WHERE id = ?').get(id) as Learning | undefined;
}

export function getLearningsByLogId(logId: number): Learning[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM learnings WHERE log_id = ? ORDER BY created_at DESC').all(logId) as Learning[];
}

export function getAllLearnings(topic?: string, limit = 100, offset = 0): Learning[] {
  const db = getDatabase();
  if (topic) {
    return db.prepare('SELECT * FROM learnings WHERE topic = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(topic, limit, offset) as Learning[];
  }
  return db.prepare('SELECT * FROM learnings ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as Learning[];
}

export function deleteLearning(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM learnings WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================
// Summaries
// ============================================

export function createSummary(data: CreateSummary): Summary {
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
  return getSummaryById(result.lastInsertRowid as number)!;
}

export function getSummaryById(id: number): Summary | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM summaries WHERE id = ?').get(id) as Summary | undefined;
}

export function getSummaryByWeek(weekStart: string): Summary | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM summaries WHERE week_start = ?').get(weekStart) as Summary | undefined;
}

export function getAllSummaries(limit = 52, offset = 0): Summary[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM summaries ORDER BY week_start DESC LIMIT ? OFFSET ?').all(limit, offset) as Summary[];
}

export function deleteSummary(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM summaries WHERE id = ?').run(id);
  return result.changes > 0;
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
}
