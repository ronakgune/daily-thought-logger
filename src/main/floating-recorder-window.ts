import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

/**
 * FloatingRecorderWindow
 *
 * Creates and manages the floating recorder window.
 *
 * Window properties:
 * - 300x150px compact size
 * - Always on top
 * - Frameless (custom title bar)
 * - No taskbar icon
 * - Positioned at top-right of screen
 *
 * IPC Events:
 * - recorder:stop - User clicked Done button
 * - recorder:close - Close the window
 */
export class FloatingRecorderWindow {
  private window: BrowserWindow | null = null;
  private onStopCallback?: () => void;

  constructor() {
    this.setupIpcHandlers();
  }

  /**
   * Create and show the floating recorder window
   */
  public create(onStop?: () => void): void {
    if (this.window) {
      this.window.focus();
      return;
    }

    this.onStopCallback = onStop;

    // Get screen dimensions for positioning
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Position at top-right with some padding
    const windowWidth = 300;
    const windowHeight = 150;
    const padding = 20;
    const x = width - windowWidth - padding;
    const y = padding;

    this.window = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      transparent: false,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Enable dragging from the title bar area
    this.window.setWindowButtonVisibility(false);

    // Load the renderer content with error handling
    const loadPromise = process.env.NODE_ENV === 'development'
      ? this.window.loadURL('http://localhost:5173/floating-recorder.html')
      : this.window.loadFile(path.join(__dirname, '../renderer/floating-recorder.html'));

    loadPromise.catch((error: Error) => {
      console.error('Failed to load floating recorder window:', error);
      // Close the window on load failure
      if (this.window && !this.window.isDestroyed()) {
        this.window.destroy();
        this.window = null;
      }
    });

    // Handle load failures
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`Floating recorder window failed to load: ${errorDescription} (${errorCode})`);
    });

    // Clean up when window is closed
    this.window.on('closed', () => {
      this.window = null;
    });

    // Prevent window from being closed by Escape key or accidental close
    this.window.on('close', (event) => {
      // Prevent accidental closes - only allow programmatic close via destroy()
      if (this.window && !this.window.isDestroyed()) {
        event.preventDefault();
      }
    });
  }

  /**
   * Close the floating recorder window
   */
  public close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
    }
  }

  /**
   * Check if the window is currently open
   */
  public isOpen(): boolean {
    return this.window !== null && !this.window.isDestroyed();
  }

  /**
   * Update the recording state
   */
  public updateState(state: 'recording' | 'processing' | 'complete'): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('recorder:state-change', { state });
    }
  }

  /**
   * Update the elapsed time
   */
  public updateTime(elapsedTime: number): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('recorder:time-update', { elapsedTime });
    }
  }

  /**
   * Setup IPC event handlers
   */
  private setupIpcHandlers(): void {
    // Handle stop recording
    ipcMain.on('recorder:stop', () => {
      if (this.onStopCallback) {
        this.onStopCallback();
      }
    });

    // Handle close window
    ipcMain.on('recorder:close', () => {
      this.close();
    });
  }

  /**
   * Clean up IPC handlers
   */
  public cleanup(): void {
    ipcMain.removeAllListeners('recorder:stop');
    ipcMain.removeAllListeners('recorder:close');
    this.close();
  }
}

// Singleton instance
let floatingRecorderWindow: FloatingRecorderWindow | null = null;

/**
 * Get or create the FloatingRecorderWindow instance
 */
export function getFloatingRecorderWindow(): FloatingRecorderWindow {
  if (!floatingRecorderWindow) {
    floatingRecorderWindow = new FloatingRecorderWindow();
  }
  return floatingRecorderWindow;
}

/**
 * Create and show the floating recorder window
 */
export function createFloatingRecorder(onStop?: () => void): void {
  const window = getFloatingRecorderWindow();
  window.create(onStop);
}

/**
 * Close the floating recorder window
 */
export function closeFloatingRecorder(): void {
  if (floatingRecorderWindow) {
    floatingRecorderWindow.close();
  }
}

/**
 * Check if the floating recorder is currently open
 */
export function isFloatingRecorderOpen(): boolean {
  return floatingRecorderWindow?.isOpen() ?? false;
}
