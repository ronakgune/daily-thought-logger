/**
 * Segment extraction and confidence scoring service
 * @module services/segment-extractor
 */

import {
  RawSegment,
  ProcessedSegment,
  ExtractionResult,
  ExtractionConfig,
  SegmentType,
  ConfidenceLevel,
} from '../types';

/**
 * Default configuration for segment extraction
 */
const DEFAULT_CONFIG: Required<ExtractionConfig> = {
  minConfidence: 0,
  reviewThreshold: 0.5,
  sortByType: true,
  normalizeConfidence: true,
};

/**
 * Normalizes confidence score to 0-1 range
 * Handles various input formats:
 * - Already 0-1: pass through
 * - 0-100: divide by 100
 * - Negative or > 100: clamp to 0-1
 *
 * @param confidence - Raw confidence score
 * @returns Normalized confidence score between 0 and 1
 */
export function normalizeConfidence(confidence: number | undefined): number {
  if (confidence === undefined || confidence === null) {
    return 0.5; // Default to medium confidence if not provided
  }

  let normalized = confidence;

  // If score appears to be in 0-100 range, normalize it
  if (normalized > 1 && normalized <= 100) {
    normalized = normalized / 100;
  }

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Determines confidence level based on normalized score
 * Boundaries:
 * - HIGH: > 0.8 (values 0.81-1.0)
 * - MEDIUM: 0.5-0.8 (values 0.5-0.8 inclusive)
 * - LOW: < 0.5 (values 0.0-0.49)
 *
 * @param confidence - Normalized confidence score (0-1)
 * @returns Confidence level enum
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence > 0.8) {
    return ConfidenceLevel.HIGH;
  } else if (confidence >= 0.5) {
    return ConfidenceLevel.MEDIUM;
  } else {
    return ConfidenceLevel.LOW;
  }
}

/**
 * Validates and normalizes segment type
 *
 * @param type - Raw type string from API
 * @returns Valid SegmentType or throws error
 * @throws {Error} If type is invalid
 */
export function validateSegmentType(type: string): SegmentType {
  const normalizedType = type.toLowerCase().trim();

  if (normalizedType === SegmentType.TODO || normalizedType === 'todos' || normalizedType === 'task') {
    return SegmentType.TODO;
  } else if (normalizedType === SegmentType.IDEA || normalizedType === 'ideas') {
    return SegmentType.IDEA;
  } else if (normalizedType === SegmentType.LEARNING || normalizedType === 'learnings' || normalizedType === 'note') {
    return SegmentType.LEARNING;
  } else {
    throw new Error(`Invalid segment type: ${type}`);
  }
}

/**
 * Validates segment content is not empty or whitespace-only
 *
 * @param content - Content to validate
 * @throws {Error} If content is empty or whitespace-only
 */
export function validateContent(content: string): void {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Segment content cannot be empty or whitespace-only');
  }
}

/**
 * Processes a raw segment into a normalized processed segment
 *
 * @param raw - Raw segment from API
 * @param config - Extraction configuration
 * @returns Processed segment with normalized values
 */
export function processSegment(
  raw: RawSegment,
  config: Required<ExtractionConfig>
): ProcessedSegment {
  // Validate content before processing
  validateContent(raw.content);

  // Always normalize confidence to ensure it's in 0-1 range
  const normalizedConfidence = config.normalizeConfidence
    ? normalizeConfidence(raw.confidence)
    : normalizeConfidence(raw.confidence ?? 0.5);

  const confidenceLevel = getConfidenceLevel(normalizedConfidence);
  const needsReview = normalizedConfidence < config.reviewThreshold;

  return {
    type: validateSegmentType(raw.type),
    content: raw.content.trim(),
    confidence: normalizedConfidence,
    confidenceLevel,
    needsReview,
    timestamp: raw.timestamp ?? Date.now(),
    metadata: raw.metadata,
  };
}

/**
 * Sorts segments by type for UI display
 * Order: TODO, IDEA, LEARNING
 *
 * @param segments - Array of processed segments
 * @returns Sorted array of segments
 */
export function sortSegmentsByType(segments: ProcessedSegment[]): ProcessedSegment[] {
  const typeOrder = {
    [SegmentType.TODO]: 0,
    [SegmentType.IDEA]: 1,
    [SegmentType.LEARNING]: 2,
  };

  return [...segments].sort((a, b) => {
    const orderDiff = typeOrder[a.type] - typeOrder[b.type];
    if (orderDiff !== 0) return orderDiff;

    // Within same type, sort by confidence (highest first)
    return b.confidence - a.confidence;
  });
}

/**
 * Calculates statistics for extraction result
 *
 * @param segments - Array of processed segments
 * @returns Statistics object
 */
export function calculateStats(segments: ProcessedSegment[]): ExtractionResult['stats'] {
  const stats: ExtractionResult['stats'] = {
    total: segments.length,
    byType: {
      [SegmentType.TODO]: 0,
      [SegmentType.IDEA]: 0,
      [SegmentType.LEARNING]: 0,
    },
    byConfidenceLevel: {
      [ConfidenceLevel.HIGH]: 0,
      [ConfidenceLevel.MEDIUM]: 0,
      [ConfidenceLevel.LOW]: 0,
    },
    needsReview: 0,
  };

  for (const segment of segments) {
    stats.byType[segment.type]++;
    stats.byConfidenceLevel[segment.confidenceLevel]++;
    if (segment.needsReview) {
      stats.needsReview++;
    }
  }

  return stats;
}

/**
 * Extracts and processes segments from Gemini API response
 *
 * @param rawSegments - Array of raw segments from API
 * @param config - Optional extraction configuration
 * @returns Extraction result with processed segments and statistics
 */
export function extractSegments(
  rawSegments: RawSegment[],
  config: ExtractionConfig = {}
): ExtractionResult {
  const mergedConfig: Required<ExtractionConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Process all segments
  let processedSegments: ProcessedSegment[] = [];

  for (const raw of rawSegments) {
    try {
      const processed = processSegment(raw, mergedConfig);

      // Filter by minimum confidence if specified
      if (processed.confidence >= mergedConfig.minConfidence) {
        processedSegments.push(processed);
      }
    } catch (error) {
      // Skip invalid segments (e.g., unknown type)
      console.warn(`Skipping invalid segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sort by type if configured
  if (mergedConfig.sortByType) {
    processedSegments = sortSegmentsByType(processedSegments);
  }

  // Calculate statistics
  const stats = calculateStats(processedSegments);

  return {
    segments: processedSegments,
    stats,
  };
}

/**
 * Parses JSON response from Gemini API and extracts segments
 *
 * @param jsonResponse - JSON string or object from API
 * @param config - Optional extraction configuration
 * @returns Extraction result with processed segments and statistics
 * @throws {Error} If JSON parsing fails or structure is invalid
 */
export function parseAndExtract(
  jsonResponse: string | { segments?: RawSegment[] },
  config: ExtractionConfig = {}
): ExtractionResult {
  let parsed: { segments?: RawSegment[] };

  if (typeof jsonResponse === 'string') {
    try {
      parsed = JSON.parse(jsonResponse);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    parsed = jsonResponse;
  }

  if (!parsed.segments || !Array.isArray(parsed.segments)) {
    throw new Error('Invalid response structure: missing or invalid segments array');
  }

  return extractSegments(parsed.segments, config);
}
