/**
 * IPC Client for Renderer Process
 * AI-23: Wire recording/text to analysis pipeline
 *
 * This module provides a type-safe API for the renderer process to communicate
 * with the main process for audio/text analysis.
 */

import type { AnalysisResult } from '../types';
import type { LogWithSegments } from '../types/database';

/**
 * Progress update callback
 */
export type ProgressCallback = (status: string, progress: number) => void;

/**
 * Analysis complete callback
 */
export type CompleteCallback = (result: AnalysisResult, logId: number) => void;

/**
 * Error callback
 */
export type ErrorCallback = (error: string) => void;

/**
 * IPC API interface (exposed via preload script)
 */
interface ElectronAPI {
  // Invoke methods (request-response)
  analyzeAudio: (audioData: ArrayBuffer) => Promise<LogWithSegments>;
  analyzeText: (text: string) => Promise<LogWithSegments>;
  getAllIdeas: (options?: any) => Promise<any[]>;
  updateIdeaStatus: (ideaId: number, newStatus: string) => Promise<any>;

  // Event listeners
  onAnalyzeProgress: (callback: ProgressCallback) => () => void;
  onAnalyzeComplete: (callback: CompleteCallback) => () => void;
  onAnalyzeError: (callback: ErrorCallback) => () => void;
}

/**
 * Validate that the API has all required methods
 */
function validateElectronAPI(api: unknown): api is ElectronAPI {
  if (!api || typeof api !== 'object') {
    return false;
  }

  const obj = api as any;
  return (
    typeof obj.analyzeAudio === 'function' &&
    typeof obj.analyzeText === 'function' &&
    typeof obj.getAllIdeas === 'function' &&
    typeof obj.updateIdeaStatus === 'function' &&
    typeof obj.onAnalyzeProgress === 'function' &&
    typeof obj.onAnalyzeComplete === 'function' &&
    typeof obj.onAnalyzeError === 'function'
  );
}

/**
 * Get the Electron API from the window object
 * This is injected by the preload script
 */
function getElectronAPI(): ElectronAPI {
  if (typeof window === 'undefined' || !('electron' in window)) {
    throw new Error('Electron API not found. Make sure preload script is loaded.');
  }

  const api = (window as any).electron;

  if (!validateElectronAPI(api)) {
    throw new Error('Invalid Electron API: missing required methods');
  }

  return api;
}

/**
 * IPCClient provides a clean API for renderer-side IPC communication
 */
export class IPCClient {
  private api: ElectronAPI;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private completeCallbacks: Set<CompleteCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private cleanupFunctions: Array<() => void> = [];

  constructor() {
    this.api = getElectronAPI();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for IPC events
   */
  private setupEventListeners(): void {
    // Progress updates
    const progressCleanup = this.api.onAnalyzeProgress((status, progress) => {
      this.progressCallbacks.forEach((cb) => cb(status, progress));
    });
    this.cleanupFunctions.push(progressCleanup);

    // Complete event
    const completeCleanup = this.api.onAnalyzeComplete((result, logId) => {
      this.completeCallbacks.forEach((cb) => cb(result, logId));
    });
    this.cleanupFunctions.push(completeCleanup);

    // Error event
    const errorCleanup = this.api.onAnalyzeError((error) => {
      this.errorCallbacks.forEach((cb) => cb(error));
    });
    this.cleanupFunctions.push(errorCleanup);
  }

  /**
   * Analyze audio data
   *
   * @param audioData - The audio data as ArrayBuffer (typically from MediaRecorder)
   * @returns Promise that resolves with the saved log
   *
   * @example
   * ```typescript
   * const client = new IPCClient();
   *
   * // Set up progress tracking
   * client.onProgress((status, progress) => {
   *   console.log(`${status}: ${progress}%`);
   * });
   *
   * // Analyze audio
   * const log = await client.analyzeAudio(audioBlob.arrayBuffer());
   * console.log(`Analysis complete! Log ID: ${log.id}`);
   * ```
   */
  async analyzeAudio(audioData: ArrayBuffer): Promise<LogWithSegments> {
    return this.api.analyzeAudio(audioData);
  }

  /**
   * Analyze text input
   *
   * @param text - The text to analyze
   * @returns Promise that resolves with the saved log
   *
   * @example
   * ```typescript
   * const client = new IPCClient();
   *
   * // Set up callbacks
   * client.onProgress((status, progress) => {
   *   updateProgressBar(progress);
   * });
   *
   * client.onComplete((result, logId) => {
   *   showNotification(`Analysis complete! Found ${result.segments.length} items`);
   *   refreshUI();
   * });
   *
   * // Analyze text
   * const log = await client.analyzeText("I finished the project. Need to update docs.");
   * ```
   */
  async analyzeText(text: string): Promise<LogWithSegments> {
    return this.api.analyzeText(text);
  }

  /**
   * Register a progress callback
   *
   * @param callback - Function to call on progress updates
   * @returns Cleanup function to remove the callback
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Register a complete callback
   *
   * @param callback - Function to call when analysis completes
   * @returns Cleanup function to remove the callback
   */
  onComplete(callback: CompleteCallback): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  /**
   * Register an error callback
   *
   * @param callback - Function to call on errors
   * @returns Cleanup function to remove the callback
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Get all ideas with optional filtering
   *
   * @param options - Query options for filtering ideas
   * @returns Promise that resolves with array of ideas
   *
   * @example
   * ```typescript
   * const client = new IPCClient();
   *
   * // Get all ideas
   * const allIdeas = await client.getAllIdeas();
   *
   * // Get ideas with specific status
   * const newIdeas = await client.getAllIdeas({ status: 'raw' });
   * ```
   */
  async getAllIdeas(options?: any): Promise<any[]> {
    return this.api.getAllIdeas(options);
  }

  /**
   * Update the status of an idea
   *
   * @param ideaId - The ID of the idea to update
   * @param newStatus - The new status value
   * @returns Promise that resolves with the updated idea
   *
   * @example
   * ```typescript
   * const client = new IPCClient();
   *
   * // Update idea status
   * const updatedIdea = await client.updateIdeaStatus(42, 'developing');
   * ```
   */
  async updateIdeaStatus(ideaId: number, newStatus: string): Promise<any> {
    return this.api.updateIdeaStatus(ideaId, newStatus);
  }

  /**
   * Clean up all event listeners
   * Call this when the component unmounts
   */
  cleanup(): void {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
    this.progressCallbacks.clear();
    this.completeCallbacks.clear();
    this.errorCallbacks.clear();
  }
}

/**
 * React hook for using IPC client
 *
 * @example
 * ```typescript
 * function RecorderComponent() {
 *   const ipc = useIPCClient();
 *
 *   useEffect(() => {
 *     const removeProgress = ipc.onProgress((status, progress) => {
 *       setProgress({ status, progress });
 *     });
 *
 *     const removeComplete = ipc.onComplete((result, logId) => {
 *       setResult(result);
 *       refreshLogs();
 *     });
 *
 *     return () => {
 *       removeProgress();
 *       removeComplete();
 *     };
 *   }, [ipc]);
 *
 *   const handleRecord = async (audioBlob: Blob) => {
 *     const arrayBuffer = await audioBlob.arrayBuffer();
 *     await ipc.analyzeAudio(arrayBuffer);
 *   };
 *
 *   return <RecordButton onRecord={handleRecord} />;
 * }
 * ```
 */
export function useIPCClient(): IPCClient {
  // In a real React app, this would use useMemo to avoid recreating
  // But for now, keep it simple
  return new IPCClient();
}
