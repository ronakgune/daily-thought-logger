/**
 * Tests for IPC Handlers
 * AI-23: Wire recording/text to analysis pipeline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IPCHandlers } from '../src/main/ipc-handlers';
import { DatabaseService } from '../src/services/database';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { AnalysisResult } from '../src/types';

// Mock Electron modules
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  app: {},
}));

// Mock AnalysisService
vi.mock('../src/services/analysis', () => ({
  AnalysisService: vi.fn().mockImplementation(() => ({
    analyzeAudio: vi.fn().mockResolvedValue({
      transcript: 'Test transcript',
      segments: [
        {
          type: 'todo',
          text: 'Test todo',
          priority: 'high',
          confidence: 0.95,
        },
      ],
    }),
    analyzeText: vi.fn().mockResolvedValue({
      transcript: 'Test text input',
      segments: [
        {
          type: 'idea',
          text: 'Test idea',
          category: 'product',
          confidence: 0.92,
        },
      ],
    }),
  })),
}));

// Mock DatabaseService
vi.mock('../src/services/database', () => ({
  DatabaseService: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
}));

// Mock StorageService
vi.mock('../src/services/storage', () => ({
  StorageService: vi.fn().mockImplementation(() => ({
    saveAnalysisResult: vi.fn().mockReturnValue({
      id: 1,
      date: '2024-01-15',
      audioPath: null,
      transcript: 'Test',
      summary: null,
      pendingAnalysis: false,
      retryCount: 0,
      lastError: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      todos: [
        {
          id: 1,
          logId: 1,
          text: 'Test todo',
          completed: false,
          dueDate: null,
          priority: 1,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ],
      ideas: [],
      learnings: [],
      accomplishments: [],
    }),
  })),
}));

describe('IPCHandlers', () => {
  let db: DatabaseService;
  let handlers: IPCHandlers;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ipc-test-'));

    // Initialize database
    db = new DatabaseService(':memory:');

    // Initialize handlers with test config
    handlers = new IPCHandlers(db, {
      audioDir: tempDir,
    });
  });

  afterEach(async () => {
    // Cleanup
    handlers.unregisterHandlers();
    db.close();

    // Remove temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('registerHandlers', () => {
    it('should register IPC handlers', () => {
      const { ipcMain } = require('electron');

      handlers.registerHandlers();

      expect(ipcMain.handle).toHaveBeenCalledWith('analyze:audio', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('analyze:text', expect.any(Function));
    });
  });

  describe('unregisterHandlers', () => {
    it('should unregister IPC handlers', () => {
      const { ipcMain } = require('electron');

      handlers.registerHandlers();
      handlers.unregisterHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith('analyze:audio');
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('analyze:text');
    });
  });

  describe('handleAudioAnalysis', () => {
    it('should process audio and save results', async () => {
      // Create mock audio data
      const audioData = new ArrayBuffer(1024);
      const audioView = new Uint8Array(audioData);
      audioView.fill(65); // Fill with 'A' character

      // Mock WebContents
      const mockSender = {
        send: vi.fn(),
      };

      // Register handlers
      handlers.registerHandlers();

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:audio'
      );
      const handler = handlerCall[1];

      // Call handler
      const result = await handler(
        { sender: mockSender },
        { audioData }
      );

      // Verify progress updates were sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Saving audio file...',
        progress: 10,
      });
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Analyzing audio...',
        progress: 30,
      });
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Storing results...',
        progress: 80,
      });
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Complete',
        progress: 100,
      });

      // Verify complete event was sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:complete', {
        result: expect.objectContaining({
          transcript: 'Test transcript',
          segments: expect.any(Array),
        }),
        logId: expect.any(Number),
      });

      // Verify result
      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.transcript).toBe('Test transcript');
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].text).toBe('Test todo');

      // Verify audio file was saved
      const files = await fs.readdir(tempDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/^recording-.*\.wav$/);
    });

    it('should send error event on failure', async () => {
      // Mock AnalysisService to throw error
      const { AnalysisService } = require('../src/services/analysis');
      AnalysisService.mockImplementationOnce(() => ({
        analyzeAudio: vi.fn().mockRejectedValue(new Error('Analysis failed')),
      }));

      // Re-create handlers with mocked service
      handlers = new IPCHandlers(db, { audioDir: tempDir });
      handlers.registerHandlers();

      const mockSender = {
        send: vi.fn(),
      };

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:audio'
      );
      const handler = handlerCall[1];

      // Call handler and expect it to throw
      await expect(
        handler({ sender: mockSender }, { audioData: new ArrayBuffer(1024) })
      ).rejects.toThrow('Analysis failed');

      // Verify error event was sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:error', {
        error: 'Analysis failed',
      });
    });
  });

  describe('handleTextAnalysis', () => {
    it('should process text and save results', async () => {
      const text = 'I completed the project. Need to write documentation.';

      // Mock WebContents
      const mockSender = {
        send: vi.fn(),
      };

      // Register handlers
      handlers.registerHandlers();

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:text'
      );
      const handler = handlerCall[1];

      // Call handler
      const result = await handler(
        { sender: mockSender },
        { text }
      );

      // Verify progress updates were sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Analyzing text...',
        progress: 30,
      });
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Storing results...',
        progress: 80,
      });
      expect(mockSender.send).toHaveBeenCalledWith('analyze:progress', {
        status: 'Complete',
        progress: 100,
      });

      // Verify complete event was sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:complete', {
        result: expect.objectContaining({
          transcript: 'Test text input',
          segments: expect.any(Array),
        }),
        logId: expect.any(Number),
      });

      // Verify result
      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.transcript).toBe('Test text input');
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].text).toBe('Test idea');

      // Verify no audio file was saved
      const files = await fs.readdir(tempDir);
      expect(files).toHaveLength(0);
    });

    it('should send error event on failure', async () => {
      // Mock AnalysisService to throw error
      const { AnalysisService } = require('../src/services/analysis');
      AnalysisService.mockImplementationOnce(() => ({
        analyzeText: vi.fn().mockRejectedValue(new Error('Text analysis failed')),
      }));

      // Re-create handlers with mocked service
      handlers = new IPCHandlers(db, { audioDir: tempDir });
      handlers.registerHandlers();

      const mockSender = {
        send: vi.fn(),
      };

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:text'
      );
      const handler = handlerCall[1];

      // Call handler and expect it to throw
      await expect(
        handler({ sender: mockSender }, { text: 'test' })
      ).rejects.toThrow('Text analysis failed');

      // Verify error event was sent
      expect(mockSender.send).toHaveBeenCalledWith('analyze:error', {
        error: 'Text analysis failed',
      });
    });
  });

  describe('getAudioDir', () => {
    it('should return configured audio directory', () => {
      expect(handlers.getAudioDir()).toBe(tempDir);
    });
  });

  describe('audio file saving', () => {
    it('should create audio directory if it does not exist', async () => {
      // Use a non-existent directory
      const newDir = path.join(tempDir, 'nested', 'audio');
      const newHandlers = new IPCHandlers(db, { audioDir: newDir });
      newHandlers.registerHandlers();

      const mockSender = {
        send: vi.fn(),
      };

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:audio'
      );
      const handler = handlerCall[1];

      // Call handler
      await handler(
        { sender: mockSender },
        { audioData: new ArrayBuffer(1024) }
      );

      // Verify directory was created
      const stats = await fs.stat(newDir);
      expect(stats.isDirectory()).toBe(true);

      // Cleanup
      newHandlers.unregisterHandlers();
      await fs.rm(path.join(tempDir, 'nested'), { recursive: true });
    });

    it('should generate unique filenames with timestamps', async () => {
      const mockSender = {
        send: vi.fn(),
      };

      handlers.registerHandlers();

      // Get the registered handler
      const { ipcMain } = require('electron');
      const handlerCall = ipcMain.handle.mock.calls.find(
        (call: any) => call[0] === 'analyze:audio'
      );
      const handler = handlerCall[1];

      // Call handler twice
      await handler(
        { sender: mockSender },
        { audioData: new ArrayBuffer(1024) }
      );
      await handler(
        { sender: mockSender },
        { audioData: new ArrayBuffer(1024) }
      );

      // Verify two files were created
      const files = await fs.readdir(tempDir);
      expect(files).toHaveLength(2);
      expect(files[0]).not.toBe(files[1]);
    });
  });
});
