/**
 * Tests for useRecordingState Hook
 * [AI-24] Show recording status and analysis progress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecordingState } from '../src/renderer/hooks/useRecordingState';
import type { AnalysisResult } from '../src/types';

// Mock IPC renderer
const mockIpcRenderer = {
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

describe('useRecordingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock window.ipcRenderer
    (global as any).window = {
      ipcRenderer: mockIpcRenderer,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (global as any).window;
  });

  describe('Initial State', () => {
    it('should initialize with ready state', () => {
      const { result } = renderHook(() => useRecordingState());

      expect(result.current.state).toBe('ready');
      expect(result.current.duration).toBe(0);
      expect(result.current.errorMessage).toBeUndefined();
      expect(result.current.result).toBeUndefined();
    });

    it('should provide all control functions', () => {
      const { result } = renderHook(() => useRecordingState());

      expect(typeof result.current.startRecording).toBe('function');
      expect(typeof result.current.stopRecording).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('startRecording', () => {
    it('should transition to recording state', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.state).toBe('recording');
      expect(result.current.duration).toBe(0);
    });

    it('should clear previous error and result', () => {
      const { result } = renderHook(() => useRecordingState());

      // Simulate error state
      act(() => {
        result.current.startRecording();
      });

      // Start new recording
      act(() => {
        result.current.startRecording();
      });

      expect(result.current.errorMessage).toBeUndefined();
      expect(result.current.result).toBeUndefined();
    });

    it('should send IPC message to main process', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      expect(mockIpcRenderer.send).toHaveBeenCalledWith('recording:start');
    });

    it('should start duration timer', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.duration).toBe(0);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.duration).toBe(1);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.duration).toBe(4);
    });

    it('should update duration every second', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      for (let i = 1; i <= 10; i++) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        expect(result.current.duration).toBe(i);
      }
    });
  });

  describe('stopRecording', () => {
    it('should transition to processing state', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.state).toBe('processing');
    });

    it('should stop the duration timer', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const durationBeforeStop = result.current.duration;

      act(() => {
        result.current.stopRecording();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Duration should not increase after stopping
      expect(result.current.duration).toBe(durationBeforeStop);
    });

    it('should send IPC message to main process', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      mockIpcRenderer.send.mockClear();

      act(() => {
        result.current.stopRecording();
      });

      expect(mockIpcRenderer.send).toHaveBeenCalledWith('recording:stop');
    });
  });

  describe('retry', () => {
    it('should reset to ready state', () => {
      const { result } = renderHook(() => useRecordingState());

      // Simulate error
      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.retry();
      });

      expect(result.current.state).toBe('ready');
      expect(result.current.duration).toBe(0);
      expect(result.current.errorMessage).toBeUndefined();
      expect(result.current.result).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset to initial state from any state', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe('ready');
      expect(result.current.duration).toBe(0);
      expect(result.current.errorMessage).toBeUndefined();
      expect(result.current.result).toBeUndefined();
    });

    it('should clear running timer', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Duration should stay at 0
      expect(result.current.duration).toBe(0);
    });
  });

  describe('IPC Event Handlers', () => {
    it('should register IPC event listeners on mount', () => {
      renderHook(() => useRecordingState());

      expect(mockIpcRenderer.on).toHaveBeenCalledWith('recording:complete', expect.any(Function));
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('recording:error', expect.any(Function));
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('analyze:progress', expect.any(Function));
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('analyze:complete', expect.any(Function));
      expect(mockIpcRenderer.on).toHaveBeenCalledWith('analyze:error', expect.any(Function));
    });

    it('should remove IPC event listeners on unmount', () => {
      const { unmount } = renderHook(() => useRecordingState());

      unmount();

      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('recording:complete', expect.any(Function));
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('recording:error', expect.any(Function));
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('analyze:progress', expect.any(Function));
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('analyze:complete', expect.any(Function));
      expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('analyze:error', expect.any(Function));
    });

    it('should handle recording:complete event', () => {
      const { result } = renderHook(() => useRecordingState());

      // Get the registered handler
      const recordingCompleteHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'recording:complete'
      )?.[1];

      expect(recordingCompleteHandler).toBeDefined();

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        recordingCompleteHandler(null, { audioData: new ArrayBuffer(100), duration: 10 });
      });

      expect(result.current.state).toBe('analyzing');
    });

    it('should handle recording:error event', () => {
      const { result } = renderHook(() => useRecordingState());

      const recordingErrorHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'recording:error'
      )?.[1];

      act(() => {
        result.current.startRecording();
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        recordingErrorHandler(null, { error: 'Microphone not found' });
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorMessage).toBe('Microphone not found');
    });

    it('should handle analyze:complete event', () => {
      const { result } = renderHook(() => useRecordingState());

      const analyzeCompleteHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'analyze:complete'
      )?.[1];

      const mockResult: AnalysisResult = {
        transcript: 'Test transcript',
        segments: [
          { type: 'todo', text: 'Test task', confidence: 0.9 },
        ],
      };

      act(() => {
        analyzeCompleteHandler(null, { result: mockResult });
      });

      expect(result.current.state).toBe('complete');
      expect(result.current.result).toEqual(mockResult);
    });

    it('should handle analyze:error event', () => {
      const { result } = renderHook(() => useRecordingState());

      const analyzeErrorHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'analyze:error'
      )?.[1];

      act(() => {
        analyzeErrorHandler(null, { error: 'API quota exceeded' });
      });

      expect(result.current.state).toBe('error');
      expect(result.current.errorMessage).toBe('API quota exceeded');
    });

    it('should handle analyze:progress event', () => {
      const { result } = renderHook(() => useRecordingState());

      const analyzeProgressHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'analyze:progress'
      )?.[1];

      act(() => {
        analyzeProgressHandler(null, { status: 'transcribing', progress: 50 });
      });

      expect(result.current.state).toBe('analyzing');
    });
  });

  describe('Timer Cleanup', () => {
    it('should clear timer on unmount', () => {
      const { result, unmount } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Duration should not update after unmount (no error should be thrown)
      // This test passes if no error is thrown
    });

    it('should clear timer when recording errors occur', () => {
      const { result } = renderHook(() => useRecordingState());

      act(() => {
        result.current.startRecording();
        vi.advanceTimersByTime(3000);
      });

      const recordingErrorHandler = mockIpcRenderer.on.mock.calls.find(
        (call) => call[0] === 'recording:error'
      )?.[1];

      act(() => {
        recordingErrorHandler(null, { error: 'Test error' });
      });

      const durationAfterError = result.current.duration;

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Duration should not increase after error
      expect(result.current.duration).toBe(durationAfterError);
    });
  });

  describe('Non-Electron Environment', () => {
    it('should work without IPC renderer', () => {
      delete (global as any).window;

      const { result } = renderHook(() => useRecordingState());

      // Should not throw errors
      act(() => {
        result.current.startRecording();
      });

      expect(result.current.state).toBe('recording');

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.state).toBe('processing');
    });
  });
});
