import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IpcMessages, TypedIpcRenderer } from '../types/ipc';

/**
 * Preload script for FloatingRecorder window
 *
 * Exposes safe IPC communication to the renderer process
 */

// Valid send channels (renderer -> main)
const VALID_SEND_CHANNELS: readonly (keyof IpcMessages)[] = [
  'recorder:stop',
  'recorder:close'
] as const;

// Valid receive channels (main -> renderer)
const VALID_RECEIVE_CHANNELS: readonly (keyof IpcMessages)[] = [
  'recorder:state-change',
  'recorder:time-update'
] as const;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: TypedIpcRenderer = {
  send<K extends keyof IpcMessages>(
    channel: K,
    ...args: IpcMessages[K] extends void ? [] : [IpcMessages[K]]
  ): void {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, ...(args as any[]));
    }
  },

  on<K extends keyof IpcMessages>(
    channel: K,
    listener: (data: IpcMessages[K]) => void
  ): void {
    if (VALID_RECEIVE_CHANNELS.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      const subscription = (_event: IpcRendererEvent, data: IpcMessages[K]) => {
        listener(data);
      };
      ipcRenderer.on(channel, subscription);
    }
  },

  removeListener<K extends keyof IpcMessages>(
    channel: K,
    listener: (data: IpcMessages[K]) => void
  ): void {
    if (VALID_RECEIVE_CHANNELS.includes(channel)) {
      ipcRenderer.removeListener(channel, listener as any);
    }
  }
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: api
});
