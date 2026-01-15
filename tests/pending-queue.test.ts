/**
 * Pending Queue Service Tests
 * AI-18: Tests for PendingQueueService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PendingQueueService } from '../src/services/pending-queue';
import { DatabaseService } from '../src/services/database';
import { GeminiService } from '../src/services/gemini';
import type { GeminiError } from '../src/types/gemini';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFile: vi.fn((path, data, callback) => callback(null)),
    promises: {
      readFile: vi.fn(() => Promise.resolve(Buffer.from('mock audio data'))),
      unlink: vi.fn(() => Promise.resolve()),
    },
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  writeFile: vi.fn((path, data, callback) => callback(null)),
  promises: {
    readFile: vi.fn(() => Promise.resolve(Buffer.from('mock audio data'))),
    unlink: vi.fn(() => Promise.resolve()),
  },
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-app'),
  },
}));

describe('PendingQueueService', () => {
  let db: DatabaseService;
  let gemini: GeminiService;
  let pendingQueue: PendingQueueService;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new DatabaseService(':memory:');
    gemini = new GeminiService();
    pendingQueue = new PendingQueueService(db, gemini, {
      maxRetries: 3,
      retryDelay: 100,
      exponentialBackoff: false,
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('Database Schema - Pending Fields', () => {
    it('should create logs with pending_analysis field', () => {
      const log = db.createLog({ date: '2024-01-15' });

      expect(log.pendingAnalysis).toBe(false);
      expect(log.retryCount).toBe(0);
      expect(log.lastError).toBeNull();
    });

    it('should mark log as pending', () => {
      const log = db.createLog({ date: '2024-01-15' });
      const updated = db.markLogAsPending(log.id, 'Network error');

      expect(updated.pendingAnalysis).toBe(true);
      expect(updated.retryCount).toBe(1);
      expect(updated.lastError).toBe('Network error');
    });

    it('should mark log as analyzed', () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.markLogAsPending(log.id, 'Test error');

      const analyzed = db.markLogAsAnalyzed(log.id);

      expect(analyzed.pendingAnalysis).toBe(false);
      expect(analyzed.lastError).toBeNull();
      // Note: retryCount is not reset when marking as analyzed
      expect(analyzed.retryCount).toBe(1);
    });

    it('should reset retry count', () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.markLogAsPending(log.id, 'Error 1');
      db.markLogAsPending(log.id, 'Error 2');

      const beforeReset = db.getLogById(log.id);
      expect(beforeReset!.retryCount).toBe(2);

      const afterReset = db.resetRetryCount(log.id);
      expect(afterReset.retryCount).toBe(0);
    });

    it('should get all pending logs', () => {
      const log1 = db.createLog({ date: '2024-01-15' });
      const log2 = db.createLog({ date: '2024-01-16' });
      const log3 = db.createLog({ date: '2024-01-17' });

      db.markLogAsPending(log1.id, 'Error 1');
      db.markLogAsPending(log3.id, 'Error 2');

      const pending = db.getPendingLogs();

      expect(pending.length).toBe(2);
      expect(pending.map((l) => l.id)).toContain(log1.id);
      expect(pending.map((l) => l.id)).toContain(log3.id);
      expect(pending.map((l) => l.id)).not.toContain(log2.id);
    });
  });

  describe('Queue Operations', () => {
    it('should queue audio for analysis with success', async () => {
      // Mock successful transcription
      vi.spyOn(gemini, 'transcribeAudio').mockResolvedValue({
        text: 'Mock transcription',
        language: 'en',
      });

      const audioBuffer = Buffer.from('test audio data');
      const logId = await pendingQueue.queueForAnalysis(audioBuffer, '2024-01-15');

      expect(logId).toBeDefined();

      const log = db.getLogById(logId);
      expect(log).not.toBeNull();
      expect(log!.date).toBe('2024-01-15');
      expect(log!.audioPath).toBeDefined();
      expect(log!.transcript).toBe('Mock transcription');
      expect(log!.pendingAnalysis).toBe(false);
    });

    it('should mark as pending on network error', async () => {
      // Mock network error
      const networkError: GeminiError = {
        code: 'NETWORK_ERROR',
        message: 'No internet connection',
      };
      vi.spyOn(gemini, 'transcribeAudio').mockRejectedValue(networkError);

      const audioBuffer = Buffer.from('test audio data');
      const logId = await pendingQueue.queueForAnalysis(audioBuffer, '2024-01-15');

      const log = db.getLogById(logId);
      expect(log).not.toBeNull();
      expect(log!.pendingAnalysis).toBe(true);
      expect(log!.lastError).toBe('No internet connection');
      expect(log!.retryCount).toBe(1);
    });

    it('should mark as pending on service unavailable error', async () => {
      const serviceError: GeminiError = {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      };
      vi.spyOn(gemini, 'transcribeAudio').mockRejectedValue(serviceError);

      const audioBuffer = Buffer.from('test audio data');
      const logId = await pendingQueue.queueForAnalysis(audioBuffer, '2024-01-15');

      const log = db.getLogById(logId);
      expect(log!.pendingAnalysis).toBe(true);
      expect(log!.lastError).toBe('Service temporarily unavailable');
    });

    it('should mark as pending on rate limit error', async () => {
      const rateLimitError: GeminiError = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
      };
      vi.spyOn(gemini, 'transcribeAudio').mockRejectedValue(rateLimitError);

      const audioBuffer = Buffer.from('test audio data');
      const logId = await pendingQueue.queueForAnalysis(audioBuffer, '2024-01-15');

      const log = db.getLogById(logId);
      expect(log!.pendingAnalysis).toBe(true);
      expect(log!.lastError).toBe('Rate limit exceeded');
    });

    it('should not mark as pending for non-retryable errors', async () => {
      const apiKeyError: GeminiError = {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
      };
      vi.spyOn(gemini, 'transcribeAudio').mockRejectedValue(apiKeyError);

      const audioBuffer = Buffer.from('test audio data');
      const logId = await pendingQueue.queueForAnalysis(audioBuffer, '2024-01-15');

      const log = db.getLogById(logId);
      expect(log!.pendingAnalysis).toBe(false);
      expect(log!.transcript).toBeNull();
      expect(log!.summary).toBeNull();
    });
  });

  describe('Retry Operations', () => {
    it('should get pending items', async () => {
      // Create a pending log with audio path
      const log = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio.wav',
      });
      db.markLogAsPending(log.id, 'Test error');

      const pending = await pendingQueue.getPendingItems();

      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(log.id);
      expect(pending[0].audioPath).toBeDefined();
    });

    it('should retry a pending log successfully', async () => {
      // Create pending log
      const log = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio.wav',
      });
      db.markLogAsPending(log.id, 'Network error');

      // Mock successful retry
      vi.spyOn(gemini, 'transcribeAudio').mockResolvedValue({
        text: 'Retried transcription',
        language: 'en',
      });

      await pendingQueue.retryPending(log.id);

      const updated = db.getLogById(log.id);
      expect(updated!.pendingAnalysis).toBe(false);
      expect(updated!.transcript).toBe('Retried transcription');
      expect(updated!.lastError).toBeNull();
    });

    it('should not retry logs that exceed max retries', async () => {
      const log = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio.wav',
      });

      // Simulate multiple failed retries
      db.markLogAsPending(log.id, 'Error 1');
      db.markLogAsPending(log.id, 'Error 2');
      db.markLogAsPending(log.id, 'Error 3');

      const transcribeSpy = vi.spyOn(gemini, 'transcribeAudio');

      // This should skip retry since retryCount >= maxRetries
      await pendingQueue.retryPending(log.id);

      // Transcribe should not be called
      expect(transcribeSpy).not.toHaveBeenCalled();
    });

    it('should not retry logs that are not pending', async () => {
      const log = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio.wav',
      });

      const transcribeSpy = vi.spyOn(gemini, 'transcribeAudio');

      await pendingQueue.retryPending(log.id);

      // Should not attempt to transcribe
      expect(transcribeSpy).not.toHaveBeenCalled();
    });

    it('should retry all pending logs', async () => {
      // Create multiple pending logs
      const log1 = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio1.wav',
      });
      const log2 = db.createLog({
        date: '2024-01-16',
        audioPath: '/tmp/audio2.wav',
      });

      db.markLogAsPending(log1.id, 'Error 1');
      db.markLogAsPending(log2.id, 'Error 2');

      // Mock successful retries
      vi.spyOn(gemini, 'transcribeAudio').mockResolvedValue({
        text: 'Retried transcription',
        language: 'en',
      });

      await pendingQueue.retryAllPending();

      const updated1 = db.getLogById(log1.id);
      const updated2 = db.getLogById(log2.id);

      expect(updated1!.pendingAnalysis).toBe(false);
      expect(updated2!.pendingAnalysis).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should check if there are pending items', async () => {
      expect(await pendingQueue.hasPendingItems()).toBe(false);

      const log = db.createLog({
        date: '2024-01-15',
        audioPath: '/tmp/audio.wav',
      });
      db.markLogAsPending(log.id, 'Test error');

      expect(await pendingQueue.hasPendingItems()).toBe(true);
    });

    it('should manually mark as analyzed', async () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.markLogAsPending(log.id, 'Test error');

      await pendingQueue.markAsAnalyzed(log.id);

      const updated = db.getLogById(log.id);
      expect(updated!.pendingAnalysis).toBe(false);
    });

    it('should reset retry count', async () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.markLogAsPending(log.id, 'Error 1');
      db.markLogAsPending(log.id, 'Error 2');

      await pendingQueue.resetRetryCount(log.id);

      const updated = db.getLogById(log.id);
      expect(updated!.retryCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when retrying non-existent log', async () => {
      await expect(pendingQueue.retryPending(999)).rejects.toThrow(
        'Log 999 not found'
      );
    });

    it('should throw error when retrying log without audio file', async () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.markLogAsPending(log.id, 'Test error');

      await expect(pendingQueue.retryPending(log.id)).rejects.toThrow(
        'has no audio file to retry'
      );
    });
  });
});
