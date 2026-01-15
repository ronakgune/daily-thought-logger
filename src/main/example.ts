/**
 * Example usage of GlobalShortcutService in Electron main process
 * This file demonstrates how to integrate the global shortcut service
 * into your Electron application's main process.
 */

import { app, BrowserWindow } from 'electron';
import { getGlobalShortcutService, cleanupGlobalShortcuts } from './global-shortcut';

let mainWindow: BrowserWindow | null = null;
let recorderWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your app
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Create the floating recorder window
 */
function createRecorderWindow() {
  if (recorderWindow && !recorderWindow.isDestroyed()) {
    recorderWindow.show();
    recorderWindow.focus();
    return;
  }

  recorderWindow = new BrowserWindow({
    width: 300,
    height: 150,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load recorder UI
  recorderWindow.loadFile('recorder.html');

  recorderWindow.on('closed', () => {
    recorderWindow = null;
    // Update service state
    const shortcutService = getGlobalShortcutService();
    shortcutService.setRecordingState(false);
  });
}

/**
 * Handle global shortcut press
 */
function handleShortcutPress() {
  const shortcutService = getGlobalShortcutService();
  const isRecording = shortcutService.getRecordingState();

  if (!isRecording) {
    // First press: Open recorder and start recording
    console.log('Opening recorder window and starting recording...');
    createRecorderWindow();

    // Send message to renderer to start recording
    if (recorderWindow && !recorderWindow.isDestroyed()) {
      recorderWindow.webContents.send('recording:start');
    }
  } else {
    // Second press: Stop recording
    console.log('Stopping recording...');

    // Send message to renderer to stop recording
    if (recorderWindow && !recorderWindow.isDestroyed()) {
      recorderWindow.webContents.send('recording:stop');
    }
  }
}

/**
 * Initialize the global shortcut
 */
function initializeGlobalShortcut() {
  const shortcutService = getGlobalShortcutService('CommandOrControl+Shift+L');

  // Set the recorder window reference
  if (recorderWindow) {
    shortcutService.setRecorderWindow(recorderWindow);
  }

  // Register the shortcut
  const success = shortcutService.register(handleShortcutPress);

  if (success) {
    console.log(`Global shortcut registered: ${shortcutService.getAccelerator()}`);
  } else {
    console.error('Failed to register global shortcut');
    console.error('The shortcut may already be in use by another application');

    // Optionally show a dialog to the user
    // dialog.showErrorBox(
    //   'Shortcut Registration Failed',
    //   `Could not register ${shortcutService.getAccelerator()}. It may be in use by another application.`
    // );

    // You could try an alternative shortcut
    // const altSuccess = shortcutService.updateAccelerator('CommandOrControl+Alt+L', handleShortcutPress);
    // if (altSuccess) {
    //   console.log('Registered alternative shortcut: CommandOrControl+Alt+L');
    // }
  }
}

/**
 * App lifecycle management
 */

app.on('ready', () => {
  createMainWindow();
  initializeGlobalShortcut();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  // IMPORTANT: Clean up global shortcuts before quitting
  cleanupGlobalShortcuts();
  console.log('Global shortcuts cleaned up');
});

// Handle app quit
app.on('before-quit', () => {
  // Alternative cleanup location
  // cleanupGlobalShortcuts();
});

/**
 * IPC handlers for managing shortcuts from renderer process
 */

// Example: Allow user to change shortcut from settings
// ipcMain.handle('shortcut:update', async (event, newAccelerator: string) => {
//   const shortcutService = getGlobalShortcutService();
//   const success = shortcutService.updateAccelerator(newAccelerator, handleShortcutPress);
//   return { success, accelerator: shortcutService.getAccelerator() };
// });

// Example: Get current shortcut
// ipcMain.handle('shortcut:get', async () => {
//   const shortcutService = getGlobalShortcutService();
//   return {
//     accelerator: shortcutService.getAccelerator(),
//     isRegistered: shortcutService.isRegistered(),
//   };
// });

// Example: Check if an accelerator is available
// ipcMain.handle('shortcut:check', async (event, accelerator: string) => {
//   const shortcutService = getGlobalShortcutService();
//   return {
//     isRegistered: shortcutService.isAcceleratorRegistered(accelerator),
//   };
// });

/**
 * Advanced: Handle recording state updates from renderer
 */

// ipcMain.on('recording:started', () => {
//   const shortcutService = getGlobalShortcutService();
//   shortcutService.setRecordingState(true);
// });

// ipcMain.on('recording:stopped', () => {
//   const shortcutService = getGlobalShortcutService();
//   shortcutService.setRecordingState(false);
// });

/**
 * Tips for production use:
 *
 * 1. Persist user's shortcut preference:
 *    - Use electron-store or similar to save custom shortcuts
 *    - Load saved preference on app start
 *
 * 2. Handle conflicts gracefully:
 *    - Check if shortcut is already registered before attempting
 *    - Provide UI feedback when registration fails
 *    - Offer alternative shortcuts
 *
 * 3. Platform-specific shortcuts:
 *    - Use 'CommandOrControl' for cross-platform compatibility
 *    - Consider platform-specific alternatives (Cmd on Mac, Ctrl on Windows)
 *
 * 4. Always cleanup:
 *    - Call cleanupGlobalShortcuts() in 'will-quit' or 'before-quit'
 *    - This prevents the shortcut from remaining active after app closes
 *
 * 5. Security:
 *    - Validate any user-provided accelerator strings
 *    - Don't allow system-critical shortcuts to be registered
 */
