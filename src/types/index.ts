/**
 * Type definitions for Daily Thought Logger
 *
 * This file contains all TypeScript interfaces and types used across
 * the application for data models, IPC communication, and CRUD operations.
 */

// ============================================================================
// Enums and Type Aliases
// ============================================================================

/**
 * Priority levels for todos
 * - high: Urgent tasks requiring immediate attention
 * - medium: Important but not urgent tasks
 * - low: Tasks that can be deferred
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Status tracking for ideas
 * - new: Freshly captured, not yet reviewed
 * - exploring: Actively being researched or developed
 * - parked: Put on hold for later consideration
 * - done: Completed or implemented
 */
export type IdeaStatus = 'new' | 'exploring' | 'parked' | 'done';

/**
 * Types of segments that can be extracted from voice logs
 */
export type SegmentType = 'accomplishment' | 'todo' | 'idea' | 'learning';

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Represents a voice log entry - the primary unit of data capture
 */
export interface Log {
  /** Unique identifier */
  id: number;
  /** When the log was recorded */
  timestamp: Date;
  /** Transcribed text from the audio recording */
  transcript: string;
  /** Raw AI analysis output before parsing */
  raw_analysis?: string;
  /** Path to the audio file on disk */
  audio_path?: string;
  /** Length of the recording in seconds */
  duration_seconds?: number;
}

/**
 * A task extracted from a voice log
 */
export interface Todo {
  /** Unique identifier */
  id: number;
  /** Reference to the source log */
  log_id: number;
  /** The task description */
  text: string;
  /** Whether the task has been completed */
  completed: boolean;
  /** Urgency level of the task */
  priority: Priority;
  /** AI confidence score (0-1) for this extraction */
  confidence?: number;
  /** Whether user manually changed the classification */
  user_reclassified: boolean;
  /** When the todo was created */
  created_at: Date;
}

/**
 * An idea or concept extracted from a voice log
 */
export interface Idea {
  /** Unique identifier */
  id: number;
  /** Reference to the source log */
  log_id: number;
  /** The idea description */
  text: string;
  /** Current status of the idea */
  status: IdeaStatus;
  /** Optional category for organization (e.g., "product", "personal", "tech") */
  category?: string;
  /** AI confidence score (0-1) for this extraction */
  confidence?: number;
  /** Whether user manually changed the classification */
  user_reclassified: boolean;
  /** When the idea was created */
  created_at: Date;
}

/**
 * A learning or insight extracted from a voice log
 */
export interface Learning {
  /** Unique identifier */
  id: number;
  /** Reference to the source log */
  log_id: number;
  /** The learning description */
  text: string;
  /** Topic or subject area (e.g., "typescript", "leadership", "design") */
  topic?: string;
  /** AI confidence score (0-1) for this extraction */
  confidence?: number;
  /** When the learning was created */
  created_at: Date;
}

/**
 * An accomplishment or achievement extracted from a voice log
 */
export interface Accomplishment {
  /** Unique identifier */
  id: number;
  /** Reference to the source log */
  log_id: number;
  /** The accomplishment description */
  text: string;
  /** AI confidence score (0-1) for this extraction */
  confidence?: number;
  /** When the accomplishment was created */
  created_at: Date;
}

/**
 * Weekly summary aggregating logs and insights
 */
export interface Summary {
  /** Unique identifier */
  id: number;
  /** Start date of the week (Monday) */
  week_start: Date;
  /** End date of the week (Sunday) */
  week_end: Date;
  /** AI-generated summary content */
  content: string;
  /** Key highlights from the week */
  highlights?: string;
  /** Aggregated statistics for the week */
  stats?: SummaryStats;
  /** When the summary was generated */
  created_at: Date;
}

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Result of AI analysis on a voice transcript
 */
export interface AnalysisResult {
  /** The transcribed text from the recording */
  transcript: string;
  /** Extracted segments categorized by type */
  segments: Segment[];
}

/**
 * A single extracted segment from the analysis
 */
export interface Segment {
  /** Category of this segment */
  type: SegmentType;
  /** The extracted text content */
  text: string;
  /** AI confidence score (0-1) for this extraction */
  confidence: number;
  /** Priority level (only for todos) */
  priority?: Priority;
  /** Category classification (only for ideas) */
  category?: string;
  /** Topic classification (only for learnings) */
  topic?: string;
}

// ============================================================================
// Input Types for CRUD Operations
// ============================================================================

/**
 * Input for creating a new log entry
 */
export interface CreateLogInput {
  /** Transcribed text from the audio recording */
  transcript: string;
  /** Raw AI analysis output */
  raw_analysis?: string;
  /** Path to the audio file */
  audio_path?: string;
  /** Recording duration in seconds */
  duration_seconds?: number;
}

/**
 * Input for updating an existing log
 */
export interface UpdateLogInput {
  /** Updated transcript text */
  transcript?: string;
  /** Updated raw analysis */
  raw_analysis?: string;
}

/**
 * Input for creating a new todo
 */
export interface CreateTodoInput {
  /** Reference to the source log */
  log_id: number;
  /** The task description */
  text: string;
  /** Urgency level (defaults to 'medium') */
  priority?: Priority;
  /** AI confidence score */
  confidence?: number;
}

/**
 * Input for updating an existing todo
 */
export interface UpdateTodoInput {
  /** Updated task text */
  text?: string;
  /** Updated completion status */
  completed?: boolean;
  /** Updated priority level */
  priority?: Priority;
  /** Mark as user reclassified */
  user_reclassified?: boolean;
}

/**
 * Input for creating a new idea
 */
export interface CreateIdeaInput {
  /** Reference to the source log */
  log_id: number;
  /** The idea description */
  text: string;
  /** Initial status (defaults to 'new') */
  status?: IdeaStatus;
  /** Category for organization */
  category?: string;
  /** AI confidence score */
  confidence?: number;
}

/**
 * Input for updating an existing idea
 */
export interface UpdateIdeaInput {
  /** Updated idea text */
  text?: string;
  /** Updated status */
  status?: IdeaStatus;
  /** Updated category */
  category?: string;
  /** Mark as user reclassified */
  user_reclassified?: boolean;
}

/**
 * Input for creating a new learning
 */
export interface CreateLearningInput {
  /** Reference to the source log */
  log_id: number;
  /** The learning description */
  text: string;
  /** Topic or subject area */
  topic?: string;
  /** AI confidence score */
  confidence?: number;
}

/**
 * Input for updating an existing learning
 */
export interface UpdateLearningInput {
  /** Updated learning text */
  text?: string;
  /** Updated topic */
  topic?: string;
}

/**
 * Input for creating a new accomplishment
 */
export interface CreateAccomplishmentInput {
  /** Reference to the source log */
  log_id: number;
  /** The accomplishment description */
  text: string;
  /** AI confidence score */
  confidence?: number;
}

/**
 * Input for updating an existing accomplishment
 */
export interface UpdateAccomplishmentInput {
  /** Updated accomplishment text */
  text?: string;
}

/**
 * Input for creating a weekly summary
 */
export interface CreateSummaryInput {
  /** Start date of the week */
  week_start: Date;
  /** End date of the week */
  week_end: Date;
  /** Summary content */
  content: string;
  /** Key highlights */
  highlights?: string;
  /** Aggregated statistics */
  stats?: SummaryStats;
}

// ============================================================================
// IPC Message Types
// ============================================================================

/**
 * Type-safe IPC message definitions for main/renderer communication
 *
 * Usage with Electron IPC:
 * ```typescript
 * // Main process
 * ipcMain.handle('analyze:start', async (event, data: IpcMessages['analyze:start']) => {
 *   // Process audio data
 * });
 *
 * // Renderer process
 * const result = await ipcRenderer.invoke('analyze:start', { audioData: buffer });
 * ```
 */
export interface IpcMessages {
  /** Start analysis of audio data */
  'analyze:start': { audioData: Buffer };
  /** Progress update during analysis */
  'analyze:progress': { status: string; progress?: number };
  /** Analysis completed successfully */
  'analyze:complete': { result: AnalysisResult };
  /** Analysis failed with error */
  'analyze:error': { error: string };

  /** Start a new recording session */
  'recording:start': Record<string, never>;
  /** Stop the current recording */
  'recording:stop': Record<string, never>;
  /** Recording completed with audio data */
  'recording:complete': { audioData: Buffer; duration: number };
  /** Recording failed */
  'recording:error': { error: string };

  /** Request to save a log */
  'log:save': { input: CreateLogInput; segments: Segment[] };
  /** Log saved successfully */
  'log:saved': { log: Log };
  /** Request list of logs */
  'log:list': { limit?: number; offset?: number };
  /** List of logs returned */
  'log:listResult': { logs: Log[]; total: number };

  /** Request weekly summary generation */
  'summary:generate': { weekStart: Date; weekEnd: Date };
  /** Summary generated successfully */
  'summary:generated': { summary: Summary };
}

/**
 * Extract the payload type for a specific IPC channel
 */
export type IpcPayload<K extends keyof IpcMessages> = IpcMessages[K];

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Aggregated statistics for a time period (typically a week)
 */
export interface SummaryStats {
  /** Total number of logs in the period */
  total_logs: number;
  /** Number of todos created */
  todos_created: number;
  /** Number of todos marked complete */
  todos_completed: number;
  /** Number of ideas captured */
  ideas_generated: number;
  /** Number of learnings captured */
  learnings_captured: number;
  /** Number of accomplishments recorded */
  accomplishments_recorded: number;
  /** Total recording time in seconds */
  total_recording_time: number;
}

/**
 * Daily statistics for trend tracking
 */
export interface DailyStats {
  /** The date for these statistics */
  date: Date;
  /** Number of logs recorded */
  logs_count: number;
  /** Number of todos created */
  todos_count: number;
  /** Number of ideas captured */
  ideas_count: number;
  /** Number of learnings captured */
  learnings_count: number;
  /** Number of accomplishments recorded */
  accomplishments_count: number;
  /** Total recording duration in seconds */
  recording_duration: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The response data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Filter options for querying logs
 */
export interface LogFilterOptions {
  /** Filter by date range start */
  startDate?: Date;
  /** Filter by date range end */
  endDate?: Date;
  /** Search in transcript text */
  searchText?: string;
  /** Number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

/**
 * Filter options for querying todos
 */
export interface TodoFilterOptions {
  /** Filter by completion status */
  completed?: boolean;
  /** Filter by priority */
  priority?: Priority;
  /** Filter by source log */
  log_id?: number;
  /** Number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

/**
 * Filter options for querying ideas
 */
export interface IdeaFilterOptions {
  /** Filter by status */
  status?: IdeaStatus;
  /** Filter by category */
  category?: string;
  /** Filter by source log */
  log_id?: number;
  /** Number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}
