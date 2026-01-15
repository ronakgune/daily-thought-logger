/**
 * Types for segment extraction and processing
 * @module types
 */

/**
 * Segment type enumeration
 */
export enum SegmentType {
  TODO = 'todo',
  IDEA = 'idea',
  LEARNING = 'learning',
}

/**
 * Confidence level enumeration
 */
export enum ConfidenceLevel {
  HIGH = 'high',     // > 0.8
  MEDIUM = 'medium', // 0.5 - 0.8
  LOW = 'low',       // < 0.5
}

/**
 * Raw segment from Gemini API response
 */
export interface RawSegment {
  type: string;
  content: string;
  confidence?: number; // May be in different ranges (0-1, 0-100, etc.)
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Processed segment with normalized confidence
 */
export interface ProcessedSegment {
  type: SegmentType;
  content: string;
  confidence: number; // Normalized to 0-1 range
  confidenceLevel: ConfidenceLevel;
  needsReview: boolean;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Extraction result with statistics
 */
export interface ExtractionResult {
  segments: ProcessedSegment[];
  stats: {
    total: number;
    byType: Record<SegmentType, number>;
    byConfidenceLevel: Record<ConfidenceLevel, number>;
    needsReview: number;
  };
}

/**
 * Configuration for segment extraction
 */
export interface ExtractionConfig {
  minConfidence?: number; // Minimum confidence to include (default: 0)
  reviewThreshold?: number; // Threshold for needs review flag (default: 0.5)
  sortByType?: boolean; // Whether to sort segments by type (default: true)
  normalizeConfidence?: boolean; // Whether to normalize confidence scores (default: true)
}
