/**
 * Example integration of FloatingRecorder into the main Electron app
 *
 * This file demonstrates how to use the FloatingRecorder window
 * in your main process.
 */

import { app, globalShortcut } from 'electron';
import {
  createFloatingRecorder,
  closeFloatingRecorder,
  isFloatingRecorderOpen,
  getFloatingRecorderWindow
} from './floating-recorder-window';

/**
 * Example: Register global shortcut to toggle recorder
 */
export function setupRecorderShortcut() {
  // Register Cmd+Shift+R (or Ctrl+Shift+R on Windows/Linux)
  const shortcut = process.platform === 'darwin' ? 'Command+Shift+R' : 'Control+Shift+R';

  const registered = globalShortcut.register(shortcut, () => {
    if (isFloatingRecorderOpen()) {
      // If already open, close it
      closeFloatingRecorder();
    } else {
      // If closed, open it and start recording
      startRecording();
    }
  });

  if (!registered) {
    console.error('Failed to register global shortcut');
  }
}

/**
 * Example: Start recording session
 */
export function startRecording() {
  // Create the floating recorder window
  createFloatingRecorder(() => {
    // This callback is called when user clicks "Done"
    stopRecording();
  });

  // TODO: Start actual audio recording
  console.log('Recording started');

  // Example: Update timer every second
  let elapsedSeconds = 0;
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    const recorder = getFloatingRecorderWindow();
    recorder.updateTime(elapsedSeconds);
  }, 1000);

  // Store the interval ID so we can clear it later
  (global as any).recorderTimerInterval = timerInterval;
}

/**
 * Example: Stop recording session
 */
export async function stopRecording() {
  // Clear the timer
  const timerInterval = (global as any).recorderTimerInterval;
  if (timerInterval) {
    clearInterval(timerInterval);
    delete (global as any).recorderTimerInterval;
  }

  // Update state to processing
  const recorder = getFloatingRecorderWindow();
  recorder.updateState('processing');

  // TODO: Stop audio recording and get the buffer
  console.log('Recording stopped, processing...');

  try {
    // Example: Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Send audio to analysis service
    // const audioBuffer = getRecordedAudio();
    // await pendingQueueService.queueForAnalysis(audioBuffer, new Date().toISOString());

    // Update state to complete
    recorder.updateState('complete');

    console.log('Recording processed successfully');

    // Window will auto-close after 2 seconds (handled by component)
  } catch (error) {
    console.error('Failed to process recording:', error);

    // On error, close the window
    closeFloatingRecorder();
  }
}

/**
 * Example: Cleanup on app quit
 */
export function cleanupRecorder() {
  // Unregister shortcuts
  globalShortcut.unregisterAll();

  // Clear any active timers
  const timerInterval = (global as any).recorderTimerInterval;
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Close the recorder window
  closeFloatingRecorder();
}

/**
 * Example: App initialization
 */
app.on('ready', () => {
  // Setup global shortcut
  setupRecorderShortcut();

  console.log('FloatingRecorder ready. Press Cmd+Shift+R to start recording.');
});

/**
 * Example: App quit cleanup
 */
app.on('will-quit', () => {
  cleanupRecorder();
});

/**
 * Example: Alternative - Create recorder from menu
 */
export function createRecorderFromMenu() {
  if (isFloatingRecorderOpen()) {
    console.log('Recorder already open');
    return;
  }

  startRecording();
}

/**
 * Example: Alternative - Create recorder from system tray
 */
export function createRecorderFromTray() {
  if (isFloatingRecorderOpen()) {
    // Focus the existing window
    const recorder = getFloatingRecorderWindow();
    // Note: The window will auto-focus when create() is called again
    recorder.create();
  } else {
    startRecording();
  }
}
