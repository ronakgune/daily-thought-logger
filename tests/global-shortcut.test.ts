/**
 * Tests for Global Shortcut Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Electron's globalShortcut module - must be hoisted before imports
vi.mock('electron', () => ({
  globalShortcut: {
    register: vi.fn(),
    unregister: vi.fn(),
    unregisterAll: vi.fn(),
    isRegistered: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

import { GlobalShortcutService, getGlobalShortcutService, cleanupGlobalShortcuts } from '../src/main/global-shortcut';
import { globalShortcut } from 'electron';

// Get references to the mock functions after the mock is set up
const mockRegister = globalShortcut.register as ReturnType<typeof vi.fn>;
const mockUnregister = globalShortcut.unregister as ReturnType<typeof vi.fn>;
const mockUnregisterAll = globalShortcut.unregisterAll as ReturnType<typeof vi.fn>;
const mockIsRegistered = globalShortcut.isRegistered as ReturnType<typeof vi.fn>;

describe('GlobalShortcutService', () => {
  let service: GlobalShortcutService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockRegister.mockReturnValue(true);
    mockUnregister.mockReturnValue(undefined);
    mockUnregisterAll.mockReturnValue(undefined);
    mockIsRegistered.mockReturnValue(false);

    // Create a new service instance
    service = new GlobalShortcutService();
  });

  afterEach(() => {
    // Cleanup after each test
    try {
      if (service.isRegistered()) {
        service.unregister();
      }
    } catch (e) {
      // Ignore cleanup errors in tests
    }
  });

  describe('constructor', () => {
    it('should create instance with default accelerator', () => {
      const defaultService = new GlobalShortcutService();
      expect(defaultService.getAccelerator()).toBe('CommandOrControl+Shift+L');
      expect(defaultService.isRegistered()).toBe(false);
    });

    it('should create instance with custom accelerator', () => {
      const customService = new GlobalShortcutService('CommandOrControl+Alt+R');
      expect(customService.getAccelerator()).toBe('CommandOrControl+Alt+R');
    });

    it('should initialize with recording state as false', () => {
      expect(service.getRecordingState()).toBe(false);
    });
  });

  describe('register', () => {
    it('should register shortcut successfully', () => {
      const callback = vi.fn();
      const result = service.register(callback);

      expect(result).toBe(true);
      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(mockRegister).toHaveBeenCalledWith(
        'CommandOrControl+Shift+L',
        expect.any(Function)
      );
      expect(service.isRegistered()).toBe(true);
    });

    it('should return false when registration fails', () => {
      mockRegister.mockReturnValue(false);
      const callback = vi.fn();
      const result = service.register(callback);

      expect(result).toBe(false);
      expect(service.isRegistered()).toBe(false);
    });

    it('should return true if already registered', () => {
      const callback = vi.fn();
      service.register(callback);

      // Try to register again
      const result = service.register(callback);

      expect(result).toBe(true);
      expect(mockRegister).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle registration errors gracefully', () => {
      mockRegister.mockImplementation(() => {
        throw new Error('Registration error');
      });

      const callback = vi.fn();
      const result = service.register(callback);

      expect(result).toBe(false);
      expect(service.isRegistered()).toBe(false);
    });

    it('should call callback when shortcut is pressed', () => {
      const callback = vi.fn();
      service.register(callback);

      // Get the registered callback from the mock
      const registeredCallback = mockRegister.mock.calls[0][1];

      // Simulate shortcut press
      registeredCallback();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregister', () => {
    it('should unregister shortcut successfully', () => {
      const callback = vi.fn();
      service.register(callback);
      service.unregister();

      expect(mockUnregister).toHaveBeenCalledTimes(1);
      expect(mockUnregister).toHaveBeenCalledWith('CommandOrControl+Shift+L');
      expect(service.isRegistered()).toBe(false);
    });

    it('should do nothing if shortcut is not registered', () => {
      service.unregister();

      expect(mockUnregister).not.toHaveBeenCalled();
    });

    it('should handle unregister errors gracefully', () => {
      mockUnregister.mockImplementation(() => {
        throw new Error('Unregister error');
      });

      const callback = vi.fn();
      service.register(callback);

      // Should not throw
      expect(() => service.unregister()).not.toThrow();

      // State should still be updated despite error
      expect(service.isRegistered()).toBe(false);
    });
  });

  describe('unregisterAll', () => {
    it('should unregister all shortcuts', () => {
      const callback = vi.fn();
      service.register(callback);
      service.unregisterAll();

      expect(mockUnregisterAll).toHaveBeenCalledTimes(1);
      expect(service.isRegistered()).toBe(false);
    });

    it('should handle errors gracefully', () => {
      mockUnregisterAll.mockImplementation(() => {
        throw new Error('UnregisterAll error');
      });

      const callback = vi.fn();
      service.register(callback);

      expect(() => service.unregisterAll()).not.toThrow();
      expect(service.isRegistered()).toBe(false);
    });
  });

  describe('shortcut behavior', () => {
    it('should toggle recording state on shortcut press', () => {
      const callback = vi.fn();
      service.register(callback);

      const registeredCallback = mockRegister.mock.calls[0][1];

      // First press - start recording
      expect(service.getRecordingState()).toBe(false);
      registeredCallback();
      expect(service.getRecordingState()).toBe(true);

      // Second press - stop recording
      registeredCallback();
      expect(service.getRecordingState()).toBe(false);
    });

    it('should maintain recording state across multiple presses', () => {
      const callback = vi.fn();
      service.register(callback);

      const registeredCallback = mockRegister.mock.calls[0][1];

      // Start with false state
      expect(service.getRecordingState()).toBe(false);

      for (let i = 0; i < 5; i++) {
        registeredCallback();
        // After each press, state should toggle
        // Press 0: false -> true
        // Press 1: true -> false
        // Press 2: false -> true
        // etc.
        const expectedState = (i + 1) % 2 === 1;
        expect(service.getRecordingState()).toBe(expectedState);
      }
    });
  });

  describe('setRecordingState', () => {
    it('should manually set recording state', () => {
      service.setRecordingState(true);
      expect(service.getRecordingState()).toBe(true);

      service.setRecordingState(false);
      expect(service.getRecordingState()).toBe(false);
    });
  });

  describe('isAcceleratorRegistered', () => {
    it('should check if accelerator is registered', () => {
      mockIsRegistered.mockReturnValue(true);

      const result = service.isAcceleratorRegistered('CommandOrControl+Shift+L');

      expect(result).toBe(true);
      expect(mockIsRegistered).toHaveBeenCalledWith('CommandOrControl+Shift+L');
    });

    it('should return false for unregistered accelerator', () => {
      mockIsRegistered.mockReturnValue(false);

      const result = service.isAcceleratorRegistered('CommandOrControl+Alt+X');

      expect(result).toBe(false);
    });
  });

  describe('updateAccelerator', () => {
    it('should update accelerator successfully', () => {
      const callback = vi.fn();
      service.register(callback);

      // Clear mocks to check only the updateAccelerator calls
      vi.clearAllMocks();
      mockRegister.mockReturnValue(true);

      const result = service.updateAccelerator('CommandOrControl+Alt+R', callback);

      expect(result).toBe(true);
      expect(mockUnregister).toHaveBeenCalledWith('CommandOrControl+Shift+L');
      expect(mockRegister).toHaveBeenCalledWith(
        'CommandOrControl+Alt+R',
        expect.any(Function)
      );
      expect(service.getAccelerator()).toBe('CommandOrControl+Alt+R');
    });

    it('should update accelerator when not currently registered', () => {
      const callback = vi.fn();
      const result = service.updateAccelerator('CommandOrControl+Alt+R', callback);

      expect(result).toBe(true);
      expect(mockUnregister).not.toHaveBeenCalled();
      expect(service.getAccelerator()).toBe('CommandOrControl+Alt+R');
    });

    it('should return false if new accelerator registration fails', () => {
      const callback = vi.fn();
      service.register(callback);

      // Clear mocks and set register to fail
      vi.clearAllMocks();
      mockRegister.mockReturnValue(false);

      const result = service.updateAccelerator('CommandOrControl+Alt+R', callback);

      expect(result).toBe(false);
      expect(service.getAccelerator()).toBe('CommandOrControl+Alt+R');
      expect(service.isRegistered()).toBe(false);
    });
  });

  describe('getAccelerator', () => {
    it('should return current accelerator', () => {
      expect(service.getAccelerator()).toBe('CommandOrControl+Shift+L');
    });

    it('should return updated accelerator', () => {
      const callback = vi.fn();
      service.updateAccelerator('CommandOrControl+Alt+R', callback);
      expect(service.getAccelerator()).toBe('CommandOrControl+Alt+R');
    });
  });
});

describe('getGlobalShortcutService', () => {
  afterEach(() => {
    cleanupGlobalShortcuts();
  });

  it('should return singleton instance', () => {
    const service1 = getGlobalShortcutService();
    const service2 = getGlobalShortcutService();

    expect(service1).toBe(service2);
  });

  it('should use custom accelerator on first call', () => {
    const service = getGlobalShortcutService('CommandOrControl+Alt+Z');
    expect(service.getAccelerator()).toBe('CommandOrControl+Alt+Z');
  });

  it('should ignore accelerator parameter on subsequent calls', () => {
    const service1 = getGlobalShortcutService('CommandOrControl+Shift+L');
    const service2 = getGlobalShortcutService('CommandOrControl+Alt+Z');

    expect(service1).toBe(service2);
    expect(service2.getAccelerator()).toBe('CommandOrControl+Shift+L');
  });
});

describe('cleanupGlobalShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cleanup singleton instance', () => {
    const service = getGlobalShortcutService();
    const callback = vi.fn();
    service.register(callback);

    cleanupGlobalShortcuts();

    expect(mockUnregisterAll).toHaveBeenCalledTimes(1);
  });

  it('should allow creating new instance after cleanup', () => {
    const service1 = getGlobalShortcutService();
    cleanupGlobalShortcuts();

    const service2 = getGlobalShortcutService();
    expect(service2).not.toBe(service1);
  });

  it('should handle cleanup when no instance exists', () => {
    expect(() => cleanupGlobalShortcuts()).not.toThrow();
  });
});

describe('Integration scenarios', () => {
  let service: GlobalShortcutService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockReturnValue(true);
    mockUnregister.mockReturnValue(undefined);
    mockUnregisterAll.mockReturnValue(undefined);
    mockIsRegistered.mockReturnValue(false);
    service = new GlobalShortcutService();
  });

  afterEach(() => {
    try {
      if (service.isRegistered()) {
        service.unregister();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('should handle complete lifecycle', () => {
    const callback = vi.fn();

    // Register
    expect(service.register(callback)).toBe(true);
    expect(service.isRegistered()).toBe(true);

    // Simulate shortcut press
    const registeredCallback = mockRegister.mock.calls[0][1];
    registeredCallback();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(service.getRecordingState()).toBe(true);

    // Simulate second press
    registeredCallback();
    expect(service.getRecordingState()).toBe(false);

    // Unregister
    service.unregister();
    expect(service.isRegistered()).toBe(false);
  });

  it('should handle shortcut collision scenario', () => {
    mockIsRegistered.mockReturnValue(true);

    // Check if shortcut is already in use
    const isInUse = service.isAcceleratorRegistered('CommandOrControl+Shift+L');
    expect(isInUse).toBe(true);

    // Try to register anyway
    mockRegister.mockReturnValue(false);
    const callback = vi.fn();
    const result = service.register(callback);

    expect(result).toBe(false);
    expect(service.isRegistered()).toBe(false);
  });

  it('should handle app quit scenario', () => {
    const callback = vi.fn();
    service.register(callback);

    // Simulate app quit
    service.unregisterAll();

    expect(service.isRegistered()).toBe(false);
    expect(mockUnregisterAll).toHaveBeenCalledTimes(1);
  });

  it('should handle shortcut reconfiguration', () => {
    const callback1 = vi.fn();
    service.register(callback1);

    // Clear mocks and set up for new registration
    vi.clearAllMocks();
    mockRegister.mockReturnValue(true);

    // User changes shortcut in settings
    const callback2 = vi.fn();
    service.updateAccelerator('CommandOrControl+Alt+L', callback2);

    expect(service.getAccelerator()).toBe('CommandOrControl+Alt+L');
    expect(service.isRegistered()).toBe(true);

    // Test new shortcut - should be the first call since we cleared mocks
    const newCallback = mockRegister.mock.calls[0][1];
    newCallback();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
