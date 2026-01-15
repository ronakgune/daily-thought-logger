/**
 * Tests for IPC Client
 * AI-23: Wire recording/text to analysis pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IPCClient } from '../src/renderer/ipc-client';
import type { AnalysisResult } from '../src/types';
import type { LogWithSegments } from '../src/types/database';

// Mock Electron API
const mockElectronAPI = {
  analyzeAudio: vi.fn(),
  analyzeText: vi.fn(),
  onAnalyzeProgress: vi.fn(),
  onAnalyzeComplete: vi.fn(),
  onAnalyzeError: vi.fn(),
};

// Mock window.electron
beforeEach(() => {
  (global as any).window = {
    electron: mockElectronAPI,
  };

  // Reset all mocks
  vi.clearAllMocks();

  // Setup default mock implementations
  mockElectronAPI.onAnalyzeProgress.mockReturnValue(() => {});
  mockElectronAPI.onAnalyzeComplete.mockReturnValue(() => {});
  mockElectronAPI.onAnalyzeError.mockReturnValue(() => {});
});

describe('IPCClient', () => {
  describe('constructor', () => {
    it('should throw error if Electron API is not available', () => {
      delete (global as any).window;

      expect(() => new IPCClient()).toThrow(
        'Electron API not found. Make sure preload script is loaded.'
      );
    });

    it('should set up event listeners on creation', () => {
      const client = new IPCClient();

      expect(mockElectronAPI.onAnalyzeProgress).toHaveBeenCalled();
      expect(mockElectronAPI.onAnalyzeComplete).toHaveBeenCalled();
      expect(mockElectronAPI.onAnalyzeError).toHaveBeenCalled();
    });
  });

  describe('analyzeAudio', () => {
    it('should call Electron API with audio data', async () => {
      const client = new IPCClient();
      const audioData = new ArrayBuffer(1024);

      const mockResult: LogWithSegments = {
        id: 1,
        date: '2024-01-15',
        audioPath: '/path/to/audio.wav',
        transcript: 'Test transcript',
        summary: null,
        pendingAnalysis: false,
        retryCount: 0,
        lastError: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      mockElectronAPI.analyzeAudio.mockResolvedValue(mockResult);

      const result = await client.analyzeAudio(audioData);

      expect(mockElectronAPI.analyzeAudio).toHaveBeenCalledWith(audioData);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from Electron API', async () => {
      const client = new IPCClient();
      const audioData = new ArrayBuffer(1024);

      mockElectronAPI.analyzeAudio.mockRejectedValue(
        new Error('Analysis failed')
      );

      await expect(client.analyzeAudio(audioData)).rejects.toThrow(
        'Analysis failed'
      );
    });
  });

  describe('analyzeText', () => {
    it('should call Electron API with text', async () => {
      const client = new IPCClient();
      const text = 'Test text input';

      const mockResult: LogWithSegments = {
        id: 2,
        date: '2024-01-15',
        audioPath: null,
        transcript: text,
        summary: null,
        pendingAnalysis: false,
        retryCount: 0,
        lastError: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      mockElectronAPI.analyzeText.mockResolvedValue(mockResult);

      const result = await client.analyzeText(text);

      expect(mockElectronAPI.analyzeText).toHaveBeenCalledWith(text);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from Electron API', async () => {
      const client = new IPCClient();
      const text = 'Test text';

      mockElectronAPI.analyzeText.mockRejectedValue(
        new Error('Text analysis failed')
      );

      await expect(client.analyzeText(text)).rejects.toThrow(
        'Text analysis failed'
      );
    });
  });

  describe('onProgress', () => {
    it('should register progress callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      client.onProgress(callback);

      // Simulate progress event
      const progressListener = mockElectronAPI.onAnalyzeProgress.mock.calls[0][0];
      progressListener('Analyzing...', 50);

      expect(callback).toHaveBeenCalledWith('Analyzing...', 50);
    });

    it('should return cleanup function that removes callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      const cleanup = client.onProgress(callback);

      // Cleanup
      cleanup();

      // Simulate progress event
      const progressListener = mockElectronAPI.onAnalyzeProgress.mock.calls[0][0];
      progressListener('Analyzing...', 50);

      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple progress callbacks', () => {
      const client = new IPCClient();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      client.onProgress(callback1);
      client.onProgress(callback2);

      // Simulate progress event
      const progressListener = mockElectronAPI.onAnalyzeProgress.mock.calls[0][0];
      progressListener('Analyzing...', 75);

      expect(callback1).toHaveBeenCalledWith('Analyzing...', 75);
      expect(callback2).toHaveBeenCalledWith('Analyzing...', 75);
    });
  });

  describe('onComplete', () => {
    it('should register complete callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      client.onComplete(callback);

      // Simulate complete event
      const completeListener = mockElectronAPI.onAnalyzeComplete.mock.calls[0][0];
      const mockResult: AnalysisResult = {
        transcript: 'Test',
        segments: [],
      };
      completeListener(mockResult, 123);

      expect(callback).toHaveBeenCalledWith(mockResult, 123);
    });

    it('should return cleanup function that removes callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      const cleanup = client.onComplete(callback);

      // Cleanup
      cleanup();

      // Simulate complete event
      const completeListener = mockElectronAPI.onAnalyzeComplete.mock.calls[0][0];
      const mockResult: AnalysisResult = {
        transcript: 'Test',
        segments: [],
      };
      completeListener(mockResult, 123);

      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    it('should register error callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      client.onError(callback);

      // Simulate error event
      const errorListener = mockElectronAPI.onAnalyzeError.mock.calls[0][0];
      errorListener('Analysis failed');

      expect(callback).toHaveBeenCalledWith('Analysis failed');
    });

    it('should return cleanup function that removes callback', () => {
      const client = new IPCClient();
      const callback = vi.fn();

      const cleanup = client.onError(callback);

      // Cleanup
      cleanup();

      // Simulate error event
      const errorListener = mockElectronAPI.onAnalyzeError.mock.calls[0][0];
      errorListener('Analysis failed');

      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners and callbacks', () => {
      const client = new IPCClient();

      const progressCallback = vi.fn();
      const completeCallback = vi.fn();
      const errorCallback = vi.fn();

      client.onProgress(progressCallback);
      client.onComplete(completeCallback);
      client.onError(errorCallback);

      // Cleanup
      client.cleanup();

      // Simulate events
      const progressListener = mockElectronAPI.onAnalyzeProgress.mock.calls[0][0];
      const completeListener = mockElectronAPI.onAnalyzeComplete.mock.calls[0][0];
      const errorListener = mockElectronAPI.onAnalyzeError.mock.calls[0][0];

      progressListener('Test', 50);
      completeListener({ transcript: 'Test', segments: [] }, 1);
      errorListener('Error');

      // No callbacks should be called after cleanup
      expect(progressCallback).not.toHaveBeenCalled();
      expect(completeCallback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should call cleanup functions from event listeners', () => {
      const cleanupProgress = vi.fn();
      const cleanupComplete = vi.fn();
      const cleanupError = vi.fn();

      mockElectronAPI.onAnalyzeProgress.mockReturnValue(cleanupProgress);
      mockElectronAPI.onAnalyzeComplete.mockReturnValue(cleanupComplete);
      mockElectronAPI.onAnalyzeError.mockReturnValue(cleanupError);

      const client = new IPCClient();
      client.cleanup();

      expect(cleanupProgress).toHaveBeenCalled();
      expect(cleanupComplete).toHaveBeenCalled();
      expect(cleanupError).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle full analysis workflow', async () => {
      const client = new IPCClient();

      const progressUpdates: Array<{ status: string; progress: number }> = [];
      const progressCallback = vi.fn((status, progress) => {
        progressUpdates.push({ status, progress });
      });

      const completeCallback = vi.fn();
      const errorCallback = vi.fn();

      client.onProgress(progressCallback);
      client.onComplete(completeCallback);
      client.onError(errorCallback);

      // Setup mock
      const mockResult: LogWithSegments = {
        id: 1,
        date: '2024-01-15',
        audioPath: '/test.wav',
        transcript: 'Test',
        summary: null,
        pendingAnalysis: false,
        retryCount: 0,
        lastError: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        todos: [],
        ideas: [],
        learnings: [],
        accomplishments: [],
      };

      mockElectronAPI.analyzeAudio.mockResolvedValue(mockResult);

      // Simulate progress events
      const progressListener = mockElectronAPI.onAnalyzeProgress.mock.calls[0][0];
      const completeListener = mockElectronAPI.onAnalyzeComplete.mock.calls[0][0];

      // Start analysis
      const resultPromise = client.analyzeAudio(new ArrayBuffer(1024));

      // Simulate progress
      progressListener('Saving audio file...', 10);
      progressListener('Analyzing audio...', 50);
      progressListener('Storing results...', 80);
      progressListener('Complete', 100);

      // Simulate complete
      const analysisResult: AnalysisResult = {
        transcript: 'Test',
        segments: [],
      };
      completeListener(analysisResult, 1);

      // Wait for result
      const result = await resultPromise;

      // Verify callbacks were called
      expect(progressCallback).toHaveBeenCalledTimes(4);
      expect(progressUpdates).toEqual([
        { status: 'Saving audio file...', progress: 10 },
        { status: 'Analyzing audio...', progress: 50 },
        { status: 'Storing results...', progress: 80 },
        { status: 'Complete', progress: 100 },
      ]);

      expect(completeCallback).toHaveBeenCalledWith(analysisResult, 1);
      expect(errorCallback).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
