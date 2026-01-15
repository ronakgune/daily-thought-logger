import React, { useState, useEffect, useCallback } from 'react';
import type { RecordingState, RecordingSession } from '@types/recorder';
import { IPC_CHANNELS } from '@types/ipc';

/**
 * FloatingRecorder Component
 *
 * A compact floating window that displays recording status, timer, and controls.
 *
 * States:
 * - recording: Shows pulsing indicator and running timer
 * - processing: Shows analyzing message
 * - complete: Shows brief success message before auto-closing
 *
 * Features:
 * - Compact 300x150px design
 * - Pulsing recording indicator
 * - Real-time timer display
 * - Done button to stop recording
 * - Auto-close after success (2 seconds)
 * - Frameless with custom title bar
 */
export const FloatingRecorder: React.FC = () => {
  const [session, setSession] = useState<RecordingSession>({
    startTime: Date.now(),
    elapsedTime: 0,
    state: 'recording'
  });

  // IPC listeners effect - listen for state and time updates from main process
  useEffect(() => {
    if (!window.electron?.ipcRenderer) {
      return;
    }

    // Handler for state changes
    const handleStateChange = (data: { state: RecordingState }) => {
      setSession(prev => ({ ...prev, state: data.state }));
    };

    // Handler for time updates
    const handleTimeUpdate = (data: { elapsedTime: number }) => {
      setSession(prev => ({ ...prev, elapsedTime: data.elapsedTime }));
    };

    // Register listeners
    window.electron.ipcRenderer.on(IPC_CHANNELS.RECORDER_STATE_CHANGE, handleStateChange);
    window.electron.ipcRenderer.on(IPC_CHANNELS.RECORDER_TIME_UPDATE, handleTimeUpdate);

    // Cleanup listeners on unmount
    return () => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeListener(IPC_CHANNELS.RECORDER_STATE_CHANGE, handleStateChange);
        window.electron.ipcRenderer.removeListener(IPC_CHANNELS.RECORDER_TIME_UPDATE, handleTimeUpdate);
      }
    };
  }, []);

  // Timer effect - updates every second while recording (fallback for standalone testing)
  useEffect(() => {
    if (session.state !== 'recording') {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      setSession(prev => ({ ...prev, elapsedTime: elapsed }));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.state, session.startTime]);

  // Auto-close effect when complete
  useEffect(() => {
    if (session.state === 'complete') {
      const timeout = setTimeout(() => {
        handleClose();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [session.state]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle stop button click
  const handleStop = useCallback(() => {
    // Send IPC message to main process (if available)
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send(IPC_CHANNELS.RECORDER_STOP);
    } else {
      // Fallback for standalone testing
      setSession(prev => ({ ...prev, state: 'processing' }));
      setTimeout(() => {
        setSession(prev => ({ ...prev, state: 'complete' }));
      }, 1500);
    }
  }, []);

  // Handle window close
  const handleClose = useCallback(() => {
    // Send IPC message to main process (if available)
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send(IPC_CHANNELS.RECORDER_CLOSE);
    }
  }, []);

  // Get state-specific content
  const getStateContent = () => {
    switch (session.state) {
      case 'recording':
        return {
          indicator: 'bg-red-500 animate-pulse',
          message: 'Recording...',
          showTimer: true,
          showButton: true
        };
      case 'processing':
        return {
          indicator: 'bg-yellow-500 animate-pulse',
          message: 'Analyzing...',
          showTimer: false,
          showButton: false
        };
      case 'complete':
        return {
          indicator: 'bg-green-500',
          message: 'Complete!',
          showTimer: false,
          showButton: false
        };
    }
  };

  const content = getStateContent();

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Custom Title Bar */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200 drag-area">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${content.indicator}`} />
          <span className="text-sm font-medium text-gray-700">{content.message}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Timer Display */}
        {content.showTimer && (
          <div className="text-4xl font-mono font-bold text-gray-800 mb-6">
            {formatTime(session.elapsedTime)}
          </div>
        )}

        {/* Processing/Complete Message */}
        {!content.showTimer && (
          <div className="text-2xl font-medium text-gray-700 mb-4">
            {content.message}
          </div>
        )}

        {/* Done Button */}
        {content.showButton && (
          <button
            onClick={handleStop}
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            aria-label="Stop recording"
          >
            Done
          </button>
        )}

        {/* Processing Spinner */}
        {session.state === 'processing' && (
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        )}

        {/* Success Checkmark */}
        {session.state === 'complete' && (
          <div className="text-green-500 text-5xl">✓</div>
        )}
      </div>
    </div>
  );
};
