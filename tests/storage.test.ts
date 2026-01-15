/**
 * StorageService Tests
 * AI-16: Tests for storage pipeline with FK relationships
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../src/services/storage';
import { DatabaseService } from '../src/services/database';
import { AnalysisResult } from '../src/types';

describe('StorageService', () => {
  let db: DatabaseService;
  let storage: StorageService;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new DatabaseService(':memory:');
    storage = new StorageService(db);
  });

  afterEach(() => {
    db.close();
  });

  // ============================================================================
  // Basic Storage Tests
  // ============================================================================

  describe('saveAnalysisResult', () => {
    it('should save a simple analysis result with one todo', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'I need to finish the report by tomorrow.',
        segments: [
          {
            type: 'todo',
            text: 'Finish the report',
            priority: 'high',
            confidence: 0.95,
          },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.transcript).toBe('I need to finish the report by tomorrow.');
      expect(result.todos).toHaveLength(1);
      expect(result.todos[0].text).toBe('Finish the report');
      expect(result.todos[0].priority).toBe(1); // high = 1
      expect(result.todos[0].logId).toBe(result.id);
    });

    it('should save analysis result with audio path', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Test transcript',
        segments: [],
      };

      const audioPath = '/path/to/audio.wav';
      const result = storage.saveAnalysisResult(analysisResult, audioPath);

      expect(result.audioPath).toBe(audioPath);
    });

    it('should save analysis result with multiple segment types', () => {
      const analysisResult: AnalysisResult = {
        transcript:
          'I completed the API integration. Now I need to write tests. ' +
          'I learned that async/await is cleaner than promises. ' +
          'I have an idea to refactor the error handling.',
        segments: [
          {
            type: 'accomplishment',
            text: 'Completed the API integration',
            confidence: 0.9,
          },
          {
            type: 'todo',
            text: 'Write tests for API integration',
            priority: 'high',
            confidence: 0.95,
          },
          {
            type: 'learning',
            text: 'async/await is cleaner than promises',
            topic: 'javascript',
            confidence: 0.85,
          },
          {
            type: 'idea',
            text: 'Refactor error handling',
            category: 'architecture',
            confidence: 0.8,
          },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);

      expect(result.accomplishments).toHaveLength(1);
      expect(result.todos).toHaveLength(1);
      expect(result.learnings).toHaveLength(1);
      expect(result.ideas).toHaveLength(1);

      // Verify all segments have correct log_id FK
      expect(result.accomplishments[0].logId).toBe(result.id);
      expect(result.todos[0].logId).toBe(result.id);
      expect(result.learnings[0].logId).toBe(result.id);
      expect(result.ideas[0].logId).toBe(result.id);
    });

    it('should save empty segments array', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Just a simple note with no actionable items.',
        segments: [],
      };

      const result = storage.saveAnalysisResult(analysisResult);

      expect(result.id).toBeDefined();
      expect(result.transcript).toBe('Just a simple note with no actionable items.');
      expect(result.todos).toHaveLength(0);
      expect(result.ideas).toHaveLength(0);
      expect(result.learnings).toHaveLength(0);
      expect(result.accomplishments).toHaveLength(0);
    });
  });

  // ============================================================================
  // Foreign Key Relationship Tests
  // ============================================================================

  describe('Foreign Key Relationships', () => {
    it('should maintain log_id foreign key on all segments', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Multi-segment test',
        segments: [
          { type: 'todo', text: 'Task 1', priority: 'medium' },
          { type: 'todo', text: 'Task 2', priority: 'low' },
          { type: 'idea', text: 'Idea 1', category: 'feature' },
          { type: 'learning', text: 'Learning 1', topic: 'design' },
          { type: 'accomplishment', text: 'Achievement 1' },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      const logId = result.id;

      // Verify all segments reference the same log
      result.todos.forEach((todo) => {
        expect(todo.logId).toBe(logId);
      });
      result.ideas.forEach((idea) => {
        expect(idea.logId).toBe(logId);
      });
      result.learnings.forEach((learning) => {
        expect(learning.logId).toBe(logId);
      });
      result.accomplishments.forEach((accomplishment) => {
        expect(accomplishment.logId).toBe(logId);
      });
    });

    it('should cascade delete segments when log is deleted', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Test cascade delete',
        segments: [
          { type: 'todo', text: 'Task 1', priority: 'high' },
          { type: 'idea', text: 'Idea 1' },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      const logId = result.id;

      // Verify segments exist
      expect(result.todos).toHaveLength(1);
      expect(result.ideas).toHaveLength(1);

      // Delete the log
      db.deleteLog(logId);

      // Verify log is deleted
      const deletedLog = db.getLogById(logId);
      expect(deletedLog).toBeNull();

      // Verify segments are also deleted (cascade)
      const todos = db.getTodosByLogId(logId);
      const ideas = db.getIdeasByLogId(logId);
      expect(todos).toHaveLength(0);
      expect(ideas).toHaveLength(0);
    });
  });

  // ============================================================================
  // Transaction Atomicity Tests
  // ============================================================================

  describe('Transaction Atomicity', () => {
    it('should save all segments in a single transaction', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Atomicity test',
        segments: [
          { type: 'todo', text: 'Task 1', priority: 'high' },
          { type: 'todo', text: 'Task 2', priority: 'medium' },
          { type: 'idea', text: 'Idea 1' },
          { type: 'learning', text: 'Learning 1', topic: 'testing' },
          { type: 'accomplishment', text: 'Achievement 1' },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);

      // All segments should be saved together
      expect(result.todos).toHaveLength(2);
      expect(result.ideas).toHaveLength(1);
      expect(result.learnings).toHaveLength(1);
      expect(result.accomplishments).toHaveLength(1);

      // Verify by querying database
      const retrieved = db.getLogWithSegments(result.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.todos).toHaveLength(2);
      expect(retrieved!.ideas).toHaveLength(1);
      expect(retrieved!.learnings).toHaveLength(1);
      expect(retrieved!.accomplishments).toHaveLength(1);
    });

    it('should handle transaction rollback on failure gracefully', () => {
      // This test verifies that if any part of the save fails,
      // the entire transaction is rolled back
      const analysisResult: AnalysisResult = {
        transcript: 'A'.repeat(15000), // Exceeds max length
        segments: [{ type: 'todo', text: 'This should not be saved' }],
      };

      // Should throw validation error
      expect(() => {
        storage.saveAnalysisResult(analysisResult);
      }).toThrow();

      // Verify nothing was saved
      const allLogs = db.getAllLogs();
      expect(allLogs).toHaveLength(0);

      const allTodos = db.getAllTodos();
      expect(allTodos).toHaveLength(0);
    });
  });

  // ============================================================================
  // Priority Conversion Tests
  // ============================================================================

  describe('Priority Conversion', () => {
    it('should convert high priority to 1', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'High priority task',
        segments: [{ type: 'todo', text: 'Urgent task', priority: 'high' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.todos[0].priority).toBe(1);
    });

    it('should convert medium priority to 2', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Medium priority task',
        segments: [{ type: 'todo', text: 'Normal task', priority: 'medium' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.todos[0].priority).toBe(2);
    });

    it('should convert low priority to 3', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Low priority task',
        segments: [{ type: 'todo', text: 'Deferred task', priority: 'low' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.todos[0].priority).toBe(3);
    });

    it('should default to medium (2) when priority is undefined', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Task with no priority',
        segments: [{ type: 'todo', text: 'Task without priority' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.todos[0].priority).toBe(2);
    });
  });

  // ============================================================================
  // Segment Type Mapping Tests
  // ============================================================================

  describe('Segment Type Mapping', () => {
    it('should map idea category to tags', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Idea mapping test',
        segments: [
          {
            type: 'idea',
            text: 'Add dark mode',
            category: 'feature',
          },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.ideas[0].tags).toBe('["feature"]');
    });

    it('should map learning topic to category', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Learning mapping test',
        segments: [
          {
            type: 'learning',
            text: 'React hooks are powerful',
            topic: 'react',
          },
        ],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.learnings[0].category).toBe('react');
    });

    it('should set idea status to raw by default', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Idea status test',
        segments: [{ type: 'idea', text: 'New idea' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.ideas[0].status).toBe('raw');
    });

    it('should set accomplishment impact to medium by default', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Accomplishment test',
        segments: [{ type: 'accomplishment', text: 'Finished feature' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.accomplishments[0].impact).toBe('medium');
    });

    it('should set todo completed to false by default', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Todo test',
        segments: [{ type: 'todo', text: 'New task' }],
      };

      const result = storage.saveAnalysisResult(analysisResult);
      expect(result.todos[0].completed).toBe(false);
    });
  });

  // ============================================================================
  // Retrieval Tests
  // ============================================================================

  describe('getLogWithSegments', () => {
    it('should retrieve log with all segments', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Retrieval test',
        segments: [
          { type: 'todo', text: 'Task 1', priority: 'high' },
          { type: 'idea', text: 'Idea 1', category: 'feature' },
        ],
      };

      const saved = storage.saveAnalysisResult(analysisResult);
      const retrieved = storage.getLogWithSegments(saved.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(saved.id);
      expect(retrieved!.transcript).toBe(saved.transcript);
      expect(retrieved!.todos).toHaveLength(1);
      expect(retrieved!.ideas).toHaveLength(1);
    });

    it('should return null for non-existent log', () => {
      const result = storage.getLogWithSegments(999);
      expect(result).toBeNull();
    });
  });

  describe('getAllLogsWithSegments', () => {
    it('should retrieve all logs with segments', () => {
      // Create multiple logs
      storage.saveAnalysisResult({
        transcript: 'Log 1',
        segments: [{ type: 'todo', text: 'Task 1' }],
      });

      storage.saveAnalysisResult({
        transcript: 'Log 2',
        segments: [{ type: 'idea', text: 'Idea 1' }],
      });

      storage.saveAnalysisResult({
        transcript: 'Log 3',
        segments: [{ type: 'learning', text: 'Learning 1' }],
      });

      const allLogs = storage.getAllLogsWithSegments();
      expect(allLogs).toHaveLength(3);

      // Verify each log has its segments
      expect(allLogs.some((log) => log.todos.length > 0)).toBe(true);
      expect(allLogs.some((log) => log.ideas.length > 0)).toBe(true);
      expect(allLogs.some((log) => log.learnings.length > 0)).toBe(true);
    });

    it('should support pagination', () => {
      // Create 5 logs
      for (let i = 0; i < 5; i++) {
        storage.saveAnalysisResult({
          transcript: `Log ${i}`,
          segments: [],
        });
      }

      const limitedLogs = storage.getAllLogsWithSegments({ limit: 2 });
      expect(limitedLogs).toHaveLength(2);

      const offsetLogs = storage.getAllLogsWithSegments({
        limit: 2,
        offset: 2,
      });
      expect(offsetLogs).toHaveLength(2);
    });

    it('should return empty array when no logs exist', () => {
      const allLogs = storage.getAllLogsWithSegments();
      expect(allLogs).toHaveLength(0);
    });
  });

  // ============================================================================
  // Traceability Tests
  // ============================================================================

  describe('Traceability', () => {
    it('should enable view source log functionality for todos', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Traceability test for todos',
        segments: [
          { type: 'todo', text: 'Important task', priority: 'high' },
        ],
      };

      const log = storage.saveAnalysisResult(analysisResult);
      const todo = log.todos[0];

      // Can trace back to source log via log_id
      const sourceLog = storage.getLogWithSegments(todo.logId);
      expect(sourceLog).not.toBeNull();
      expect(sourceLog!.id).toBe(log.id);
      expect(sourceLog!.transcript).toBe('Traceability test for todos');
    });

    it('should enable view source log functionality for ideas', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Traceability test for ideas',
        segments: [{ type: 'idea', text: 'Great idea', category: 'product' }],
      };

      const log = storage.saveAnalysisResult(analysisResult);
      const idea = log.ideas[0];

      const sourceLog = storage.getLogWithSegments(idea.logId);
      expect(sourceLog).not.toBeNull();
      expect(sourceLog!.id).toBe(log.id);
      expect(sourceLog!.transcript).toBe('Traceability test for ideas');
    });

    it('should enable view source log functionality for learnings', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Traceability test for learnings',
        segments: [
          { type: 'learning', text: 'Important lesson', topic: 'testing' },
        ],
      };

      const log = storage.saveAnalysisResult(analysisResult);
      const learning = log.learnings[0];

      const sourceLog = storage.getLogWithSegments(learning.logId);
      expect(sourceLog).not.toBeNull();
      expect(sourceLog!.id).toBe(log.id);
      expect(sourceLog!.transcript).toBe('Traceability test for learnings');
    });

    it('should enable view source log functionality for accomplishments', () => {
      const analysisResult: AnalysisResult = {
        transcript: 'Traceability test for accomplishments',
        segments: [{ type: 'accomplishment', text: 'Big achievement' }],
      };

      const log = storage.saveAnalysisResult(analysisResult);
      const accomplishment = log.accomplishments[0];

      const sourceLog = storage.getLogWithSegments(accomplishment.logId);
      expect(sourceLog).not.toBeNull();
      expect(sourceLog!.id).toBe(log.id);
      expect(sourceLog!.transcript).toBe(
        'Traceability test for accomplishments'
      );
    });
  });

  // ============================================================================
  // Full Pipeline Integration Test
  // ============================================================================

  describe('Full Pipeline Integration', () => {
    it('should handle complete workflow from analysis to retrieval', () => {
      // Simulate a realistic voice log analysis
      const analysisResult: AnalysisResult = {
        transcript:
          'Today I finished implementing the authentication system. ' +
          'I learned that JWT tokens are better than session cookies for SPAs. ' +
          'I need to write unit tests for the auth endpoints and update the API documentation. ' +
          'I also have an idea to add social login support in the future.',
        segments: [
          {
            type: 'accomplishment',
            text: 'Implemented authentication system',
            confidence: 0.95,
          },
          {
            type: 'learning',
            text: 'JWT tokens are better than session cookies for SPAs',
            topic: 'authentication',
            confidence: 0.9,
          },
          {
            type: 'todo',
            text: 'Write unit tests for auth endpoints',
            priority: 'high',
            confidence: 0.92,
          },
          {
            type: 'todo',
            text: 'Update API documentation',
            priority: 'medium',
            confidence: 0.88,
          },
          {
            type: 'idea',
            text: 'Add social login support',
            category: 'feature',
            confidence: 0.85,
          },
        ],
      };

      const audioPath = '/recordings/2024-01-15-morning.wav';

      // Save the analysis result
      const savedLog = storage.saveAnalysisResult(analysisResult, audioPath);

      // Verify log was created
      expect(savedLog.id).toBeDefined();
      expect(savedLog.transcript).toBe(analysisResult.transcript);
      expect(savedLog.audioPath).toBe(audioPath);

      // Verify all segments were saved with correct log_id
      expect(savedLog.accomplishments).toHaveLength(1);
      expect(savedLog.learnings).toHaveLength(1);
      expect(savedLog.todos).toHaveLength(2);
      expect(savedLog.ideas).toHaveLength(1);

      // Verify FK relationships
      expect(savedLog.accomplishments[0].logId).toBe(savedLog.id);
      expect(savedLog.learnings[0].logId).toBe(savedLog.id);
      expect(savedLog.todos[0].logId).toBe(savedLog.id);
      expect(savedLog.todos[1].logId).toBe(savedLog.id);
      expect(savedLog.ideas[0].logId).toBe(savedLog.id);

      // Verify segment content
      expect(savedLog.accomplishments[0].text).toBe(
        'Implemented authentication system'
      );
      expect(savedLog.learnings[0].text).toBe(
        'JWT tokens are better than session cookies for SPAs'
      );
      expect(savedLog.learnings[0].category).toBe('authentication');
      expect(savedLog.todos[0].text).toBe('Write unit tests for auth endpoints');
      expect(savedLog.todos[0].priority).toBe(1); // high
      expect(savedLog.todos[1].text).toBe('Update API documentation');
      expect(savedLog.todos[1].priority).toBe(2); // medium
      expect(savedLog.ideas[0].text).toBe('Add social login support');
      expect(savedLog.ideas[0].tags).toBe('["feature"]');

      // Test retrieval
      const retrievedLog = storage.getLogWithSegments(savedLog.id);
      expect(retrievedLog).not.toBeNull();
      expect(retrievedLog!.transcript).toBe(analysisResult.transcript);
      expect(retrievedLog!.todos).toHaveLength(2);

      // Test traceability - can navigate from todo back to source log
      const todo = savedLog.todos[0];
      const sourceLog = db.getLogById(todo.logId);
      expect(sourceLog).not.toBeNull();
      expect(sourceLog!.transcript).toContain('authentication system');
    });
  });
});
