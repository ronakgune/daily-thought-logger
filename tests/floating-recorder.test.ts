import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserWindow } from 'electron';
import {
  FloatingRecorderWindow,
  getFloatingRecorderWindow,
  createFloatingRecorder,
  closeFloatingRecorder,
  isFloatingRecorderOpen
} from '../src/main/floating-recorder-window';

// Mock Electron modules
vi.mock('electron', () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    focus: vi.fn(),
    setWindowButtonVisibility: vi.fn(),
    webContents: {
      send: vi.fn()
    }
  })),
  ipcMain: {
    on: vi.fn(),
    removeAllListeners: vi.fn()
  },
  screen: {
    getPrimaryDisplay: vi.fn().mockReturnValue({
      workAreaSize: {
        width: 1920,
        height: 1080
      }
    })
  }
}));

describe('FloatingRecorder Window', () => {
  describe('FloatingRecorderWindow Class', () => {
    let recorderWindow: FloatingRecorderWindow;

    beforeEach(() => {
      vi.clearAllMocks();
      recorderWindow = new FloatingRecorderWindow();
    });

    afterEach(() => {
      recorderWindow.cleanup();
    });

    it('should create a window with correct properties', () => {
      recorderWindow.create();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 300,
          height: 150,
          frame: false,
          alwaysOnTop: true,
          skipTaskbar: true,
          resizable: false,
          minimizable: false,
          maximizable: false,
          fullscreenable: false
        })
      );
    });

    it('should position window at top-right of screen', () => {
      recorderWindow.create();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 1920 - 300 - 20, // width - windowWidth - padding
          y: 20 // padding
        })
      );
    });

    it('should focus existing window instead of creating new one', () => {
      const mockFocus = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        focus: mockFocus,
        setWindowButtonVisibility: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorderWindow.create();
      recorderWindow.create(); // Second call should focus

      expect(mockFocus).toHaveBeenCalled();
      expect(BrowserWindow).toHaveBeenCalledTimes(1);
    });

    it('should close the window', () => {
      const mockDestroy = vi.fn();
      const mockIsDestroyed = vi.fn().mockReturnValue(false);
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: mockDestroy,
        isDestroyed: mockIsDestroyed,
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorderWindow.create();
      recorderWindow.close();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should report open status correctly', () => {
      const mockIsDestroyed = vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: mockIsDestroyed,
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      expect(recorderWindow.isOpen()).toBe(false);

      recorderWindow.create();
      expect(recorderWindow.isOpen()).toBe(true);

      expect(recorderWindow.isOpen()).toBe(false);
    });

    it('should call onStop callback when stop event received', () => {
      const onStopCallback = vi.fn();
      const { ipcMain } = require('electron');

      recorderWindow.create(onStopCallback);

      // Find the 'recorder:stop' handler
      const stopHandler = (ipcMain.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'recorder:stop'
      )?.[1];

      expect(stopHandler).toBeDefined();

      // Simulate stop event
      stopHandler();

      expect(onStopCallback).toHaveBeenCalled();
    });

    it('should update recording state', () => {
      const mockSend = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: mockSend }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorderWindow.create();
      recorderWindow.updateState('processing');

      expect(mockSend).toHaveBeenCalledWith('recorder:state-change', {
        state: 'processing'
      });
    });

    it('should update elapsed time', () => {
      const mockSend = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: mockSend }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorderWindow.create();
      recorderWindow.updateTime(42);

      expect(mockSend).toHaveBeenCalledWith('recorder:time-update', {
        elapsedTime: 42
      });
    });

    it('should not update state if window is destroyed', () => {
      const mockSend = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(true),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: mockSend }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorderWindow.create();
      recorderWindow.updateState('complete');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should cleanup IPC handlers on cleanup', () => {
      const { ipcMain } = require('electron');

      recorderWindow.create();
      recorderWindow.cleanup();

      expect(ipcMain.removeAllListeners).toHaveBeenCalledWith('recorder:stop');
      expect(ipcMain.removeAllListeners).toHaveBeenCalledWith('recorder:close');
    });
  });

  describe('Singleton Functions', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return singleton instance', () => {
      const instance1 = getFloatingRecorderWindow();
      const instance2 = getFloatingRecorderWindow();

      expect(instance1).toBe(instance2);
    });

    it('should create floating recorder window', () => {
      const onStop = vi.fn();
      createFloatingRecorder(onStop);

      expect(BrowserWindow).toHaveBeenCalled();
    });

    it('should close floating recorder window', () => {
      const mockDestroy = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: mockDestroy,
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      createFloatingRecorder();
      closeFloatingRecorder();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should check if floating recorder is open', () => {
      expect(isFloatingRecorderOpen()).toBe(false);

      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      createFloatingRecorder();
      expect(isFloatingRecorderOpen()).toBe(true);
    });
  });

  describe('Window Configuration', () => {
    it('should load development URL in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockLoadURL = vi.fn();
      const mockWindow = {
        loadURL: mockLoadURL,
        loadFile: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      const recorder = new FloatingRecorderWindow();
      recorder.create();

      expect(mockLoadURL).toHaveBeenCalledWith(
        'http://localhost:5173/floating-recorder.html'
      );

      process.env.NODE_ENV = originalEnv;
      recorder.cleanup();
    });

    it('should load production file in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockLoadFile = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        loadFile: mockLoadFile,
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      const recorder = new FloatingRecorderWindow();
      recorder.create();

      expect(mockLoadFile).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      recorder.cleanup();
    });

    it('should disable window buttons', () => {
      const mockSetWindowButtonVisibility = vi.fn();
      const mockWindow = {
        loadURL: vi.fn(),
        loadFile: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: mockSetWindowButtonVisibility,
        webContents: { send: vi.fn() }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      const recorder = new FloatingRecorderWindow();
      recorder.create();

      expect(mockSetWindowButtonVisibility).toHaveBeenCalledWith(false);

      recorder.cleanup();
    });

    it('should configure webPreferences correctly', () => {
      const recorder = new FloatingRecorderWindow();
      recorder.create();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
            preload: expect.stringContaining('preload.js')
          })
        })
      );

      recorder.cleanup();
    });
  });

  describe('State Transitions', () => {
    let recorder: FloatingRecorderWindow;
    let mockSend: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockSend = vi.fn();

      const mockWindow = {
        loadURL: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        setWindowButtonVisibility: vi.fn(),
        webContents: { send: mockSend }
      };

      (BrowserWindow as any).mockImplementation(() => mockWindow);

      recorder = new FloatingRecorderWindow();
      recorder.create();
    });

    afterEach(() => {
      recorder.cleanup();
    });

    it('should transition from recording to processing', () => {
      recorder.updateState('processing');

      expect(mockSend).toHaveBeenCalledWith('recorder:state-change', {
        state: 'processing'
      });
    });

    it('should transition from processing to complete', () => {
      recorder.updateState('complete');

      expect(mockSend).toHaveBeenCalledWith('recorder:state-change', {
        state: 'complete'
      });
    });

    it('should handle multiple state updates', () => {
      recorder.updateState('recording');
      recorder.updateState('processing');
      recorder.updateState('complete');

      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should update time while recording', () => {
      recorder.updateTime(0);
      recorder.updateTime(1);
      recorder.updateTime(2);
      recorder.updateTime(3);

      expect(mockSend).toHaveBeenCalledTimes(4);
      expect(mockSend).toHaveBeenLastCalledWith('recorder:time-update', {
        elapsedTime: 3
      });
    });
  });
});

describe('Recording State Types', () => {
  it('should define valid recording states', () => {
    type RecordingState = 'recording' | 'processing' | 'complete';

    const validStates: RecordingState[] = ['recording', 'processing', 'complete'];

    validStates.forEach(state => {
      expect(['recording', 'processing', 'complete']).toContain(state);
    });
  });
});
