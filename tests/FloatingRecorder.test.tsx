import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingRecorder } from '../src/renderer/components/FloatingRecorder';
import { IPC_CHANNELS } from '../src/types/ipc';
import type { RecordingState } from '../src/types/recorder';

/**
 * Mock window.electron API
 */
interface MockElectronAPI {
  ipcRenderer: {
    send: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
}

describe('FloatingRecorder Component', () => {
  let mockElectron: MockElectronAPI;
  let stateChangeListeners: Map<string, (data: { state: RecordingState }) => void>;
  let timeUpdateListeners: Map<string, (data: { elapsedTime: number }) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    stateChangeListeners = new Map();
    timeUpdateListeners = new Map();

    // Mock electron IPC
    mockElectron = {
      ipcRenderer: {
        send: vi.fn(),
        on: vi.fn((channel: string, listener: any) => {
          if (channel === IPC_CHANNELS.RECORDER_STATE_CHANGE) {
            stateChangeListeners.set('handler', listener);
          } else if (channel === IPC_CHANNELS.RECORDER_TIME_UPDATE) {
            timeUpdateListeners.set('handler', listener);
          }
        }),
        removeListener: vi.fn((channel: string) => {
          if (channel === IPC_CHANNELS.RECORDER_STATE_CHANGE) {
            stateChangeListeners.delete('handler');
          } else if (channel === IPC_CHANNELS.RECORDER_TIME_UPDATE) {
            timeUpdateListeners.delete('handler');
          }
        })
      }
    };

    // Set up window.electron
    (window as any).electron = mockElectron;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (window as any).electron;
  });

  describe('Rendering', () => {
    it('should render with initial recording state', () => {
      render(<FloatingRecorder />);

      expect(screen.getByText('Recording...')).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    it('should display timer in MM:SS format', () => {
      render(<FloatingRecorder />);

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should show Done button in recording state', () => {
      render(<FloatingRecorder />);

      const button = screen.getByRole('button', { name: /stop recording/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-500');
    });
  });

  describe('IPC Listeners', () => {
    it('should register IPC listeners on mount', () => {
      render(<FloatingRecorder />);

      expect(mockElectron.ipcRenderer.on).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_STATE_CHANGE,
        expect.any(Function)
      );
      expect(mockElectron.ipcRenderer.on).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_TIME_UPDATE,
        expect.any(Function)
      );
    });

    it('should remove IPC listeners on unmount', () => {
      const { unmount } = render(<FloatingRecorder />);

      unmount();

      expect(mockElectron.ipcRenderer.removeListener).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_STATE_CHANGE,
        expect.any(Function)
      );
      expect(mockElectron.ipcRenderer.removeListener).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_TIME_UPDATE,
        expect.any(Function)
      );
    });

    it('should update state when receiving state-change event', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      expect(listener).toBeDefined();

      act(() => {
        listener!({ state: 'processing' });
      });

      // "Analyzing..." appears in both title bar and main content
      const analyzingElements = screen.getAllByText('Analyzing...');
      expect(analyzingElements.length).toBeGreaterThan(0);
    });

    it('should update time when receiving time-update event', () => {
      render(<FloatingRecorder />);

      const listener = timeUpdateListeners.get('handler');
      expect(listener).toBeDefined();

      act(() => {
        listener!({ elapsedTime: 65 }); // 1 minute 5 seconds
      });

      expect(screen.getByText('01:05')).toBeInTheDocument();
    });
  });

  describe('Timer Display', () => {
    it('should format time correctly for seconds', () => {
      render(<FloatingRecorder />);

      const listener = timeUpdateListeners.get('handler');

      act(() => {
        listener!({ elapsedTime: 5 });
      });

      expect(screen.getByText('00:05')).toBeInTheDocument();
    });

    it('should format time correctly for minutes', () => {
      render(<FloatingRecorder />);

      const listener = timeUpdateListeners.get('handler');

      act(() => {
        listener!({ elapsedTime: 125 }); // 2:05
      });

      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('should update timer every second when recording (fallback)', () => {
      delete (window as any).electron;

      render(<FloatingRecorder />);

      expect(screen.getByText('00:00')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('00:01')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('00:02')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from recording to processing', () => {
      render(<FloatingRecorder />);

      expect(screen.getByText('Recording...')).toBeInTheDocument();

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'processing' });
      });

      const analyzingElements = screen.getAllByText('Analyzing...');
      expect(analyzingElements.length).toBeGreaterThan(0);
      expect(screen.queryByText('00:00')).not.toBeInTheDocument();
    });

    it('should transition from processing to complete', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');

      act(() => {
        listener!({ state: 'processing' });
      });

      expect(screen.getAllByText('Analyzing...').length).toBeGreaterThan(0);

      act(() => {
        listener!({ state: 'complete' });
      });

      const completeElements = screen.getAllByText('Complete!');
      expect(completeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should show spinner in processing state', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'processing' });
      });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide Done button in processing state', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'processing' });
      });

      expect(screen.queryByRole('button', { name: /stop recording/i })).not.toBeInTheDocument();
    });

    it('should hide Done button in complete state', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'complete' });
      });

      expect(screen.queryByRole('button', { name: /stop recording/i })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should send IPC message when Done button is clicked', () => {
      render(<FloatingRecorder />);

      const button = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(button);

      expect(mockElectron.ipcRenderer.send).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_STOP
      );
    });

    it('should handle click when electron is not available (fallback)', async () => {
      delete (window as any).electron;

      render(<FloatingRecorder />);

      const button = screen.getByRole('button', { name: /stop recording/i });

      act(() => {
        fireEvent.click(button);
      });

      // Should show processing state
      expect(screen.getAllByText('Analyzing...').length).toBeGreaterThan(0);

      // Wait for simulated processing to complete
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getAllByText('Complete!').length).toBeGreaterThan(0);
    });
  });

  describe('Auto-close Behavior', () => {
    it('should auto-close 2 seconds after completion', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');

      act(() => {
        listener!({ state: 'complete' });
      });

      expect(screen.getAllByText('Complete!').length).toBeGreaterThan(0);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockElectron.ipcRenderer.send).toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_CLOSE
      );
    });

    it('should not auto-close before 2 seconds', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');

      act(() => {
        listener!({ state: 'complete' });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockElectron.ipcRenderer.send).not.toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_CLOSE
      );
    });

    it('should cleanup auto-close timer on unmount', () => {
      const { unmount } = render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'complete' });
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not send close message after unmount
      expect(mockElectron.ipcRenderer.send).not.toHaveBeenCalledWith(
        IPC_CHANNELS.RECORDER_CLOSE
      );
    });
  });

  describe('Visual Indicators', () => {
    it('should show red pulsing indicator in recording state', () => {
      render(<FloatingRecorder />);

      const indicator = document.querySelector('.bg-red-500.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });

    it('should show yellow pulsing indicator in processing state', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'processing' });
      });

      const indicator = document.querySelector('.bg-yellow-500.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });

    it('should show green indicator in complete state', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');
      act(() => {
        listener!({ state: 'complete' });
      });

      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing electron API gracefully', () => {
      delete (window as any).electron;

      expect(() => render(<FloatingRecorder />)).not.toThrow();
    });

    it('should handle rapid state changes', () => {
      render(<FloatingRecorder />);

      const listener = stateChangeListeners.get('handler');

      act(() => {
        listener!({ state: 'recording' });
        listener!({ state: 'processing' });
        listener!({ state: 'complete' });
      });

      expect(screen.getAllByText('Complete!').length).toBeGreaterThan(0);
    });

    it('should handle time updates for large values', () => {
      render(<FloatingRecorder />);

      const listener = timeUpdateListeners.get('handler');

      act(() => {
        listener!({ elapsedTime: 3661 }); // 61 minutes, 1 second
      });

      expect(screen.getByText('61:01')).toBeInTheDocument();
    });
  });
});
