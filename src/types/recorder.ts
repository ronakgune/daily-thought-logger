/**
 * Type definitions for the FloatingRecorder window
 */

/**
 * Recording states
 */
export type RecordingState = 'recording' | 'processing' | 'complete';

/**
 * Props for the FloatingRecorder component
 */
export interface FloatingRecorderProps {
  /** Initial state of the recorder */
  initialState?: RecordingState;
  /** Callback when recording is stopped */
  onStop?: () => void;
  /** Callback when window should close */
  onClose?: () => void;
}

/**
 * Recording session data
 */
export interface RecordingSession {
  /** Start time of the recording */
  startTime: number;
  /** Current elapsed time in seconds */
  elapsedTime: number;
  /** Current state */
  state: RecordingState;
}

/**
 * IPC messages for FloatingRecorder
 */
export interface FloatingRecorderIpcMessages {
  /** Stop the current recording */
  'recorder:stop': Record<string, never>;
  /** Recording state changed */
  'recorder:state-change': { state: RecordingState };
  /** Close the recorder window */
  'recorder:close': Record<string, never>;
  /** Update elapsed time */
  'recorder:time-update': { elapsedTime: number };
}
