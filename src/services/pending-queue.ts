/**
 * PendingQueueService - Handles offline/failed analysis requests
 * AI-18: Create "pending analysis" state for offline/failed requests
 *
 * Manages audio recordings that couldn't be analyzed due to:
 * - No internet connection
 * - API temporarily unavailable
 * - All retries exhausted
 *
 * Features:
 * - Save audio file locally before analysis attempt
 * - Create log record with pending_analysis flag
 * - Queue for retry when online
 * - Show "pending" indicator in UI
 */

import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { app } from 'electron';
import { DatabaseService } from './database';
import { GeminiService } from './gemini';
import type { Log } from '../types/database';
import type { GeminiError } from '../types/gemini';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts before giving up */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
}

/**
 * Result of a queue operation
 */
export interface QueueResult {
  success: boolean;
  logId?: number;
  error?: string;
}

/**
 * Extended log type for pending items
 */
export interface PendingLog extends Log {
  audioPath: string; // Non-null for pending logs
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  exponentialBackoff: true,
};

/**
 * PendingQueueService manages audio recordings that require offline/deferred analysis.
 */
export class PendingQueueService {
  private db: DatabaseService;
  private gemini: GeminiService;
  private retryConfig: RetryConfig;
  private isProcessing = false;

  constructor(
    db?: DatabaseService,
    gemini?: GeminiService,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.db = db ?? new DatabaseService();
    this.gemini = gemini ?? new GeminiService();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Gets the directory for storing audio files.
   */
  private getAudioStorageDir(): string {
    const userDataPath = app.getPath('userData');
    const audioDir = path.join(userDataPath, 'audio-recordings');

    // Ensure directory exists
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    return audioDir;
  }

  /**
   * Saves audio buffer to disk and returns the file path.
   * @param audioBuffer - The audio data to save
   * @param date - The date string for the log (used in filename)
   * @returns The absolute path to the saved audio file
   */
  private async saveAudioFile(audioBuffer: Buffer, date: string): Promise<string> {
    const audioDir = this.getAudioStorageDir();
    const uuid = crypto.randomUUID();
    const filename = `${date}-${uuid}.wav`;
    const audioPath = path.join(audioDir, filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(audioPath, audioBuffer, (err) => {
        if (err) {
          reject(new Error(`Failed to save audio file: ${err.message}`));
        } else {
          resolve(audioPath);
        }
      });
    });
  }

  /**
   * Determines if an error is retryable (network/service issues).
   * @param error - The error from Gemini service
   * @returns True if the error is retryable
   */
  private isRetryableError(error: GeminiError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
    ];
    return retryableCodes.includes(error.code);
  }

  /**
   * Queues an audio recording for analysis. Saves the audio file first,
   * then attempts analysis. If analysis fails due to network/service issues,
   * marks as pending for later retry.
   *
   * @param audioBuffer - The audio data to analyze
   * @param date - The date string for the log (ISO 8601 format: YYYY-MM-DD)
   * @returns The log ID (will have pending_analysis=true if analysis failed)
   */
  async queueForAnalysis(audioBuffer: Buffer, date: string): Promise<number> {
    // Step 1: Save audio file to disk first (before any analysis attempt)
    const audioPath = await this.saveAudioFile(audioBuffer, date);

    // Step 2: Attempt transcription and analysis
    try {
      // Try to transcribe the audio
      const transcriptionResult = await this.gemini.transcribeAudio(audioBuffer);

      // Step 3: Create log record and mark as analyzed in a single transaction
      const logId = this.db.runTransaction(() => {
        const log = this.db.createLog({
          date,
          audioPath,
          transcript: transcriptionResult.text,
          summary: null,
        });

        // Try to analyze the transcript
        // TODO: This should integrate with the analysis service (AI-14)
        // For now, we'll just save the transcript and mark as analyzed
        this.db.markLogAsAnalyzed(log.id);

        return log.id;
      });

      return logId;
    } catch (error) {
      // Handle analysis failure
      const geminiError = error as GeminiError;

      // Create log record in a transaction with appropriate status
      const logId = this.db.runTransaction(() => {
        const log = this.db.createLog({
          date,
          audioPath,
          transcript: null,
          summary: null,
        });

        // If it's a retryable error, mark as pending
        if (this.isRetryableError(geminiError)) {
          this.db.markLogAsPending(log.id, geminiError.message);
          console.log(
            `Log ${log.id} marked as pending due to: ${geminiError.message}`
          );
        } else {
          // For non-retryable errors (like invalid API key), don't mark as pending
          // Just log the error - the log remains with null transcript/summary
          console.error(
            `Log ${log.id} failed with non-retryable error: ${geminiError.message}`
          );
        }

        return log.id;
      });

      return logId;
    }
  }

  /**
   * Gets all logs that are pending analysis.
   * @returns Array of pending logs (with non-null audio paths)
   */
  async getPendingItems(): Promise<PendingLog[]> {
    const pendingLogs = this.db.getPendingLogs();

    // Filter and type-assert logs with audio paths
    return pendingLogs.filter(
      (log): log is PendingLog => log.audioPath !== null
    );
  }

  /**
   * Retries analysis for a specific pending log.
   * @param logId - The log ID to retry
   * @throws Error if log not found or has no audio file
   */
  async retryPending(logId: number): Promise<void> {
    const log = this.db.getLogById(logId);
    if (!log) {
      throw new Error(`Log ${logId} not found`);
    }

    if (!log.audioPath) {
      throw new Error(`Log ${logId} has no audio file to retry`);
    }

    if (!log.pendingAnalysis) {
      console.log(`Log ${logId} is not pending, skipping retry`);
      return;
    }

    // Check retry limit
    if (log.retryCount >= this.retryConfig.maxRetries) {
      console.log(
        `Log ${logId} has exceeded max retries (${this.retryConfig.maxRetries}), skipping`
      );
      return;
    }

    // Read audio file from disk
    let audioBuffer: Buffer;
    try {
      audioBuffer = await fs.promises.readFile(log.audioPath);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to read audio file: ${err.message}`);
    }

    // Attempt analysis
    try {
      const transcriptionResult = await this.gemini.transcribeAudio(audioBuffer);

      // Update log with transcript
      this.db.updateLog(log.id, {
        transcript: transcriptionResult.text,
      });

      // Mark as successfully analyzed
      this.db.markLogAsAnalyzed(log.id);
      console.log(`Successfully analyzed pending log ${logId}`);
    } catch (error) {
      const geminiError = error as GeminiError;

      // Update error message and increment retry count
      this.db.markLogAsPending(log.id, geminiError.message);

      // Calculate delay for exponential backoff
      let delay = this.retryConfig.retryDelay;
      if (this.retryConfig.exponentialBackoff) {
        delay = this.retryConfig.retryDelay * Math.pow(2, log.retryCount);
      }

      console.log(
        `Retry failed for log ${logId}: ${geminiError.message}. ` +
          `Will retry after ${delay}ms (attempt ${log.retryCount + 1}/${this.retryConfig.maxRetries})`
      );

      throw error;
    }
  }

  /**
   * Retries all pending logs in the queue.
   * Processes them sequentially to avoid overwhelming the API.
   */
  async retryAllPending(): Promise<void> {
    if (this.isProcessing) {
      console.log('Already processing pending queue, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      const pendingLogs = await this.getPendingItems();

      if (pendingLogs.length === 0) {
        console.log('No pending logs to retry');
        return;
      }

      console.log(`Retrying ${pendingLogs.length} pending logs...`);

      let successCount = 0;
      let failureCount = 0;

      for (const log of pendingLogs) {
        try {
          await this.retryPending(log.id);
          successCount++;

          // Small delay between retries to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          failureCount++;
          // Continue with next log even if this one fails
        }
      }

      console.log(
        `Retry complete: ${successCount} succeeded, ${failureCount} failed`
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Checks if there are any pending items in the queue.
   * @returns True if there are pending logs
   */
  async hasPendingItems(): Promise<boolean> {
    const pending = await this.getPendingItems();
    return pending.length > 0;
  }

  /**
   * Manually marks a log as analyzed (for recovery/admin purposes).
   * @param logId - The log ID to mark as analyzed
   */
  async markAsAnalyzed(logId: number): Promise<void> {
    this.db.markLogAsAnalyzed(logId);
  }

  /**
   * Resets the retry count for a specific log.
   * @param logId - The log ID to reset
   */
  async resetRetryCount(logId: number): Promise<void> {
    this.db.resetRetryCount(logId);
  }

  /**
   * Deletes the audio file for a log (for cleanup).
   * @param logId - The log ID
   */
  async deleteAudioFile(logId: number): Promise<void> {
    const log = this.db.getLogById(logId);
    if (!log || !log.audioPath) {
      return;
    }

    try {
      await fs.promises.unlink(log.audioPath);
      // Update log to remove audio path reference
      this.db.updateLog(logId, { audioPath: null });
    } catch (error) {
      const err = error as Error;
      console.warn(`Failed to delete audio file for log ${logId}: ${err.message}`);
    }
  }
}

// Export singleton instance for convenience
export const pendingQueueService = new PendingQueueService();
