/**
 * Preload Script for Electron
 * AI-23: Wire recording/text to analysis pipeline
 *
 * This script runs in a privileged context and exposes a safe API to the renderer.
 * It bridges the gap between the renderer's isolated context and Node.js/Electron APIs.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { AnalysisResult } from '../types';
import type { LogWithSegments } from '../types/database';

/**
 * Type-safe IPC API exposed to renderer
 */
const electronAPI = {
  /**
   * Analyze audio data
   * @param audioData - Audio data as ArrayBuffer
   * @returns Promise resolving to the saved log with segments
   */
  analyzeAudio: async (audioData: ArrayBuffer): Promise<LogWithSegments> => {
    return ipcRenderer.invoke('analyze:audio', { audioData });
  },

  /**
   * Analyze text input
   * @param text - Text to analyze
   * @returns Promise resolving to the saved log with segments
   */
  analyzeText: async (text: string): Promise<LogWithSegments> => {
    return ipcRenderer.invoke('analyze:text', { text });
  },

  /**
   * Listen for progress updates
   * @param callback - Function to call on progress updates
   * @returns Cleanup function to remove the listener
   */
  onAnalyzeProgress: (
    callback: (status: string, progress: number) => void
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { status: string; progress: number }
    ) => {
      callback(data.status, data.progress);
    };

    ipcRenderer.on('analyze:progress', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('analyze:progress', listener);
    };
  },

  /**
   * Listen for analysis completion
   * @param callback - Function to call when analysis completes
   * @returns Cleanup function to remove the listener
   */
  onAnalyzeComplete: (
    callback: (result: AnalysisResult, logId: number) => void
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { result: AnalysisResult; logId: number }
    ) => {
      callback(data.result, data.logId);
    };

    ipcRenderer.on('analyze:complete', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('analyze:complete', listener);
    };
  },

  /**
   * Listen for analysis errors
   * @param callback - Function to call on errors
   * @returns Cleanup function to remove the listener
   */
  onAnalyzeError: (callback: (error: string) => void): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { error: string }
    ) => {
      callback(data.error);
    };

    ipcRenderer.on('analyze:error', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('analyze:error', listener);
    };
  },
};

/**
 * Expose the API to the renderer process via contextBridge
 * This is the secure way to expose Node.js functionality to the renderer
 */
contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * TypeScript type declaration for the window object
 * This should be placed in a .d.ts file in production
 */
declare global {
  interface Window {
    electron: typeof electronAPI;
  }
}
