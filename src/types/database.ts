/**
 * Database type definitions for Daily Thought Logger
 */

export interface Log {
  id: number;
  timestamp: string;
  transcript: string;
  raw_analysis: string | null;
  audio_path: string | null;
  duration_seconds: number | null;
}

export interface Accomplishment {
  id: number;
  log_id: number;
  text: string;
  confidence: number | null;
  created_at: string;
}

export interface Todo {
  id: number;
  log_id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  confidence: number | null;
  user_reclassified: boolean;
  created_at: string;
}

export interface Idea {
  id: number;
  log_id: number;
  text: string;
  status: 'new' | 'reviewing' | 'implemented' | 'archived';
  category: string | null;
  confidence: number | null;
  user_reclassified: boolean;
  created_at: string;
}

export interface Learning {
  id: number;
  log_id: number;
  text: string;
  topic: string | null;
  confidence: number | null;
  created_at: string;
}

export interface Summary {
  id: number;
  week_start: string;
  week_end: string;
  content: string;
  highlights: string | null;
  stats: string | null;
  created_at: string;
}

// Input types for creating new records (omit auto-generated fields)
export type CreateLog = Omit<Log, 'id' | 'timestamp'>;
export type CreateAccomplishment = Omit<Accomplishment, 'id' | 'created_at'>;
export type CreateTodo = Omit<Todo, 'id' | 'created_at' | 'completed' | 'user_reclassified'>;
export type CreateIdea = Omit<Idea, 'id' | 'created_at' | 'status' | 'user_reclassified'>;
export type CreateLearning = Omit<Learning, 'id' | 'created_at'>;
export type CreateSummary = Omit<Summary, 'id' | 'created_at'>;

// Update types for modifying existing records
export type UpdateTodo = Partial<Pick<Todo, 'text' | 'completed' | 'priority' | 'user_reclassified'>>;
export type UpdateIdea = Partial<Pick<Idea, 'text' | 'status' | 'category' | 'user_reclassified'>>;
