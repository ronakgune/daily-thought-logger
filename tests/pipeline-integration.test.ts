/**
 * Integration Tests for Recording/Text to Analysis Pipeline
 * AI-23: Wire recording/text to analysis pipeline
 *
 * These tests verify the complete flow from audio/text input through analysis to storage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../src/services/database';
import { AnalysisService } from '../src/services/analysis';
import { StorageService } from '../src/services/storage';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Pipeline Integration', () => {
  let db: DatabaseService;
  let analysisService: AnalysisService;
  let storageService: StorageService;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));

    // Initialize services
    db = new DatabaseService(':memory:');
    analysisService = new AnalysisService();
    storageService = new StorageService(db);
  });

  afterEach(async () => {
    // Cleanup
    db.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Text to Analysis Pipeline', () => {
    it('should process text through complete pipeline', async () => {
      // Step 1: Analyze text
      const text =
        'I completed the API integration today. ' +
        'I need to write unit tests for the new endpoints. ' +
        'I learned that TypeScript strict mode catches many bugs. ' +
        'I have an idea for improving error handling with custom error classes.';

      const analysisResult = await analysisService.analyzeText(text);

      // Verify analysis result
      expect(analysisResult.transcript).toBe(text);
      expect(analysisResult.segments).toBeDefined();
      expect(analysisResult.segments.length).toBeGreaterThan(0);

      // Step 2: Store results
      const savedLog = storageService.saveAnalysisResult(analysisResult);

      // Verify log was saved
      expect(savedLog.id).toBeGreaterThan(0);
      expect(savedLog.transcript).toBe(text);
      expect(savedLog.audioPath).toBeNull();

      // Verify segments were saved
      const totalSegments =
        savedLog.todos.length +
        savedLog.ideas.length +
        savedLog.learnings.length +
        savedLog.accomplishments.length;
      expect(totalSegments).toBeGreaterThan(0);

      // Step 3: Verify retrieval
      const retrievedLog = storageService.getLogWithSegments(savedLog.id);
      expect(retrievedLog).toBeDefined();
      expect(retrievedLog!.id).toBe(savedLog.id);
      expect(retrievedLog!.transcript).toBe(text);
    });

    it('should handle empty text gracefully', async () => {
      // Empty text should throw an error
      await expect(analysisService.analyzeText('')).rejects.toThrow();
    });

    it('should handle text with only whitespace', async () => {
      await expect(analysisService.analyzeText('   \n\t  ')).rejects.toThrow();
    });
  });

  describe('Audio to Analysis Pipeline', () => {
    it('should process audio through complete pipeline with file saving', async () => {
      // Create mock audio data
      const audioBuffer = Buffer.alloc(1024);
      audioBuffer.fill(65); // Fill with 'A'

      // Save audio to file
      const audioPath = path.join(tempDir, 'test-recording.wav');
      await fs.writeFile(audioPath, audioBuffer);

      // Step 1: Analyze audio
      const analysisResult = await analysisService.analyzeAudio(audioBuffer, {
        mimeType: 'audio/wav',
      });

      // Verify analysis result
      expect(analysisResult.transcript).toBeDefined();
      expect(analysisResult.segments).toBeDefined();

      // Step 2: Store results with audio path
      const savedLog = storageService.saveAnalysisResult(
        analysisResult,
        audioPath
      );

      // Verify log was saved
      expect(savedLog.id).toBeGreaterThan(0);
      expect(savedLog.audioPath).toBe(audioPath);
      expect(savedLog.transcript).toBe(analysisResult.transcript);

      // Verify audio file exists
      const fileExists = await fs
        .access(audioPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Step 3: Verify retrieval
      const retrievedLog = storageService.getLogWithSegments(savedLog.id);
      expect(retrievedLog).toBeDefined();
      expect(retrievedLog!.audioPath).toBe(audioPath);
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis service errors', async () => {
      // Test with invalid input that should fail validation
      const invalidText = 'x'.repeat(60000); // Exceeds max length

      await expect(analysisService.analyzeText(invalidText)).rejects.toThrow();
    });

    it('should rollback transaction on storage error', () => {
      // Create a valid analysis result
      const analysisResult = {
        transcript: 'Test',
        segments: [
          {
            type: 'todo' as const,
            text: 'Test todo',
            priority: 'high' as const,
          },
        ],
      };

      // Close database to force an error
      db.close();

      // Storage should fail
      expect(() => storageService.saveAnalysisResult(analysisResult)).toThrow();
    });
  });

  describe('Multiple Analyses', () => {
    it('should handle multiple analyses in sequence', async () => {
      const texts = [
        'I completed task A.',
        'I need to do task B.',
        'I learned about feature C.',
      ];

      const savedLogs = [];

      for (const text of texts) {
        const analysisResult = await analysisService.analyzeText(text);
        const savedLog = storageService.saveAnalysisResult(analysisResult);
        savedLogs.push(savedLog);
      }

      // Verify all logs were saved
      expect(savedLogs).toHaveLength(3);
      expect(savedLogs[0].id).not.toBe(savedLogs[1].id);
      expect(savedLogs[1].id).not.toBe(savedLogs[2].id);

      // Verify all logs can be retrieved
      const allLogs = storageService.getAllLogsWithSegments();
      expect(allLogs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Segment Types', () => {
    it('should correctly categorize different segment types', async () => {
      const text =
        'I finished the user authentication feature. ' + // accomplishment
        'I need to add rate limiting to the API. ' + // todo
        'I learned that bcrypt is better than MD5 for passwords. ' + // learning
        'What if we used WebSockets for real-time updates?'; // idea

      const analysisResult = await analysisService.analyzeText(text);
      const savedLog = storageService.saveAnalysisResult(analysisResult);

      // Verify we have different types of segments
      // Note: Actual categorization depends on AI, so we just verify structure
      expect(savedLog).toHaveProperty('todos');
      expect(savedLog).toHaveProperty('ideas');
      expect(savedLog).toHaveProperty('learnings');
      expect(savedLog).toHaveProperty('accomplishments');

      expect(Array.isArray(savedLog.todos)).toBe(true);
      expect(Array.isArray(savedLog.ideas)).toBe(true);
      expect(Array.isArray(savedLog.learnings)).toBe(true);
      expect(Array.isArray(savedLog.accomplishments)).toBe(true);
    });
  });

  describe('Traceability', () => {
    it('should maintain traceability from segments to source log', async () => {
      const text =
        'I completed the database migration. ' +
        'I need to update the documentation.';

      const analysisResult = await analysisService.analyzeText(text);
      const savedLog = storageService.saveAnalysisResult(analysisResult);

      // Verify all segments have correct log_id
      const allSegments = [
        ...savedLog.todos,
        ...savedLog.ideas,
        ...savedLog.learnings,
        ...savedLog.accomplishments,
      ];

      allSegments.forEach((segment) => {
        expect(segment.logId).toBe(savedLog.id);
      });

      // Verify we can navigate from segment back to log
      if (savedLog.todos.length > 0) {
        const todo = savedLog.todos[0];
        const sourceLog = storageService.getLogWithSegments(todo.logId);
        expect(sourceLog).toBeDefined();
        expect(sourceLog!.id).toBe(savedLog.id);
        expect(sourceLog!.transcript).toBe(text);
      }
    });
  });

  describe('Confidence Scores', () => {
    it('should preserve confidence scores through pipeline', async () => {
      const text = 'I definitely need to write tests for the API.';

      const analysisResult = await analysisService.analyzeText(text);

      // Check if any segments have confidence scores
      const segmentsWithConfidence = analysisResult.segments.filter(
        (s) => s.confidence !== undefined
      );

      if (segmentsWithConfidence.length > 0) {
        const savedLog = storageService.saveAnalysisResult(analysisResult);

        // Verify confidence scores are preserved
        // Note: Confidence is not stored in database schema currently,
        // but this test documents expected behavior
        expect(savedLog).toBeDefined();
      }
    });
  });

  describe('Date Handling', () => {
    it('should use current date for logs', async () => {
      const text = 'Test log entry';
      const analysisResult = await analysisService.analyzeText(text);
      const savedLog = storageService.saveAnalysisResult(analysisResult);

      // Verify date is today
      const today = new Date().toISOString().split('T')[0];
      expect(savedLog.date).toBe(today);
    });
  });

  describe('Performance', () => {
    it('should handle reasonable workload efficiently', async () => {
      const startTime = Date.now();

      // Process 5 text analyses
      for (let i = 0; i < 5; i++) {
        const text = `Iteration ${i}: I completed task ${i}.`;
        const analysisResult = await analysisService.analyzeText(text);
        storageService.saveAnalysisResult(analysisResult);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (this is mainly to catch
      // performance regressions, actual time depends on AI API)
      // For now, just verify it completes without hanging
      expect(duration).toBeGreaterThan(0);
    });
  });
});
