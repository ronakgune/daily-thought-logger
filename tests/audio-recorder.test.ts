/**
 * AudioRecorderService Tests
 * AI-21: Tests for audio recording with MediaRecorder
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AudioRecorderService,
  AudioRecorderError,
  RecordingResult,
} from '../src/services/audio-recorder';

// Mock MediaStream
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];

  constructor() {
    this.tracks = [new MockMediaStreamTrack()];
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks;
  }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind = 'audio';
  enabled = true;
  muted = false;
  readyState: 'live' | 'ended' = 'live';

  stop(): void {
    this.readyState = 'ended';
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  private dataTimeout: NodeJS.Timeout | null = null;
  private stopTimeout: NodeJS.Timeout | null = null;

  constructor(stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType || 'audio/webm';
  }

  start(timeslice?: number): void {
    this.state = 'recording';
    // Simulate data collection
    this.dataTimeout = setTimeout(() => {
      if (this.ondataavailable && this.state === 'recording') {
        const blob = new Blob(['test audio data'], { type: this.mimeType });
        this.ondataavailable({ data: blob });
      }
    }, 10);
  }

  stop(): void {
    this.state = 'inactive';
    // Clear any pending data callbacks
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout);
      this.dataTimeout = null;
    }
    if (this.onstop) {
      this.stopTimeout = setTimeout(() => {
        this.onstop!();
      }, 10);
    }
  }

  pause(): void {
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }

  static isTypeSupported(type: string): boolean {
    return type.includes('webm') || type.includes('opus');
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }
}

// Mock AudioContext
class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode();
  }

  createMediaStreamSource(stream: MediaStream): MockMediaStreamSource {
    return new MockMediaStreamSource();
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Mock AnalyserNode
class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;

  connect(): void {}
  disconnect(): void {}

  getByteFrequencyData(array: Uint8Array): void {
    // Simulate audio data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 128); // 0-50% volume
    }
  }
}

// Mock MediaStreamSource
class MockMediaStreamSource {
  connect(): void {}
  disconnect(): void {}
}

describe('AudioRecorderService', () => {
  let recorder: AudioRecorderService;
  let mockStream: MediaStream;

  beforeEach(() => {
    // Set up global mocks
    mockStream = new MockMediaStream() as unknown as MediaStream;

    // Mock navigator.mediaDevices using Object.defineProperty
    Object.defineProperty(global, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      },
      writable: true,
      configurable: true,
    });

    global.MediaRecorder = MockMediaRecorder as any;
    global.AudioContext = MockAudioContext as any;

    recorder = new AudioRecorderService();
  });

  afterEach(() => {
    if (recorder) {
      recorder.release();
    }
  });

  // ============================================================================
  // Permission Tests
  // ============================================================================

  describe('requestPermission', () => {
    it('should request and grant microphone permission', async () => {
      const state = await recorder.requestPermission();

      expect(state).toBe('granted');
      expect(recorder.getPermissionState()).toBe('granted');
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    });

    it('should throw error when permission denied', async () => {
      const deniedError = new Error('Permission denied');
      (deniedError as any).name = 'NotAllowedError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(deniedError);

      await expect(recorder.requestPermission()).rejects.toThrow(AudioRecorderError);
      await expect(recorder.requestPermission()).rejects.toThrow(
        'Microphone permission denied'
      );

      expect(recorder.getPermissionState()).toBe('denied');
    });

    it('should throw error when microphone not found', async () => {
      const notFoundError = new Error('No microphone');
      (notFoundError as any).name = 'NotFoundError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(notFoundError);

      await expect(recorder.requestPermission()).rejects.toThrow(AudioRecorderError);
      await expect(recorder.requestPermission()).rejects.toThrow(
        'No microphone found'
      );
    });

    it('should throw error when MediaRecorder not supported', async () => {
      // Remove mediaDevices
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      const newRecorder = new AudioRecorderService();

      await expect(newRecorder.requestPermission()).rejects.toThrow(
        'MediaRecorder is not supported'
      );

      // Restore for other tests
      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: vi.fn().mockResolvedValue(mockStream),
          },
        },
        writable: true,
        configurable: true,
      });
    });

    it('should handle generic permission errors', async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        new Error('Generic error')
      );

      await expect(recorder.requestPermission()).rejects.toThrow(
        'Failed to access microphone'
      );
    });
  });

  // ============================================================================
  // Recording Tests
  // ============================================================================

  describe('startRecording', () => {
    it('should start recording after permission granted', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      expect(recorder.getState()).toBe('recording');
      expect(recorder.getDuration()).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when starting without permission', async () => {
      await expect(recorder.startRecording()).rejects.toThrow(
        'Microphone permission not granted'
      );
    });

    it('should throw error when already recording', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      await expect(recorder.startRecording()).rejects.toThrow(
        'Recording already in progress'
      );
    });

    it('should initialize audio analysis for visualization', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      const level = recorder.getAudioLevel();
      expect(level).not.toBeNull();
      expect(level?.volume).toBeGreaterThanOrEqual(0);
      expect(level?.volume).toBeLessThanOrEqual(100);
    });

    it('should handle recording initialization errors', async () => {
      await recorder.requestPermission();

      // Mock MediaRecorder constructor to throw
      const originalMediaRecorder = global.MediaRecorder;
      global.MediaRecorder = class {
        constructor() {
          throw new Error('MediaRecorder init failed');
        }
      } as any;

      await expect(recorder.startRecording()).rejects.toThrow(
        'Failed to start recording'
      );

      global.MediaRecorder = originalMediaRecorder;
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and return audio blob', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Wait a bit for recording
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result: RecordingResult = await recorder.stopRecording();

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.size).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.mimeType).toContain('audio');
      expect(recorder.getState()).toBe('inactive');
    });

    it('should throw error when stopping without active recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow(
        'No active recording to stop'
      );
    });

    it('should track duration accurately', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Record for ~200ms
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await recorder.stopRecording();

      expect(result.duration).toBeGreaterThanOrEqual(0.15);
      expect(result.duration).toBeLessThan(0.5);
    });

    it('should clean up resources after stopping', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();
      await recorder.stopRecording();

      expect(recorder.getState()).toBe('inactive');
      expect(recorder.getAudioLevel()).toBeNull();
    });
  });

  // ============================================================================
  // State Management Tests
  // ============================================================================

  describe('getState', () => {
    it('should return inactive when not recording', () => {
      expect(recorder.getState()).toBe('inactive');
    });

    it('should return recording when active', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      expect(recorder.getState()).toBe('recording');
    });

    it('should return inactive after stopping', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();
      await recorder.stopRecording();

      expect(recorder.getState()).toBe('inactive');
    });
  });

  describe('getPermissionState', () => {
    it('should return unknown initially', () => {
      expect(recorder.getPermissionState()).toBe('unknown');
    });

    it('should return granted after permission', async () => {
      await recorder.requestPermission();
      expect(recorder.getPermissionState()).toBe('granted');
    });

    it('should return denied after permission denial', async () => {
      const deniedError = new Error('Permission denied');
      (deniedError as any).name = 'NotAllowedError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(deniedError);

      try {
        await recorder.requestPermission();
      } catch {
        // Expected to throw
      }

      expect(recorder.getPermissionState()).toBe('denied');
    });
  });

  describe('getDuration', () => {
    it('should return 0 when not recording', () => {
      expect(recorder.getDuration()).toBe(0);
    });

    it('should return duration when recording', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = recorder.getDuration();
      expect(duration).toBeGreaterThan(0);
    });

    it('should return 0 after stopping', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();
      await recorder.stopRecording();

      expect(recorder.getDuration()).toBe(0);
    });
  });

  // ============================================================================
  // Audio Level Visualization Tests
  // ============================================================================

  describe('getAudioLevel', () => {
    it('should return null when not recording', () => {
      expect(recorder.getAudioLevel()).toBeNull();
    });

    it('should return audio level when recording', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      const level = recorder.getAudioLevel();

      expect(level).not.toBeNull();
      expect(level?.volume).toBeGreaterThanOrEqual(0);
      expect(level?.volume).toBeLessThanOrEqual(100);
      expect(typeof level?.isClipping).toBe('boolean');
    });

    it('should detect clipping at high volume', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Mock high volume
      const mockAnalyser = {
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: (array: Uint8Array) => {
          // Simulate high volume (>95%)
          for (let i = 0; i < array.length; i++) {
            array[i] = 250; // ~98% volume
          }
        },
      };

      // Replace analyser (access private property for testing)
      (recorder as any).analyser = mockAnalyser;
      (recorder as any).dataArray = new Uint8Array(128);

      const level = recorder.getAudioLevel();

      expect(level?.isClipping).toBe(true);
      expect(level?.volume).toBeGreaterThan(95);
    });

    it('should return null after stopping', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();
      await recorder.stopRecording();

      expect(recorder.getAudioLevel()).toBeNull();
    });

    it('should handle analyser errors gracefully', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Mock analyser to throw error
      const mockAnalyser = {
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: () => {
          throw new Error('Analyser error');
        },
      };

      (recorder as any).analyser = mockAnalyser;
      (recorder as any).dataArray = new Uint8Array(128);

      const level = recorder.getAudioLevel();
      expect(level).toBeNull();
    });
  });

  // ============================================================================
  // Resource Management Tests
  // ============================================================================

  describe('release', () => {
    it('should release all resources', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      recorder.release();

      expect(recorder.getState()).toBe('inactive');
      expect(recorder.getPermissionState()).toBe('unknown');
      expect(recorder.getAudioLevel()).toBeNull();
    });

    it('should stop media stream tracks', async () => {
      await recorder.requestPermission();

      const tracks = (recorder as any).audioStream.getTracks();
      const stopSpy = vi.spyOn(tracks[0], 'stop');

      recorder.release();

      expect(stopSpy).toHaveBeenCalled();
      expect(tracks[0].readyState).toBe('ended');
    });

    it('should be safe to call multiple times', async () => {
      await recorder.requestPermission();

      recorder.release();
      recorder.release();

      expect(recorder.getPermissionState()).toBe('unknown');
    });

    it('should be safe to call without initialization', () => {
      expect(() => recorder.release()).not.toThrow();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Full Recording Workflow', () => {
    it('should complete full record-stop cycle', async () => {
      // 1. Request permission
      const permissionState = await recorder.requestPermission();
      expect(permissionState).toBe('granted');

      // 2. Start recording
      await recorder.startRecording();
      expect(recorder.getState()).toBe('recording');

      // 3. Check duration during recording
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(recorder.getDuration()).toBeGreaterThan(0);

      // 4. Check audio level
      const level = recorder.getAudioLevel();
      expect(level).not.toBeNull();

      // 5. Stop recording
      const result = await recorder.stopRecording();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.mimeType).toContain('audio');

      // 6. Verify cleanup
      expect(recorder.getState()).toBe('inactive');
    });

    it('should handle multiple recordings sequentially', async () => {
      await recorder.requestPermission();

      // First recording
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result1 = await recorder.stopRecording();

      expect(result1.blob).toBeInstanceOf(Blob);

      // Second recording (should work without re-requesting permission)
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result2 = await recorder.stopRecording();

      expect(result2.blob).toBeInstanceOf(Blob);
    });

    it('should handle recording with different MIME types', async () => {
      // Mock different MIME type support
      const originalIsTypeSupported = MediaRecorder.isTypeSupported;
      MediaRecorder.isTypeSupported = (type: string) => {
        return type === 'audio/ogg;codecs=opus';
      };

      await recorder.requestPermission();
      await recorder.startRecording();
      const result = await recorder.stopRecording();

      expect(result.mimeType).toBe('audio/ogg;codecs=opus');

      MediaRecorder.isTypeSupported = originalIsTypeSupported;
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should provide specific error codes', async () => {
      // Permission denied error
      const deniedError = new Error('Permission denied');
      (deniedError as any).name = 'NotAllowedError';
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(deniedError);

      try {
        await recorder.requestPermission();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AudioRecorderError);
        expect((error as AudioRecorderError).code).toBe('PERMISSION_DENIED');
      }
    });

    it('should handle errors during blob creation', async () => {
      await recorder.requestPermission();
      await recorder.startRecording();

      // Mock Blob constructor to throw
      const originalBlob = global.Blob;
      global.Blob = class {
        constructor() {
          throw new Error('Blob creation failed');
        }
      } as any;

      try {
        await expect(recorder.stopRecording()).rejects.toThrow(
          'Failed to create audio blob'
        );
      } finally {
        // Always restore Blob constructor
        global.Blob = originalBlob;
      }
    });
  });
});
