/**
 * StorageService - Persists analysis results with proper FK relationships
 * AI-16: Build storage pipeline (log + related items with FK)
 *
 * This service provides transactional storage of analysis results, ensuring
 * that every segment (todo/idea/learning/accomplishment) is linked to its
 * source log via log_id foreign key for full traceability.
 */

import { DatabaseService } from './database';
import {
  CreateLogInput,
  CreateTodoInput,
  CreateIdeaInput,
  CreateLearningInput,
  CreateAccomplishmentInput,
  LogWithSegments,
  LogSegments,
} from '../types/database';
import { AnalysisResult, Segment, SegmentType } from '../types';

/**
 * StorageService handles persistence of analysis results to the database.
 *
 * Key features:
 * - Transactional saves ensure atomicity
 * - All segments linked to source log via log_id FK
 * - Enables "view source log" functionality for traceability
 *
 * Usage:
 * ```typescript
 * const storage = new StorageService(db);
 * const result = await storage.saveAnalysisResult(analysisResult, audioPath);
 * console.log(`Saved log ${result.id} with ${result.todos.length} todos`);
 * ```
 */
export class StorageService {
  constructor(private db: DatabaseService) {}

  /**
   * Saves an analysis result with all segments in a single transaction.
   *
   * Pipeline:
   * 1. Create log record with transcript and raw JSON
   * 2. Get log_id from the created log
   * 3. For each segment, insert into appropriate table with log_id FK
   * 4. Use transaction to ensure atomicity - all or nothing
   *
   * @param result - The analysis result containing transcript and segments
   * @param audioPath - Optional path to the audio file
   * @returns The created log with all associated segments
   * @throws DatabaseError if transaction fails (all changes rolled back)
   *
   * @example
   * ```typescript
   * const result = storage.saveAnalysisResult({
   *   transcript: "I completed the project and need to update docs",
   *   segments: [
   *     { type: 'accomplishment', text: 'Completed the project', confidence: 0.95 },
   *     { type: 'todo', text: 'Update documentation', priority: 'high' }
   *   ]
   * }, '/path/to/audio.wav');
   * ```
   */
  saveAnalysisResult(
    result: AnalysisResult,
    audioPath?: string
  ): LogWithSegments {
    // Get today's date in ISO format
    const today = new Date().toISOString().split('T')[0];

    // Prepare log data with raw analysis JSON for debugging/audit
    const logData: CreateLogInput = {
      date: today,
      transcript: result.transcript,
      audioPath: audioPath ?? null,
      summary: null, // Summary will be generated later
    };

    // Convert segments to database input format
    const segments = this.convertSegmentsToLogSegments(result.segments);

    // Use DatabaseService transaction to save log + segments atomically
    return this.db.saveLogWithSegments(logData, segments);
  }

  /**
   * Converts analysis segments to database input format.
   * Categorizes segments by type and maps fields appropriately.
   *
   * @param segments - Array of segments from analysis
   * @returns Categorized segments ready for database insertion
   */
  private convertSegmentsToLogSegments(segments: Segment[]): LogSegments {
    const logSegments: LogSegments = {
      todos: [],
      ideas: [],
      learnings: [],
      accomplishments: [],
    };

    for (const segment of segments) {
      switch (segment.type) {
        case 'todo':
          logSegments.todos!.push(this.convertToTodoInput(segment));
          break;
        case 'idea':
          logSegments.ideas!.push(this.convertToIdeaInput(segment));
          break;
        case 'learning':
          logSegments.learnings!.push(this.convertToLearningInput(segment));
          break;
        case 'accomplishment':
          logSegments.accomplishments!.push(
            this.convertToAccomplishmentInput(segment)
          );
          break;
        default:
          // Type guard - should never happen with proper SegmentType
          const exhaustiveCheck: never = segment.type;
          console.warn(`Unknown segment type: ${exhaustiveCheck}`);
      }
    }

    return logSegments;
  }

  /**
   * Converts a segment to CreateTodoInput format.
   * Note: logId will be set by the transaction in saveLogWithSegments.
   */
  private convertToTodoInput(segment: Segment): Omit<CreateTodoInput, 'logId'> {
    return {
      text: segment.text,
      completed: false,
      priority: this.convertPriorityToNumber(segment.priority),
      dueDate: null,
    };
  }

  /**
   * Converts a segment to CreateIdeaInput format.
   */
  private convertToIdeaInput(segment: Segment): Omit<CreateIdeaInput, 'logId'> {
    return {
      text: segment.text,
      status: 'raw', // New ideas start as 'raw'
      tags: segment.category ? [segment.category] : undefined,
    };
  }

  /**
   * Converts a segment to CreateLearningInput format.
   */
  private convertToLearningInput(
    segment: Segment
  ): Omit<CreateLearningInput, 'logId'> {
    return {
      text: segment.text,
      category: segment.topic ?? null,
    };
  }

  /**
   * Converts a segment to CreateAccomplishmentInput format.
   */
  private convertToAccomplishmentInput(
    segment: Segment
  ): Omit<CreateAccomplishmentInput, 'logId'> {
    return {
      text: segment.text,
      impact: 'medium', // Default impact level
    };
  }

  /**
   * Converts priority string to database number format.
   * Database uses: 1 = high, 2 = medium, 3 = low
   */
  private convertPriorityToNumber(priority?: string): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'low':
        return 3;
      case 'medium':
      default:
        return 2;
    }
  }

  /**
   * Retrieves a log with all its segments by ID.
   * Useful for "view source log" functionality.
   *
   * @param logId - The log ID to retrieve
   * @returns The log with all segments, or null if not found
   *
   * @example
   * ```typescript
   * const log = storage.getLogWithSegments(42);
   * if (log) {
   *   console.log(`Log from ${log.date}:`);
   *   console.log(`Transcript: ${log.transcript}`);
   *   console.log(`Todos: ${log.todos.length}`);
   * }
   * ```
   */
  getLogWithSegments(logId: number): LogWithSegments | null {
    return this.db.getLogWithSegments(logId);
  }

  /**
   * Gets all logs with their segments, with optional pagination.
   *
   * @param options - Pagination options
   * @returns Array of logs with segments
   */
  getAllLogsWithSegments(options?: {
    limit?: number;
    offset?: number;
  }): LogWithSegments[] {
    const logs = this.db.getAllLogs(options);
    return logs.map((log) => this.db.getLogWithSegments(log.id)!);
  }
}
