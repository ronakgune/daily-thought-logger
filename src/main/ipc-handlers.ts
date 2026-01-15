/**
 * IPC Handlers for Main Process
 * AI-23: Wire recording/text to analysis pipeline
 *
 * This module sets up all IPC communication between renderer and main process,
 * handling audio/text analysis requests and sending progress updates.
 */

import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { AnalysisService } from '../services/analysis';
import { StorageService } from '../services/storage';
import { DatabaseService } from '../services/database';
import type { AnalysisResult } from '../types';
import type { LogWithSegments } from '../types/database';

/**
 * Configuration for audio file storage
 */
export interface AudioStorageConfig {
  /** Directory to store audio files */
  audioDir: string;
}

/**
 * Get the default audio directory with proper home directory resolution
 */
function getDefaultAudioDir(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();

  if (!homeDir) {
    throw new Error('Cannot determine home directory');
  }

  return path.join(homeDir, '.daily-thought-logger', 'audio');
}

/**
 * Default audio storage configuration
 */
const DEFAULT_CONFIG: AudioStorageConfig = {
  audioDir: getDefaultAudioDir(),
};

/**
 * IPCHandlers manages all IPC communication for the analysis pipeline
 */
export class IPCHandlers {
  private analysisService: AnalysisService;
  private storageService: StorageService;
  private config: AudioStorageConfig;

  constructor(
    databaseService: DatabaseService,
    config: AudioStorageConfig = DEFAULT_CONFIG
  ) {
    this.analysisService = new AnalysisService();
    this.storageService = new StorageService(databaseService);
    this.config = config;
  }

  /**
   * Register all IPC handlers with Electron
   * Call this once during app initialization
   */
  registerHandlers(): void {
    // Audio analysis handler
    ipcMain.handle('analyze:audio', async (event, data) => {
      try {
        const audioData = this.validateAudioData(data);
        return this.handleAudioAnalysis(event.sender, audioData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid input';
        this.sendErrorSafe(event.sender, message);
        throw error;
      }
    });

    // Text analysis handler
    ipcMain.handle('analyze:text', async (event, data) => {
      try {
        const text = this.validateTextInput(data);
        return this.handleTextAnalysis(event.sender, text);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid input';
        this.sendErrorSafe(event.sender, message);
        throw error;
      }
    });

    // AI-27: Todo operations
    ipcMain.handle('todos:getAll', async (event, data) => {
      try {
        const options = data || {};
        return this.storageService.getAllTodos(options);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch todos';
        throw new Error(message);
      }
    });

    ipcMain.handle('todos:toggleComplete', async (event, data) => {
      try {
        const { todoId, completed } = data;
        if (typeof todoId !== 'number') {
          throw new Error('Invalid todo ID');
        }
        if (typeof completed !== 'boolean') {
          throw new Error('Invalid completed status');
        }
        return this.storageService.updateTodo(todoId, { completed });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update todo';
        throw new Error(message);
      }
    });

    ipcMain.handle('todos:getLog', async (event, data) => {
      try {
        const { logId } = data;
        if (typeof logId !== 'number') {
          throw new Error('Invalid log ID');
        }
        return this.storageService.getLogById(logId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch log';
        throw new Error(message);
      }
    });
  }

  /**
   * Unregister all IPC handlers
   * Call this during app cleanup
   */
  unregisterHandlers(): void {
    ipcMain.removeHandler('analyze:audio');
    ipcMain.removeHandler('analyze:text');
    ipcMain.removeHandler('todos:getAll');
    ipcMain.removeHandler('todos:toggleComplete');
    ipcMain.removeHandler('todos:getLog');
  }

  /**
   * Validate audio data input
   * @param data - Unknown data from IPC
   * @returns Validated ArrayBuffer
   * @throws Error if validation fails
   */
  private validateAudioData(data: unknown): ArrayBuffer {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid audio data: must be an object');
    }
    const { audioData } = data as any;
    if (!(audioData instanceof ArrayBuffer)) {
      throw new Error('Invalid audio data: must be an ArrayBuffer');
    }
    if (audioData.byteLength === 0) {
      throw new Error('Audio data cannot be empty');
    }
    const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
    if (audioData.byteLength > MAX_AUDIO_SIZE) {
      throw new Error('Audio data exceeds maximum size of 500MB');
    }
    return audioData;
  }

  /**
   * Validate text input
   * @param data - Unknown data from IPC
   * @returns Validated and trimmed text
   * @throws Error if validation fails
   */
  private validateTextInput(data: unknown): string {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid text data: must be an object');
    }
    const { text } = data as any;
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('Text cannot be empty');
    }
    if (trimmed.length > 50000) {
      throw new Error('Text exceeds maximum length of 50000 characters');
    }
    return trimmed;
  }

  /**
   * Handle audio analysis request from renderer
   *
   * Flow:
   * 1. Send progress: "Saving audio file..."
   * 2. Save audio blob to file
   * 3. Send progress: "Analyzing audio..."
   * 4. Send audio to AnalysisService
   * 5. Send progress: "Storing results..."
   * 6. Store results via StorageService
   * 7. Send complete event with results
   * 8. Trigger UI refresh
   *
   * @param sender - The WebContents that sent the request
   * @param audioData - The audio data as ArrayBuffer
   * @returns The saved log with all segments
   */
  private async handleAudioAnalysis(
    sender: Electron.WebContents,
    audioData: ArrayBuffer
  ): Promise<LogWithSegments> {
    // Verify sender is still valid
    if (sender.isDestroyed()) {
      throw new Error('Target window has been closed');
    }

    try {
      // Step 1: Save audio to file
      this.sendProgressSafe(sender, 'Saving audio file...', 10);
      const audioPath = await this.saveAudioFile(audioData);

      // Step 2: Analyze audio
      this.sendProgressSafe(sender, 'Analyzing audio...', 30);
      const analysisResult = await this.analysisService.analyzeAudio(
        Buffer.from(audioData),
        { mimeType: 'audio/wav' }
      );

      // Step 3: Store results
      this.sendProgressSafe(sender, 'Storing results...', 80);
      const savedLog = await this.storageService.saveAnalysisResult(
        analysisResult,
        audioPath
      );

      // Step 4: Send complete event
      this.sendProgressSafe(sender, 'Complete', 100);
      if (!sender.isDestroyed()) {
        sender.send('analyze:complete', {
          result: analysisResult,
          logId: savedLog.id,
        });
      }

      return savedLog;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);

      // Log for debugging (without sensitive data)
      console.error('[IPC] Audio analysis failed:', {
        message: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Send to renderer
      this.sendErrorSafe(sender, errorMessage);

      // Re-throw in test environment
      if (process.env.NODE_ENV === 'test') {
        throw error;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Handle text analysis request from renderer
   *
   * Flow:
   * 1. Send progress: "Analyzing text..."
   * 2. Send text to AnalysisService
   * 3. Send progress: "Storing results..."
   * 4. Store results via StorageService
   * 5. Send complete event with results
   * 6. Trigger UI refresh
   *
   * @param sender - The WebContents that sent the request
   * @param text - The text to analyze
   * @returns The saved log with all segments
   */
  private async handleTextAnalysis(
    sender: Electron.WebContents,
    text: string
  ): Promise<LogWithSegments> {
    // Verify sender is still valid
    if (sender.isDestroyed()) {
      throw new Error('Target window has been closed');
    }

    try {
      // Step 1: Analyze text
      this.sendProgressSafe(sender, 'Analyzing text...', 30);
      const analysisResult = await this.analysisService.analyzeText(text);

      // Step 2: Store results
      this.sendProgressSafe(sender, 'Storing results...', 80);
      const savedLog = await this.storageService.saveAnalysisResult(analysisResult);

      // Step 3: Send complete event
      this.sendProgressSafe(sender, 'Complete', 100);
      if (!sender.isDestroyed()) {
        sender.send('analyze:complete', {
          result: analysisResult,
          logId: savedLog.id,
        });
      }

      return savedLog;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);

      // Log for debugging (without sensitive data)
      console.error('[IPC] Text analysis failed:', {
        message: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
      });

      // Send to renderer
      this.sendErrorSafe(sender, errorMessage);

      // Re-throw in test environment
      if (process.env.NODE_ENV === 'test') {
        throw error;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Send progress update to renderer (safe version with error handling)
   *
   * @param sender - The WebContents to send to
   * @param status - Status message
   * @param progress - Progress percentage (0-100)
   */
  private sendProgressSafe(
    sender: Electron.WebContents,
    status: string,
    progress: number
  ): void {
    try {
      if (!sender.isDestroyed()) {
        sender.send('analyze:progress', { status, progress });
      }
    } catch (error) {
      // Log but don't throw - IPC errors shouldn't crash the handler
      console.error('Failed to send progress:', error);
    }
  }

  /**
   * Send error to renderer (safe version with error handling)
   *
   * @param sender - The WebContents to send to
   * @param message - Error message
   */
  private sendErrorSafe(sender: Electron.WebContents, message: string): void {
    try {
      if (!sender.isDestroyed()) {
        sender.send('analyze:error', { error: message });
      }
    } catch (error) {
      console.error('Failed to send error:', error);
    }
  }

  /**
   * Extract error message from unknown error type
   *
   * @param error - Unknown error object
   * @returns User-friendly error message
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }

  /**
   * Save audio data to file
   *
   * @param audioData - The audio data as ArrayBuffer
   * @returns Path to the saved audio file
   */
  private async saveAudioFile(audioData: ArrayBuffer): Promise<string> {
    // Validate audio data size
    const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
    if (audioData.byteLength > MAX_AUDIO_SIZE) {
      throw new Error(`Audio file exceeds maximum size of ${MAX_AUDIO_SIZE} bytes`);
    }

    // Ensure audio directory exists and is writable
    await this.ensureAudioDirectory();

    // Generate safe filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.wav`;
    const filePath = path.join(this.config.audioDir, filename);

    // CRITICAL: Validate that resolved path is within audioDir
    const resolvedAudioDir = path.resolve(this.config.audioDir);
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(resolvedAudioDir + path.sep)) {
      throw new Error('Invalid file path: path traversal detected');
    }

    // Write audio data to file
    await fs.writeFile(resolvedFilePath, Buffer.from(audioData));

    return resolvedFilePath;
  }

  /**
   * Ensure audio directory exists and is writable
   * @throws Error if directory cannot be created or is not writable
   */
  private async ensureAudioDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.audioDir, { recursive: true });

      // Verify directory is writable
      await fs.access(this.config.audioDir, fs.constants.W_OK);
    } catch (error: any) {
      if (error?.code === 'EACCES') {
        throw new Error(
          `Permission denied: cannot write to ${this.config.audioDir}`
        );
      }
      if (error?.code === 'ENOSPC') {
        throw new Error('Disk space exhausted: cannot save audio file');
      }
      throw new Error(`Failed to create audio directory: ${error}`);
    }
  }

  /**
   * Get the audio directory path (useful for testing)
   */
  getAudioDir(): string {
    return this.config.audioDir;
  }
}

/**
 * Initialize IPC handlers
 * Call this once during app startup
 *
 * @param databaseService - The database service instance
 * @param config - Optional configuration
 * @returns The IPC handlers instance
 */
export function initializeIPCHandlers(
  databaseService: DatabaseService,
  config?: AudioStorageConfig
): IPCHandlers {
  const handlers = new IPCHandlers(databaseService, config);
  handlers.registerHandlers();
  return handlers;
}
