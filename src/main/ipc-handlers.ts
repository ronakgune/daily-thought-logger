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
 * Default audio storage configuration
 */
const DEFAULT_CONFIG: AudioStorageConfig = {
  audioDir: path.join(process.env.HOME || '~', '.daily-thought-logger', 'audio'),
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
    ipcMain.handle('analyze:audio', async (event, data: { audioData: ArrayBuffer }) => {
      return this.handleAudioAnalysis(event.sender, data.audioData);
    });

    // Text analysis handler
    ipcMain.handle('analyze:text', async (event, data: { text: string }) => {
      return this.handleTextAnalysis(event.sender, data.text);
    });
  }

  /**
   * Unregister all IPC handlers
   * Call this during app cleanup
   */
  unregisterHandlers(): void {
    ipcMain.removeHandler('analyze:audio');
    ipcMain.removeHandler('analyze:text');
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
    try {
      // Step 1: Save audio to file
      this.sendProgress(sender, 'Saving audio file...', 10);
      const audioPath = await this.saveAudioFile(audioData);

      // Step 2: Analyze audio
      this.sendProgress(sender, 'Analyzing audio...', 30);
      const analysisResult = await this.analysisService.analyzeAudio(
        Buffer.from(audioData),
        { mimeType: 'audio/wav' }
      );

      // Step 3: Store results
      this.sendProgress(sender, 'Storing results...', 80);
      const savedLog = this.storageService.saveAnalysisResult(
        analysisResult,
        audioPath
      );

      // Step 4: Send complete event
      this.sendProgress(sender, 'Complete', 100);
      sender.send('analyze:complete', {
        result: analysisResult,
        logId: savedLog.id,
      });

      return savedLog;
    } catch (error) {
      // Send error event
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sender.send('analyze:error', { error: errorMessage });
      throw error;
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
    try {
      // Step 1: Analyze text
      this.sendProgress(sender, 'Analyzing text...', 30);
      const analysisResult = await this.analysisService.analyzeText(text);

      // Step 2: Store results
      this.sendProgress(sender, 'Storing results...', 80);
      const savedLog = this.storageService.saveAnalysisResult(analysisResult);

      // Step 3: Send complete event
      this.sendProgress(sender, 'Complete', 100);
      sender.send('analyze:complete', {
        result: analysisResult,
        logId: savedLog.id,
      });

      return savedLog;
    } catch (error) {
      // Send error event
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sender.send('analyze:error', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Send progress update to renderer
   *
   * @param sender - The WebContents to send to
   * @param status - Status message
   * @param progress - Progress percentage (0-100)
   */
  private sendProgress(
    sender: Electron.WebContents,
    status: string,
    progress: number
  ): void {
    sender.send('analyze:progress', { status, progress });
  }

  /**
   * Save audio data to file
   *
   * @param audioData - The audio data as ArrayBuffer
   * @returns Path to the saved audio file
   */
  private async saveAudioFile(audioData: ArrayBuffer): Promise<string> {
    // Ensure audio directory exists
    await fs.mkdir(this.config.audioDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.wav`;
    const filePath = path.join(this.config.audioDir, filename);

    // Write audio data to file
    await fs.writeFile(filePath, Buffer.from(audioData));

    return filePath;
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
