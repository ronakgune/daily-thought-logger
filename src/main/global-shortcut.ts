/**
 * Global Shortcut Service for Daily Thought Logger
 * Handles registration and management of global keyboard shortcuts
 */

import { globalShortcut, BrowserWindow } from 'electron';

export interface ShortcutConfig {
  /** The keyboard shortcut to register (e.g., 'CommandOrControl+Shift+L') */
  accelerator: string;
  /** Whether the shortcut is currently enabled */
  enabled: boolean;
}

export interface ShortcutState {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Reference to the floating recorder window */
  recorderWindow: BrowserWindow | null;
}

/**
 * Service for managing global keyboard shortcuts
 * Handles Cmd+Shift+L (or configurable shortcut) to trigger recording from anywhere
 */
export class GlobalShortcutService {
  private config: ShortcutConfig;
  private state: ShortcutState;
  private onShortcutPressed?: () => void;

  constructor(accelerator: string = 'CommandOrControl+Shift+L') {
    this.config = {
      accelerator,
      enabled: false,
    };

    this.state = {
      isRecording: false,
      recorderWindow: null,
    };
  }

  /**
   * Register the global shortcut
   * @param callback Function to call when shortcut is pressed
   * @returns True if registration succeeded, false otherwise
   */
  register(callback: () => void): boolean {
    if (this.config.enabled) {
      console.warn('Global shortcut already registered');
      return true;
    }

    try {
      const success = globalShortcut.register(this.config.accelerator, () => {
        this.handleShortcutPress();
      });

      if (success) {
        this.config.enabled = true;
        this.onShortcutPressed = callback;
        console.log(`Global shortcut registered: ${this.config.accelerator}`);
        return true;
      } else {
        console.error(`Failed to register global shortcut: ${this.config.accelerator}`);
        console.error('This shortcut may already be in use by another application');
        return false;
      }
    } catch (error) {
      console.error('Error registering global shortcut:', error);
      return false;
    }
  }

  /**
   * Unregister the global shortcut
   */
  unregister(): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      globalShortcut.unregister(this.config.accelerator);
      console.log(`Global shortcut unregistered: ${this.config.accelerator}`);
    } catch (error) {
      console.error('Error unregistering global shortcut:', error);
    } finally {
      // Always update state, even if unregister fails
      this.config.enabled = false;
      this.onShortcutPressed = undefined;
    }
  }

  /**
   * Unregister all global shortcuts
   * Should be called on app quit
   */
  unregisterAll(): void {
    try {
      globalShortcut.unregisterAll();
      console.log('All global shortcuts unregistered');
    } catch (error) {
      console.error('Error unregistering all shortcuts:', error);
    } finally {
      // Always update state, even if unregister fails
      this.config.enabled = false;
      this.onShortcutPressed = undefined;
    }
  }

  /**
   * Handle shortcut press event
   * First press: Open recorder and start recording
   * Second press (while recording): Stop recording
   */
  private handleShortcutPress(): void {
    console.log(`Global shortcut pressed: ${this.config.accelerator}`);

    if (this.onShortcutPressed) {
      this.onShortcutPressed();
    }

    // Toggle recording state
    if (this.state.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Start recording
   * Opens the floating recorder window if not already open
   */
  private startRecording(): void {
    console.log('Starting recording via global shortcut');
    this.state.isRecording = true;

    // Create or show recorder window
    if (!this.state.recorderWindow || this.state.recorderWindow.isDestroyed()) {
      // Window creation will be handled by the main process
      // This service just tracks state
      console.log('Recorder window needs to be created');
    } else {
      this.state.recorderWindow.show();
      this.state.recorderWindow.focus();
    }
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    console.log('Stopping recording via global shortcut');
    this.state.isRecording = false;

    // Recording stop will be handled by the recorder window
    // This service just tracks state
  }

  /**
   * Set the recorder window reference
   * @param window The recorder window
   */
  setRecorderWindow(window: BrowserWindow | null): void {
    this.state.recorderWindow = window;
  }

  /**
   * Set the recording state
   * @param isRecording Whether recording is active
   */
  setRecordingState(isRecording: boolean): void {
    this.state.isRecording = isRecording;
  }

  /**
   * Get the current shortcut accelerator
   */
  getAccelerator(): string {
    return this.config.accelerator;
  }

  /**
   * Check if shortcut is currently registered
   */
  isRegistered(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the current recording state
   */
  getRecordingState(): boolean {
    return this.state.isRecording;
  }

  /**
   * Check if a specific accelerator is registered by any application
   * @param accelerator The accelerator to check
   */
  isAcceleratorRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Update the shortcut accelerator
   * Unregisters the old shortcut and registers the new one
   * @param accelerator The new accelerator
   * @param callback The callback function
   * @returns True if successful, false otherwise
   */
  updateAccelerator(accelerator: string, callback: () => void): boolean {
    if (this.config.enabled) {
      this.unregister();
    }

    this.config.accelerator = accelerator;
    return this.register(callback);
  }
}

// Singleton instance
let globalShortcutService: GlobalShortcutService | null = null;

/**
 * Get the global shortcut service instance
 * @param accelerator Optional accelerator (only used on first call)
 */
export function getGlobalShortcutService(accelerator?: string): GlobalShortcutService {
  if (!globalShortcutService) {
    globalShortcutService = new GlobalShortcutService(accelerator);
  }
  return globalShortcutService;
}

/**
 * Cleanup function to unregister all shortcuts
 * Should be called before app quit
 */
export function cleanupGlobalShortcuts(): void {
  if (globalShortcutService) {
    globalShortcutService.unregisterAll();
    globalShortcutService = null;
  }
}
