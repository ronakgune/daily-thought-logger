/**
 * Main Process Entry Point
 * AI-23: Wire recording/text to analysis pipeline
 *
 * This is the main process entry point for the Electron app.
 * It initializes the database and sets up IPC handlers.
 */

export { IPCHandlers, initializeIPCHandlers, type AudioStorageConfig } from './ipc-handlers';

/**
 * Example main.ts for reference:
 *
 * ```typescript
 * import { app, BrowserWindow } from 'electron';
 * import * as path from 'path';
 * import { DatabaseService } from './services/database';
 * import { initializeIPCHandlers } from './main';
 *
 * let mainWindow: BrowserWindow | null = null;
 * let ipcHandlers: IPCHandlers | null = null;
 *
 * async function createWindow() {
 *   mainWindow = new BrowserWindow({
 *     width: 800,
 *     height: 600,
 *     webPreferences: {
 *       preload: path.join(__dirname, 'main/preload.js'),
 *       contextIsolation: true,
 *       nodeIntegration: false,
 *     },
 *   });
 *
 *   // Load the app
 *   await mainWindow.loadFile('index.html');
 * }
 *
 * app.whenReady().then(async () => {
 *   // Initialize database
 *   const db = new DatabaseService();
 *
 *   // Initialize IPC handlers
 *   ipcHandlers = initializeIPCHandlers(db);
 *
 *   // Create window
 *   await createWindow();
 * });
 *
 * app.on('window-all-closed', () => {
 *   if (process.platform !== 'darwin') {
 *     app.quit();
 *   }
 * });
 *
 * app.on('before-quit', () => {
 *   // Cleanup
 *   if (ipcHandlers) {
 *     ipcHandlers.unregisterHandlers();
 *   }
 * });
 * ```
 */
