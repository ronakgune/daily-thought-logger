/**
 * Database Service Tests
 * AI-10: Tests for DatabaseService CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../src/services/database';
import {
  NotFoundError,
  ValidationError,
  CreateLogInput,
  CreateTodoInput,
  CreateIdeaInput,
  CreateLearningInput,
  CreateAccomplishmentInput,
  CreateSummaryInput,
} from '../src/types/database';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new DatabaseService(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  // ============================================================================
  // Log Tests
  // ============================================================================

  describe('Logs', () => {
    it('should create a log', () => {
      const logData: CreateLogInput = {
        date: '2024-01-15',
        transcript: 'Test transcript',
        summary: 'Test summary',
      };

      const log = db.createLog(logData);

      expect(log.id).toBeDefined();
      expect(log.date).toBe('2024-01-15');
      expect(log.transcript).toBe('Test transcript');
      expect(log.summary).toBe('Test summary');
      expect(log.createdAt).toBeDefined();
    });

    it('should get log by id', () => {
      const created = db.createLog({ date: '2024-01-15' });
      const retrieved = db.getLogById(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
    });

    it('should return null for non-existent log', () => {
      const result = db.getLogById(999);
      expect(result).toBeNull();
    });

    it('should get all logs with pagination', () => {
      db.createLog({ date: '2024-01-15' });
      db.createLog({ date: '2024-01-16' });
      db.createLog({ date: '2024-01-17' });

      const allLogs = db.getAllLogs();
      expect(allLogs.length).toBe(3);

      const limitedLogs = db.getAllLogs({ limit: 2 });
      expect(limitedLogs.length).toBe(2);

      const offsetLogs = db.getAllLogs({ limit: 2, offset: 1 });
      expect(offsetLogs.length).toBe(2);
    });

    it('should get logs by date range', () => {
      db.createLog({ date: '2024-01-10' });
      db.createLog({ date: '2024-01-15' });
      db.createLog({ date: '2024-01-20' });

      const logs = db.getLogsByDateRange(
        new Date('2024-01-12'),
        new Date('2024-01-18')
      );

      expect(logs.length).toBe(1);
      expect(logs[0].date).toBe('2024-01-15');
    });

    it('should delete a log', () => {
      const log = db.createLog({ date: '2024-01-15' });
      db.deleteLog(log.id);

      const result = db.getLogById(log.id);
      expect(result).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent log', () => {
      expect(() => db.deleteLog(999)).toThrow(NotFoundError);
    });

    it('should throw ValidationError for missing date', () => {
      expect(() => db.createLog({ date: '' })).toThrow(ValidationError);
    });
  });

  // ============================================================================
  // Todo Tests
  // ============================================================================

  describe('Todos', () => {
    let logId: number;

    beforeEach(() => {
      const log = db.createLog({ date: '2024-01-15' });
      logId = log.id;
    });

    it('should create a todo', () => {
      const todoData: CreateTodoInput = {
        logId,
        text: 'Test todo',
        priority: 1,
      };

      const todo = db.createTodo(todoData);

      expect(todo.id).toBeDefined();
      expect(todo.logId).toBe(logId);
      expect(todo.text).toBe('Test todo');
      expect(todo.priority).toBe(1);
      expect(todo.completed).toBe(false);
    });

    it('should get todo by id', () => {
      const created = db.createTodo({ logId, text: 'Test' });
      const retrieved = db.getTodoById(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
    });

    it('should get todos by log id', () => {
      db.createTodo({ logId, text: 'Todo 1' });
      db.createTodo({ logId, text: 'Todo 2' });

      const todos = db.getTodosByLogId(logId);
      expect(todos.length).toBe(2);
    });

    it('should get all todos filtered by completed status', () => {
      db.createTodo({ logId, text: 'Todo 1', completed: false });
      db.createTodo({ logId, text: 'Todo 2', completed: true });

      const incompleteTodos = db.getAllTodos({ completed: false });
      expect(incompleteTodos.length).toBe(1);
      expect(incompleteTodos[0].text).toBe('Todo 1');

      const completedTodos = db.getAllTodos({ completed: true });
      expect(completedTodos.length).toBe(1);
      expect(completedTodos[0].text).toBe('Todo 2');
    });

    it('should update a todo', () => {
      const todo = db.createTodo({ logId, text: 'Original' });

      const updated = db.updateTodo(todo.id, {
        text: 'Updated',
        completed: true,
        priority: 1,
      });

      expect(updated.text).toBe('Updated');
      expect(updated.completed).toBe(true);
      expect(updated.priority).toBe(1);
    });

    it('should delete a todo', () => {
      const todo = db.createTodo({ logId, text: 'Test' });
      db.deleteTodo(todo.id);

      const result = db.getTodoById(todo.id);
      expect(result).toBeNull();
    });

    it('should cascade delete todos when log is deleted', () => {
      db.createTodo({ logId, text: 'Todo 1' });
      db.createTodo({ logId, text: 'Todo 2' });

      db.deleteLog(logId);

      const todos = db.getTodosByLogId(logId);
      expect(todos.length).toBe(0);
    });
  });

  // ============================================================================
  // Idea Tests
  // ============================================================================

  describe('Ideas', () => {
    let logId: number;

    beforeEach(() => {
      const log = db.createLog({ date: '2024-01-15' });
      logId = log.id;
    });

    it('should create an idea', () => {
      const ideaData: CreateIdeaInput = {
        logId,
        text: 'Test idea',
        status: 'developing',
        tags: ['tag1', 'tag2'],
      };

      const idea = db.createIdea(ideaData);

      expect(idea.id).toBeDefined();
      expect(idea.text).toBe('Test idea');
      expect(idea.status).toBe('developing');
      expect(idea.tags).toBe('["tag1","tag2"]');
    });

    it('should default idea status to raw', () => {
      const idea = db.createIdea({ logId, text: 'Test' });
      expect(idea.status).toBe('raw');
    });

    it('should get ideas by log id', () => {
      db.createIdea({ logId, text: 'Idea 1' });
      db.createIdea({ logId, text: 'Idea 2' });

      const ideas = db.getIdeasByLogId(logId);
      expect(ideas.length).toBe(2);
    });

    it('should get all ideas filtered by status', () => {
      db.createIdea({ logId, text: 'Idea 1', status: 'raw' });
      db.createIdea({ logId, text: 'Idea 2', status: 'actionable' });

      const actionableIdeas = db.getAllIdeas({ status: 'actionable' });
      expect(actionableIdeas.length).toBe(1);
      expect(actionableIdeas[0].text).toBe('Idea 2');
    });

    it('should update an idea', () => {
      const idea = db.createIdea({ logId, text: 'Original' });

      const updated = db.updateIdea(idea.id, {
        text: 'Updated',
        status: 'archived',
        tags: ['new-tag'],
      });

      expect(updated.text).toBe('Updated');
      expect(updated.status).toBe('archived');
      expect(updated.tags).toBe('["new-tag"]');
    });

    it('should delete an idea', () => {
      const idea = db.createIdea({ logId, text: 'Test' });
      db.deleteIdea(idea.id);

      const result = db.getIdeaById(idea.id);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Learning Tests
  // ============================================================================

  describe('Learnings', () => {
    let logId: number;

    beforeEach(() => {
      const log = db.createLog({ date: '2024-01-15' });
      logId = log.id;
    });

    it('should create a learning', () => {
      const learningData: CreateLearningInput = {
        logId,
        text: 'Learned something new',
        category: 'programming',
      };

      const learning = db.createLearning(learningData);

      expect(learning.id).toBeDefined();
      expect(learning.text).toBe('Learned something new');
      expect(learning.category).toBe('programming');
    });

    it('should get learnings by log id', () => {
      db.createLearning({ logId, text: 'Learning 1' });
      db.createLearning({ logId, text: 'Learning 2' });

      const learnings = db.getLearningsByLogId(logId);
      expect(learnings.length).toBe(2);
    });

    it('should get all learnings', () => {
      db.createLearning({ logId, text: 'Learning 1' });
      db.createLearning({ logId, text: 'Learning 2' });

      const learnings = db.getAllLearnings();
      expect(learnings.length).toBe(2);
    });

    it('should delete a learning', () => {
      const learning = db.createLearning({ logId, text: 'Test' });
      db.deleteLearning(learning.id);

      const result = db.getLearningById(learning.id);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Accomplishment Tests
  // ============================================================================

  describe('Accomplishments', () => {
    let logId: number;

    beforeEach(() => {
      const log = db.createLog({ date: '2024-01-15' });
      logId = log.id;
    });

    it('should create an accomplishment', () => {
      const accomplishmentData: CreateAccomplishmentInput = {
        logId,
        text: 'Completed feature',
        impact: 'high',
      };

      const accomplishment = db.createAccomplishment(accomplishmentData);

      expect(accomplishment.id).toBeDefined();
      expect(accomplishment.text).toBe('Completed feature');
      expect(accomplishment.impact).toBe('high');
    });

    it('should default accomplishment impact to medium', () => {
      const accomplishment = db.createAccomplishment({ logId, text: 'Test' });
      expect(accomplishment.impact).toBe('medium');
    });

    it('should get accomplishments by log id', () => {
      db.createAccomplishment({ logId, text: 'Accomplishment 1' });
      db.createAccomplishment({ logId, text: 'Accomplishment 2' });

      const accomplishments = db.getAccomplishmentsByLogId(logId);
      expect(accomplishments.length).toBe(2);
    });

    it('should get all accomplishments', () => {
      db.createAccomplishment({ logId, text: 'Accomplishment 1' });
      db.createAccomplishment({ logId, text: 'Accomplishment 2' });

      const accomplishments = db.getAllAccomplishments();
      expect(accomplishments.length).toBe(2);
    });

    it('should delete an accomplishment', () => {
      const accomplishment = db.createAccomplishment({ logId, text: 'Test' });
      db.deleteAccomplishment(accomplishment.id);

      const result = db.getAccomplishmentById(accomplishment.id);
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Summary Tests
  // ============================================================================

  describe('Summaries', () => {
    it('should create a summary', () => {
      const summaryData: CreateSummaryInput = {
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        content: 'Weekly summary content',
        highlights: ['highlight 1', 'highlight 2'],
      };

      const summary = db.createSummary(summaryData);

      expect(summary.id).toBeDefined();
      expect(summary.weekStart).toBe('2024-01-15');
      expect(summary.weekEnd).toBe('2024-01-21');
      expect(summary.content).toBe('Weekly summary content');
      expect(summary.highlights).toBe('["highlight 1","highlight 2"]');
    });

    it('should get summary by week', () => {
      db.createSummary({
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        content: 'Summary content',
      });

      const summary = db.getSummaryByWeek(new Date('2024-01-15'));

      expect(summary).not.toBeNull();
      expect(summary!.weekStart).toBe('2024-01-15');
    });

    it('should return null for non-existent week summary', () => {
      const summary = db.getSummaryByWeek(new Date('2024-01-15'));
      expect(summary).toBeNull();
    });

    it('should get all summaries', () => {
      db.createSummary({
        weekStart: '2024-01-08',
        weekEnd: '2024-01-14',
        content: 'Summary 1',
      });
      db.createSummary({
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        content: 'Summary 2',
      });

      const summaries = db.getAllSummaries();
      expect(summaries.length).toBe(2);
    });

    it('should delete a summary', () => {
      const summary = db.createSummary({
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        content: 'Summary content',
      });

      db.deleteSummary(summary.id);

      const result = db.getSummaryByWeek(new Date('2024-01-15'));
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Transaction Tests
  // ============================================================================

  describe('Transactions', () => {
    it('should save log with all segments atomically', () => {
      const result = db.saveLogWithSegments(
        { date: '2024-01-15', transcript: 'Test transcript' },
        {
          todos: [
            { logId: 0, text: 'Todo 1', priority: 1 },
            { logId: 0, text: 'Todo 2', priority: 2 },
          ],
          ideas: [{ logId: 0, text: 'Idea 1', status: 'raw' }],
          learnings: [{ logId: 0, text: 'Learning 1', category: 'tech' }],
          accomplishments: [{ logId: 0, text: 'Done 1', impact: 'high' }],
        }
      );

      expect(result.id).toBeDefined();
      expect(result.todos.length).toBe(2);
      expect(result.ideas.length).toBe(1);
      expect(result.learnings.length).toBe(1);
      expect(result.accomplishments.length).toBe(1);

      // Verify all segments have correct logId
      expect(result.todos[0].logId).toBe(result.id);
      expect(result.ideas[0].logId).toBe(result.id);
      expect(result.learnings[0].logId).toBe(result.id);
      expect(result.accomplishments[0].logId).toBe(result.id);
    });

    it('should get log with all segments', () => {
      const saved = db.saveLogWithSegments(
        { date: '2024-01-15' },
        {
          todos: [{ logId: 0, text: 'Todo 1' }],
          ideas: [{ logId: 0, text: 'Idea 1' }],
        }
      );

      const retrieved = db.getLogWithSegments(saved.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.todos.length).toBe(1);
      expect(retrieved!.ideas.length).toBe(1);
      expect(retrieved!.learnings.length).toBe(0);
      expect(retrieved!.accomplishments.length).toBe(0);
    });

    it('should return null for non-existent log with segments', () => {
      const result = db.getLogWithSegments(999);
      expect(result).toBeNull();
    });
  });
});
