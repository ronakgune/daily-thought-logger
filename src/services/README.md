# Segment Extractor Service

The segment extractor service processes raw segments from Gemini API responses and provides confidence scoring, validation, and organization features.

## Features

- Parse segment arrays from JSON responses
- Normalize confidence scores to 0-1 range (handles 0-100 and other formats)
- Filter low-confidence segments
- Tag segments as "needs review" based on configurable threshold
- Sort segments by type for UI display
- Provide detailed statistics

## Usage

### Basic Usage

```typescript
import { parseAndExtract } from './services/segment-extractor';

// From Gemini API response
const apiResponse = {
  segments: [
    {
      type: 'todo',
      content: 'Implement user authentication',
      confidence: 95, // 0-100 range - will be normalized
    },
    {
      type: 'idea',
      content: 'Consider using OAuth',
      confidence: 0.75, // Already in 0-1 range
    },
  ],
};

const result = parseAndExtract(apiResponse);

console.log(result.segments); // Processed segments
console.log(result.stats); // Statistics
```

### With Configuration

```typescript
import { extractSegments } from './services/segment-extractor';

const rawSegments = [
  /* ... */
];

const result = extractSegments(rawSegments, {
  minConfidence: 0.5, // Filter out low confidence segments
  reviewThreshold: 0.7, // Mark segments below this as "needs review"
  sortByType: true, // Sort by type (TODO, IDEA, LEARNING)
  normalizeConfidence: true, // Normalize confidence scores
});
```

## Confidence Levels

- **High confidence (> 0.8)**: Auto-categorize, high reliability
- **Medium confidence (0.5 - 0.8)**: Show confidence indicator in UI
- **Low confidence (< 0.5)**: Mark as "needs review", requires user verification

## Segment Types

Supported segment types with aliases:

- `todo` / `todos` / `task` → `SegmentType.TODO`
- `idea` / `ideas` → `SegmentType.IDEA`
- `learning` / `learnings` / `note` → `SegmentType.LEARNING`

## API

### `parseAndExtract(jsonResponse, config?)`

Parse JSON response and extract segments.

**Parameters:**

- `jsonResponse`: JSON string or object with `segments` array
- `config`: Optional extraction configuration

**Returns:** `ExtractionResult` with processed segments and statistics

### `extractSegments(rawSegments, config?)`

Extract and process raw segments.

**Parameters:**

- `rawSegments`: Array of raw segments
- `config`: Optional extraction configuration

**Returns:** `ExtractionResult`

### `normalizeConfidence(confidence)`

Normalize confidence score to 0-1 range.

**Parameters:**

- `confidence`: Raw confidence score (0-1, 0-100, or other)

**Returns:** Normalized score (0-1)

### `getConfidenceLevel(confidence)`

Determine confidence level from score.

**Parameters:**

- `confidence`: Normalized confidence score (0-1)

**Returns:** `ConfidenceLevel` enum (HIGH, MEDIUM, LOW)

### `validateSegmentType(type)`

Validate and normalize segment type string.

**Parameters:**

- `type`: Raw type string

**Returns:** `SegmentType` enum

**Throws:** Error if type is invalid

## Example Response

```typescript
{
  segments: [
    {
      type: SegmentType.TODO,
      content: "Implement authentication",
      confidence: 0.95,
      confidenceLevel: ConfidenceLevel.HIGH,
      needsReview: false,
      timestamp: 1705234567890,
      metadata: { priority: "high" }
    }
  ],
  stats: {
    total: 3,
    byType: {
      todo: 2,
      idea: 1,
      learning: 0
    },
    byConfidenceLevel: {
      high: 2,
      medium: 1,
      low: 0
    },
    needsReview: 0
  }
}
```

## Error Handling

- Invalid JSON: Throws parse error
- Invalid segment type: Skips segment with warning
- Missing segments array: Throws structure error
- Invalid confidence values: Uses default (0.5) or clamps to 0-1

## Testing

Run tests:

```bash
npm test -- segment-extractor
```

All tests cover:

- Confidence normalization
- Type validation
- Segment processing
- Filtering and sorting
- Statistics calculation
- Full integration scenarios
