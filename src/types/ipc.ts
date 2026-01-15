/**
 * Type definitions for IPC communication between main and renderer processes
 */

import type { RecordingState } from './recorder';

/**
 * IPC channel names
 */
export const IPC_CHANNELS = {
  RECORDER_STOP: 'recorder:stop',
  RECORDER_CLOSE: 'recorder:close',
  RECORDER_STATE_CHANGE: 'recorder:state-change',
  RECORDER_TIME_UPDATE: 'recorder:time-update',
} as const;

/**
 * IPC message payloads
 */
export interface IpcMessages {
  [IPC_CHANNELS.RECORDER_STOP]: void;
  [IPC_CHANNELS.RECORDER_CLOSE]: void;
  [IPC_CHANNELS.RECORDER_STATE_CHANGE]: { state: RecordingState };
  [IPC_CHANNELS.RECORDER_TIME_UPDATE]: { elapsedTime: number };
}

/**
 * Type-safe IPC renderer interface
 */
export interface TypedIpcRenderer {
  send<K extends keyof IpcMessages>(
    channel: K,
    ...args: IpcMessages[K] extends void ? [] : [IpcMessages[K]]
  ): void;

  on<K extends keyof IpcMessages>(
    channel: K,
    listener: (data: IpcMessages[K]) => void
  ): void;

  removeListener<K extends keyof IpcMessages>(
    channel: K,
    listener: (data: IpcMessages[K]) => void
  ): void;
}

/**
 * Window electron API exposed via preload script
 */
export interface ElectronAPI {
  ipcRenderer: TypedIpcRenderer;
}

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
