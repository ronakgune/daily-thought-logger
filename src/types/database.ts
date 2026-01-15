/**
 * Database types for Daily Thought Logger
 * AI-10: DatabaseService with CRUD for all tables
 */

// ============================================================================
// Base Entity Types (returned from database)
// ============================================================================

export interface Log {
  id: number;
  date: string; // ISO 8601 date string
  audioPath: string | null;
  transcript: string | null;
  summary: string | null;
  pendingAnalysis: boolean;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: number;
  logId: number;
  text: string;
  completed: boolean;
  dueDate: string | null;
  priority: number; // 1 = high, 2 = medium, 3 = low
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: number;
  logId: number;
  text: string;
  status: IdeaStatus;
  tags: string | null; // JSON array stored as string
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = 'raw' | 'developing' | 'actionable' | 'archived';

export interface Learning {
  id: number;
  logId: number;
  text: string;
  category: string | null;
  createdAt: string;
}

export interface Accomplishment {
  id: number;
  logId: number;
  text: string;
  impact: AccomplishmentImpact;
  createdAt: string;
}

export type AccomplishmentImpact = 'low' | 'medium' | 'high';

export interface Summary {
  id: number;
  weekStart: string; // ISO 8601 date for start of week
  weekEnd: string;
  content: string;
  highlights: string | null; // JSON array stored as string
  generatedAt: string;
}

// ============================================================================
// Input Types (for creating/updating entities)
// ============================================================================

export interface CreateLogInput {
  date: string;
  audioPath?: string | null;
  transcript?: string | null;
  summary?: string | null;
}

export interface UpdateLogInput {
  audioPath?: string | null;
  transcript?: string | null;
  summary?: string | null;
}

export interface CreateTodoInput {
  logId: number;
  text: string;
  completed?: boolean;
  dueDate?: string | null;
  priority?: number;
}

export interface UpdateTodoInput {
  text?: string;
  completed?: boolean;
  dueDate?: string | null;
  priority?: number;
}

export interface CreateIdeaInput {
  logId: number;
  text: string;
  status?: IdeaStatus;
  tags?: string[];
}

export interface UpdateIdeaInput {
  text?: string;
  status?: IdeaStatus;
  tags?: string[];
}

export interface CreateLearningInput {
  logId: number;
  text: string;
  category?: string | null;
}

export interface CreateAccomplishmentInput {
  logId: number;
  text: string;
  impact?: AccomplishmentImpact;
}

export interface CreateSummaryInput {
  weekStart: string;
  weekEnd: string;
  content: string;
  highlights?: string[];
}

// ============================================================================
// Composite Types (for transactions)
// ============================================================================

export interface LogSegments {
  todos?: CreateTodoInput[];
  ideas?: CreateIdeaInput[];
  learnings?: CreateLearningInput[];
  accomplishments?: CreateAccomplishmentInput[];
}

export interface LogWithSegments extends Log {
  todos: Todo[];
  ideas: Idea[];
  learnings: Learning[];
  accomplishments: Accomplishment[];
}

// ============================================================================
// Query Options
// ============================================================================

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface TodoQueryOptions extends PaginationOptions {
  completed?: boolean;
}

export interface IdeaQueryOptions extends PaginationOptions {
  status?: IdeaStatus;
}

// ============================================================================
// Database Error Types
// ============================================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entity: string, id: number | string) {
    super(`${entity} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
