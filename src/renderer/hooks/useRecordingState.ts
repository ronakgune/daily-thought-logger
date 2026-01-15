/**
 * useRecordingState Hook
 * [AI-24] Show recording status and analysis progress
 *
 * Custom hook for managing recording state, duration timer, and IPC events
 * for the recording and analysis workflow.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RecordingState } from '../components/RecordingStatus';
import type { AnalysisResult } from '../../types';

/**
 * Hook return type
 */
export interface UseRecordingStateReturn {
  /** Current recording/analysis state */
  state: RecordingState;
  /** Recording duration in seconds */
  duration: number;
  /** Error message if state is 'error' */
  errorMessage?: string;
  /** Analysis result when complete */
  result?: AnalysisResult;
  /** Start a new recording */
  startRecording: () => void;
  /** Stop the current recording */
  stopRecording: () => void;
  /** Retry after an error */
  retry: () => void;
  /** Reset to ready state */
  reset: () => void;
}

/**
 * IPC channel names (matching Phase 2 types)
 */
const IPC_CHANNELS = {
  RECORDING_START: 'recording:start',
  RECORDING_STOP: 'recording:stop',
  RECORDING_COMPLETE: 'recording:complete',
  RECORDING_ERROR: 'recording:error',
  ANALYZE_START: 'analyze:start',
  ANALYZE_PROGRESS: 'analyze:progress',
  ANALYZE_COMPLETE: 'analyze:complete',
  ANALYZE_ERROR: 'analyze:error',
} as const;

/**
 * Custom hook for managing recording state and lifecycle
 *
 * Handles:
 * - Recording state transitions
 * - Real-time duration tracking
 * - IPC event listeners for main process communication
 * - Error handling and retry logic
 *
 * @returns Recording state and control functions
 */
export function useRecordingState(): UseRecordingStateReturn {
  const [state, setState] = useState<RecordingState>('ready');
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [result, setResult] = useState<AnalysisResult>();

  // Timer ref for duration tracking
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  /**
   * Start recording
   */
  const startRecording = useCallback(() => {
    setState('recording');
    setDuration(0);
    setErrorMessage(undefined);
    setResult(undefined);

    // Start duration timer
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Notify main process (if IPC available)
    if (typeof window !== 'undefined' && (window as any).ipcRenderer) {
      (window as any).ipcRenderer.send(IPC_CHANNELS.RECORDING_START);
    }
  }, []);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    setState('processing');

    // Notify main process (if IPC available)
    if (typeof window !== 'undefined' && (window as any).ipcRenderer) {
      (window as any).ipcRenderer.send(IPC_CHANNELS.RECORDING_STOP);
    }
  }, []);

  /**
   * Retry after error
   */
  const retry = useCallback(() => {
    setState('ready');
    setDuration(0);
    setErrorMessage(undefined);
    setResult(undefined);
  }, []);

  /**
   * Reset to ready state
   */
  const reset = useCallback(() => {
    // Clear timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    setState('ready');
    setDuration(0);
    setErrorMessage(undefined);
    setResult(undefined);
  }, []);

  /**
   * Set up IPC event listeners
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ipcRenderer) {
      // Not in Electron environment, skip IPC setup
      return;
    }

    const ipc = (window as any).ipcRenderer;

    // Recording complete handler
    const handleRecordingComplete = (_event: any, data: { audioData: ArrayBuffer; duration: number }) => {
      setState('analyzing');
      // Main process will automatically trigger analysis
    };

    // Recording error handler
    const handleRecordingError = (_event: any, data: { error: string }) => {
      setState('error');
      setErrorMessage(data.error);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };

    // Analysis progress handler
    const handleAnalyzeProgress = (_event: any, data: { status: string; progress?: number }) => {
      // Could update with more granular progress if needed
      setState('analyzing');
    };

    // Analysis complete handler
    const handleAnalyzeComplete = (_event: any, data: { result: AnalysisResult }) => {
      setState('complete');
      setResult(data.result);
    };

    // Analysis error handler
    const handleAnalyzeError = (_event: any, data: { error: string }) => {
      setState('error');
      setErrorMessage(data.error);
    };

    // Register listeners
    ipc.on(IPC_CHANNELS.RECORDING_COMPLETE, handleRecordingComplete);
    ipc.on(IPC_CHANNELS.RECORDING_ERROR, handleRecordingError);
    ipc.on(IPC_CHANNELS.ANALYZE_PROGRESS, handleAnalyzeProgress);
    ipc.on(IPC_CHANNELS.ANALYZE_COMPLETE, handleAnalyzeComplete);
    ipc.on(IPC_CHANNELS.ANALYZE_ERROR, handleAnalyzeError);

    // Cleanup listeners on unmount
    return () => {
      ipc.removeListener(IPC_CHANNELS.RECORDING_COMPLETE, handleRecordingComplete);
      ipc.removeListener(IPC_CHANNELS.RECORDING_ERROR, handleRecordingError);
      ipc.removeListener(IPC_CHANNELS.ANALYZE_PROGRESS, handleAnalyzeProgress);
      ipc.removeListener(IPC_CHANNELS.ANALYZE_COMPLETE, handleAnalyzeComplete);
      ipc.removeListener(IPC_CHANNELS.ANALYZE_ERROR, handleAnalyzeError);

      // Clear timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    state,
    duration,
    errorMessage,
    result,
    startRecording,
    stopRecording,
    retry,
    reset,
  };
}
