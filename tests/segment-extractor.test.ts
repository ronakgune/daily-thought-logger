/**
 * Tests for segment extraction and confidence scoring
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeConfidence,
  getConfidenceLevel,
  validateSegmentType,
  processSegment,
  sortSegmentsByType,
  calculateStats,
  extractSegments,
  parseAndExtract,
} from '../src/services/segment-extractor';
import {
  RawSegment,
  ProcessedSegment,
  SegmentType,
  ConfidenceLevel,
} from '../src/types';

describe('normalizeConfidence', () => {
  it('should pass through values already in 0-1 range', () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(0.5)).toBe(0.5);
    expect(normalizeConfidence(0.75)).toBe(0.75);
    expect(normalizeConfidence(1)).toBe(1);
  });

  it('should normalize 0-100 range to 0-1', () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(50)).toBe(0.5);
    expect(normalizeConfidence(75)).toBe(0.75);
    expect(normalizeConfidence(100)).toBe(1);
  });

  it('should clamp values below 0 to 0', () => {
    expect(normalizeConfidence(-1)).toBe(0);
    expect(normalizeConfidence(-100)).toBe(0);
  });

  it('should clamp values above 100 to 1', () => {
    expect(normalizeConfidence(150)).toBe(1);
    expect(normalizeConfidence(200)).toBe(1);
  });

  it('should return 0.5 for undefined confidence', () => {
    expect(normalizeConfidence(undefined)).toBe(0.5);
  });
});

describe('getConfidenceLevel', () => {
  it('should return HIGH for confidence > 0.8', () => {
    expect(getConfidenceLevel(0.81)).toBe(ConfidenceLevel.HIGH);
    expect(getConfidenceLevel(0.9)).toBe(ConfidenceLevel.HIGH);
    expect(getConfidenceLevel(1)).toBe(ConfidenceLevel.HIGH);
  });

  it('should return MEDIUM for confidence 0.5-0.8', () => {
    expect(getConfidenceLevel(0.5)).toBe(ConfidenceLevel.MEDIUM);
    expect(getConfidenceLevel(0.65)).toBe(ConfidenceLevel.MEDIUM);
    expect(getConfidenceLevel(0.8)).toBe(ConfidenceLevel.MEDIUM);
  });

  it('should return LOW for confidence < 0.5', () => {
    expect(getConfidenceLevel(0)).toBe(ConfidenceLevel.LOW);
    expect(getConfidenceLevel(0.25)).toBe(ConfidenceLevel.LOW);
    expect(getConfidenceLevel(0.49)).toBe(ConfidenceLevel.LOW);
  });
});

describe('validateSegmentType', () => {
  it('should validate and normalize TODO type', () => {
    expect(validateSegmentType('todo')).toBe(SegmentType.TODO);
    expect(validateSegmentType('TODO')).toBe(SegmentType.TODO);
    expect(validateSegmentType('todos')).toBe(SegmentType.TODO);
    expect(validateSegmentType('task')).toBe(SegmentType.TODO);
    expect(validateSegmentType('  todo  ')).toBe(SegmentType.TODO);
  });

  it('should validate and normalize IDEA type', () => {
    expect(validateSegmentType('idea')).toBe(SegmentType.IDEA);
    expect(validateSegmentType('IDEA')).toBe(SegmentType.IDEA);
    expect(validateSegmentType('ideas')).toBe(SegmentType.IDEA);
  });

  it('should validate and normalize LEARNING type', () => {
    expect(validateSegmentType('learning')).toBe(SegmentType.LEARNING);
    expect(validateSegmentType('LEARNING')).toBe(SegmentType.LEARNING);
    expect(validateSegmentType('learnings')).toBe(SegmentType.LEARNING);
    expect(validateSegmentType('note')).toBe(SegmentType.LEARNING);
  });

  it('should throw error for invalid type', () => {
    expect(() => validateSegmentType('invalid')).toThrow('Invalid segment type: invalid');
    expect(() => validateSegmentType('unknown')).toThrow('Invalid segment type: unknown');
  });
});

describe('processSegment', () => {
  const defaultConfig = {
    minConfidence: 0,
    reviewThreshold: 0.5,
    sortByType: true,
    normalizeConfidence: true,
  };

  it('should process segment with normalized confidence', () => {
    const raw: RawSegment = {
      type: 'todo',
      content: 'Complete the task',
      confidence: 85, // 0-100 range
      timestamp: 1234567890,
    };

    const processed = processSegment(raw, defaultConfig);

    expect(processed.type).toBe(SegmentType.TODO);
    expect(processed.content).toBe('Complete the task');
    expect(processed.confidence).toBe(0.85);
    expect(processed.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    expect(processed.needsReview).toBe(false);
    expect(processed.timestamp).toBe(1234567890);
  });

  it('should mark low confidence segments as needs review', () => {
    const raw: RawSegment = {
      type: 'idea',
      content: 'Maybe try this approach',
      confidence: 0.3,
    };

    const processed = processSegment(raw, defaultConfig);

    expect(processed.needsReview).toBe(true);
    expect(processed.confidenceLevel).toBe(ConfidenceLevel.LOW);
  });

  it('should not mark high confidence segments as needs review', () => {
    const raw: RawSegment = {
      type: 'learning',
      content: 'Learned about TypeScript',
      confidence: 0.9,
    };

    const processed = processSegment(raw, defaultConfig);

    expect(processed.needsReview).toBe(false);
    expect(processed.confidenceLevel).toBe(ConfidenceLevel.HIGH);
  });

  it('should use default timestamp if not provided', () => {
    const raw: RawSegment = {
      type: 'todo',
      content: 'Task',
      confidence: 0.8,
    };

    const before = Date.now();
    const processed = processSegment(raw, defaultConfig);
    const after = Date.now();

    expect(processed.timestamp).toBeGreaterThanOrEqual(before);
    expect(processed.timestamp).toBeLessThanOrEqual(after);
  });

  it('should trim content whitespace', () => {
    const raw: RawSegment = {
      type: 'todo',
      content: '  Task with spaces  ',
      confidence: 0.8,
    };

    const processed = processSegment(raw, defaultConfig);

    expect(processed.content).toBe('Task with spaces');
  });

  it('should preserve metadata', () => {
    const raw: RawSegment = {
      type: 'todo',
      content: 'Task',
      confidence: 0.8,
      metadata: { source: 'voice', duration: 30 },
    };

    const processed = processSegment(raw, defaultConfig);

    expect(processed.metadata).toEqual({ source: 'voice', duration: 30 });
  });

  it('should respect custom review threshold', () => {
    const raw: RawSegment = {
      type: 'todo',
      content: 'Task',
      confidence: 0.6,
    };

    const customConfig = {
      ...defaultConfig,
      reviewThreshold: 0.7,
    };

    const processed = processSegment(raw, customConfig);

    expect(processed.needsReview).toBe(true);
  });
});

describe('sortSegmentsByType', () => {
  it('should sort segments by type in correct order', () => {
    const segments: ProcessedSegment[] = [
      {
        type: SegmentType.LEARNING,
        content: 'Learning 1',
        confidence: 0.8,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 1,
      },
      {
        type: SegmentType.TODO,
        content: 'Todo 1',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.HIGH,
        needsReview: false,
        timestamp: 2,
      },
      {
        type: SegmentType.IDEA,
        content: 'Idea 1',
        confidence: 0.7,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 3,
      },
    ];

    const sorted = sortSegmentsByType(segments);

    expect(sorted[0].type).toBe(SegmentType.TODO);
    expect(sorted[1].type).toBe(SegmentType.IDEA);
    expect(sorted[2].type).toBe(SegmentType.LEARNING);
  });

  it('should sort by confidence within same type', () => {
    const segments: ProcessedSegment[] = [
      {
        type: SegmentType.TODO,
        content: 'Todo Low',
        confidence: 0.5,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 1,
      },
      {
        type: SegmentType.TODO,
        content: 'Todo High',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.HIGH,
        needsReview: false,
        timestamp: 2,
      },
      {
        type: SegmentType.TODO,
        content: 'Todo Medium',
        confidence: 0.7,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 3,
      },
    ];

    const sorted = sortSegmentsByType(segments);

    expect(sorted[0].content).toBe('Todo High');
    expect(sorted[1].content).toBe('Todo Medium');
    expect(sorted[2].content).toBe('Todo Low');
  });

  it('should not modify original array', () => {
    const segments: ProcessedSegment[] = [
      {
        type: SegmentType.IDEA,
        content: 'Idea',
        confidence: 0.8,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 1,
      },
    ];

    const original = [...segments];
    sortSegmentsByType(segments);

    expect(segments).toEqual(original);
  });
});

describe('calculateStats', () => {
  it('should calculate correct statistics', () => {
    const segments: ProcessedSegment[] = [
      {
        type: SegmentType.TODO,
        content: 'Todo 1',
        confidence: 0.9,
        confidenceLevel: ConfidenceLevel.HIGH,
        needsReview: false,
        timestamp: 1,
      },
      {
        type: SegmentType.TODO,
        content: 'Todo 2',
        confidence: 0.4,
        confidenceLevel: ConfidenceLevel.LOW,
        needsReview: true,
        timestamp: 2,
      },
      {
        type: SegmentType.IDEA,
        content: 'Idea 1',
        confidence: 0.6,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        needsReview: false,
        timestamp: 3,
      },
      {
        type: SegmentType.LEARNING,
        content: 'Learning 1',
        confidence: 0.85,
        confidenceLevel: ConfidenceLevel.HIGH,
        needsReview: false,
        timestamp: 4,
      },
    ];

    const stats = calculateStats(segments);

    expect(stats.total).toBe(4);
    expect(stats.byType[SegmentType.TODO]).toBe(2);
    expect(stats.byType[SegmentType.IDEA]).toBe(1);
    expect(stats.byType[SegmentType.LEARNING]).toBe(1);
    expect(stats.byConfidenceLevel[ConfidenceLevel.HIGH]).toBe(2);
    expect(stats.byConfidenceLevel[ConfidenceLevel.MEDIUM]).toBe(1);
    expect(stats.byConfidenceLevel[ConfidenceLevel.LOW]).toBe(1);
    expect(stats.needsReview).toBe(1);
  });

  it('should handle empty segments array', () => {
    const stats = calculateStats([]);

    expect(stats.total).toBe(0);
    expect(stats.byType[SegmentType.TODO]).toBe(0);
    expect(stats.byType[SegmentType.IDEA]).toBe(0);
    expect(stats.byType[SegmentType.LEARNING]).toBe(0);
    expect(stats.needsReview).toBe(0);
  });
});

describe('extractSegments', () => {
  it('should extract and process segments correctly', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'todo',
        content: 'Complete project',
        confidence: 90,
      },
      {
        type: 'idea',
        content: 'New feature',
        confidence: 0.7,
      },
      {
        type: 'learning',
        content: 'Learned about testing',
        confidence: 85,
      },
    ];

    const result = extractSegments(rawSegments);

    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].type).toBe(SegmentType.TODO);
    expect(result.segments[1].type).toBe(SegmentType.IDEA);
    expect(result.segments[2].type).toBe(SegmentType.LEARNING);
    expect(result.stats.total).toBe(3);
  });

  it('should filter segments by minimum confidence', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'todo',
        content: 'High confidence',
        confidence: 0.9,
      },
      {
        type: 'idea',
        content: 'Low confidence',
        confidence: 0.3,
      },
      {
        type: 'learning',
        content: 'Medium confidence',
        confidence: 0.6,
      },
    ];

    const result = extractSegments(rawSegments, { minConfidence: 0.5 });

    expect(result.segments).toHaveLength(2);
    expect(result.segments.every(s => s.confidence >= 0.5)).toBe(true);
  });

  it('should skip invalid segments and continue processing', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'todo',
        content: 'Valid todo',
        confidence: 0.8,
      },
      {
        type: 'invalid_type',
        content: 'Invalid segment',
        confidence: 0.9,
      },
      {
        type: 'idea',
        content: 'Valid idea',
        confidence: 0.7,
      },
    ];

    const result = extractSegments(rawSegments);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].type).toBe(SegmentType.TODO);
    expect(result.segments[1].type).toBe(SegmentType.IDEA);
  });

  it('should sort by type when sortByType is true', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'learning',
        content: 'Learning',
        confidence: 0.8,
      },
      {
        type: 'todo',
        content: 'Todo',
        confidence: 0.8,
      },
      {
        type: 'idea',
        content: 'Idea',
        confidence: 0.8,
      },
    ];

    const result = extractSegments(rawSegments, { sortByType: true });

    expect(result.segments[0].type).toBe(SegmentType.TODO);
    expect(result.segments[1].type).toBe(SegmentType.IDEA);
    expect(result.segments[2].type).toBe(SegmentType.LEARNING);
  });

  it('should not sort by type when sortByType is false', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'learning',
        content: 'Learning',
        confidence: 0.8,
      },
      {
        type: 'todo',
        content: 'Todo',
        confidence: 0.8,
      },
      {
        type: 'idea',
        content: 'Idea',
        confidence: 0.8,
      },
    ];

    const result = extractSegments(rawSegments, { sortByType: false });

    expect(result.segments[0].type).toBe(SegmentType.LEARNING);
    expect(result.segments[1].type).toBe(SegmentType.TODO);
    expect(result.segments[2].type).toBe(SegmentType.IDEA);
  });

  it('should include correct statistics', () => {
    const rawSegments: RawSegment[] = [
      {
        type: 'todo',
        content: 'Todo 1',
        confidence: 0.9,
      },
      {
        type: 'todo',
        content: 'Todo 2',
        confidence: 0.4,
      },
      {
        type: 'idea',
        content: 'Idea 1',
        confidence: 0.6,
      },
    ];

    const result = extractSegments(rawSegments);

    expect(result.stats.total).toBe(3);
    expect(result.stats.byType[SegmentType.TODO]).toBe(2);
    expect(result.stats.byType[SegmentType.IDEA]).toBe(1);
    expect(result.stats.needsReview).toBe(1);
  });
});

describe('parseAndExtract', () => {
  it('should parse JSON string and extract segments', () => {
    const jsonString = JSON.stringify({
      segments: [
        {
          type: 'todo',
          content: 'Task from JSON',
          confidence: 0.8,
        },
      ],
    });

    const result = parseAndExtract(jsonString);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].content).toBe('Task from JSON');
  });

  it('should accept object directly', () => {
    const jsonObject = {
      segments: [
        {
          type: 'idea',
          content: 'Idea from object',
          confidence: 0.75,
        },
      ],
    };

    const result = parseAndExtract(jsonObject);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].content).toBe('Idea from object');
  });

  it('should throw error for invalid JSON string', () => {
    const invalidJson = '{ invalid json }';

    expect(() => parseAndExtract(invalidJson)).toThrow('Failed to parse JSON response');
  });

  it('should throw error for missing segments array', () => {
    const jsonObject = {
      data: [],
    };

    expect(() => parseAndExtract(jsonObject)).toThrow(
      'Invalid response structure: missing or invalid segments array'
    );
  });

  it('should throw error for non-array segments', () => {
    const jsonObject = {
      segments: 'not an array',
    };

    expect(() => parseAndExtract(jsonObject as any)).toThrow(
      'Invalid response structure: missing or invalid segments array'
    );
  });

  it('should pass config to extractSegments', () => {
    const jsonObject = {
      segments: [
        {
          type: 'todo',
          content: 'Low confidence',
          confidence: 0.3,
        },
        {
          type: 'idea',
          content: 'High confidence',
          confidence: 0.9,
        },
      ],
    };

    const result = parseAndExtract(jsonObject, { minConfidence: 0.5 });

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].content).toBe('High confidence');
  });
});

describe('Integration: Full extraction workflow', () => {
  it('should handle realistic Gemini API response', () => {
    const apiResponse = {
      segments: [
        {
          type: 'todo',
          content: 'Implement user authentication',
          confidence: 95,
          timestamp: 1705234567890,
          metadata: { priority: 'high' },
        },
        {
          type: 'idea',
          content: 'Consider using OAuth for third-party login',
          confidence: 0.75,
          timestamp: 1705234567891,
        },
        {
          type: 'learning',
          content: 'JWT tokens expire after 24 hours by default',
          confidence: 88,
          timestamp: 1705234567892,
        },
        {
          type: 'todo',
          content: 'Maybe update the documentation',
          confidence: 45,
          timestamp: 1705234567893,
        },
      ],
    };

    const result = parseAndExtract(apiResponse);

    // Check segments are processed correctly
    expect(result.segments).toHaveLength(4);

    // Check sorting by type
    expect(result.segments[0].type).toBe(SegmentType.TODO);
    expect(result.segments[2].type).toBe(SegmentType.IDEA);
    expect(result.segments[3].type).toBe(SegmentType.LEARNING);

    // Check confidence normalization
    expect(result.segments[0].confidence).toBe(0.95);
    expect(result.segments[1].confidence).toBe(0.45);

    // Check confidence levels
    expect(result.segments[0].confidenceLevel).toBe(ConfidenceLevel.HIGH);
    expect(result.segments[2].confidenceLevel).toBe(ConfidenceLevel.MEDIUM);
    expect(result.segments[1].confidenceLevel).toBe(ConfidenceLevel.LOW);

    // Check needs review flags
    expect(result.segments[0].needsReview).toBe(false);
    expect(result.segments[1].needsReview).toBe(true);

    // Check statistics
    expect(result.stats.total).toBe(4);
    expect(result.stats.byType[SegmentType.TODO]).toBe(2);
    expect(result.stats.byType[SegmentType.IDEA]).toBe(1);
    expect(result.stats.byType[SegmentType.LEARNING]).toBe(1);
    expect(result.stats.needsReview).toBe(1);
    expect(result.stats.byConfidenceLevel[ConfidenceLevel.HIGH]).toBe(2);
    expect(result.stats.byConfidenceLevel[ConfidenceLevel.MEDIUM]).toBe(1);
    expect(result.stats.byConfidenceLevel[ConfidenceLevel.LOW]).toBe(1);
  });
});
