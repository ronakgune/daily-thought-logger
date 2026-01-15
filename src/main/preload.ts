import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script for FloatingRecorder window
 *
 * Exposes safe IPC communication to the renderer process
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send(channel: string, ...args: any[]) {
      // Whitelist channels
      const validChannels = ['recorder:stop', 'recorder:close'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on(channel: string, func: (...args: any[]) => void) {
      const validChannels = ['recorder:state-change', 'recorder:time-update'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        const subscription = (_event: any, ...args: any[]) => func(...args);
        ipcRenderer.on(channel, subscription);
      }
    },
    removeListener(channel: string, func: (...args: any[]) => void) {
      const validChannels = ['recorder:state-change', 'recorder:time-update'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
});
