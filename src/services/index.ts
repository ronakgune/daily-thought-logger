/**
 * Service exports for Daily Thought Logger
 */

// Database service
export { DatabaseService, getDatabaseService, closeDatabaseService } from './database';

// Storage service (AI-16)
export { StorageService } from './storage';

// Gemini AI service
export { GeminiService, geminiService } from './gemini';
export { KeychainService, keychainService } from './keychain';

// Analysis service
export { AnalysisService, analysisService } from './analysis';
export type { AnalyzeAudioOptions, AnalyzeTextOptions } from './analysis';

// Pending queue service (AI-18)
export { PendingQueueService, pendingQueueService } from './pending-queue';
export type { PendingLog, QueueResult, RetryConfig } from './pending-queue';

// Audio recorder service (AI-21)
export { AudioRecorderService, AudioRecorderError } from './audio-recorder';
export type {
  PermissionState,
  RecordingState,
  RecordingResult,
  AudioLevel,
} from './audio-recorder';
