# AnalysisService Documentation

## Overview

The `AnalysisService` is the core analysis pipeline for the Daily Thought Logger. It orchestrates the full flow from audio input to structured, categorized segments.

**Location**: `src/services/analysis.ts`

## Pipeline Flow

```
Audio Buffer → Transcription → Classification → Validation → Structured Output
     ↓              ↓                ↓              ↓              ↓
  Buffer     Gemini API      Gemini API    JSON Parse    AnalysisResult
             (Speech)        (+Prompt)     +Validate     with Segments
```

### Step-by-Step

1. **Input**: Accept audio buffer or text
2. **Transcription**: Convert audio to text using Gemini (if audio)
3. **Classification**: Send text + classification prompt to Gemini
4. **Parsing**: Extract JSON from response (handles markdown code blocks)
5. **Validation**: Validate structure and types
6. **Output**: Return typed `AnalysisResult` with segments

## API

### analyzeAudio(audioBuffer, options?)

Analyze audio and extract structured segments.

```typescript
const analysis = await analysisService.analyzeAudio(audioBuffer, {
  mimeType: 'audio/wav',
  includeRaw: false
});

console.log(analysis.transcript);
console.log(analysis.segments); // [{ type: 'todo', text: '...', ... }]
```

**Parameters:**
- `audioBuffer: Buffer` - The audio data
- `options.mimeType?: string` - MIME type (default: 'audio/wav')
- `options.includeRaw?: boolean` - Include raw AI response in logs

**Returns:** `Promise<AnalysisResult>`

**Throws:** `GeminiError` on failure

### analyzeText(text, options?)

Analyze text content and extract structured segments (useful for testing).

```typescript
const analysis = await analysisService.analyzeText(
  "I finished the report. I need to send it to the team.",
  { includeRaw: true }
);
```

**Parameters:**
- `text: string` - The text to analyze
- `options.includeRaw?: boolean` - Include raw AI response in logs

**Returns:** `Promise<AnalysisResult>`

**Throws:** `GeminiError` on failure

## Data Structures

### AnalysisResult

```typescript
interface AnalysisResult {
  transcript: string;      // The original/transcribed text
  segments: Segment[];     // Extracted and categorized segments
}
```

### Segment

```typescript
interface Segment {
  type: SegmentType;       // 'accomplishment' | 'todo' | 'idea' | 'learning'
  text: string;            // The extracted content
  confidence?: number;     // AI confidence (0-1)
  priority?: Priority;     // Only for todos: 'high' | 'medium' | 'low'
  category?: string;       // Only for ideas: e.g., 'product', 'personal'
  topic?: string;          // Only for learnings: e.g., 'typescript', 'design'
}
```

## Classification Prompt

The classification prompt is defined in `src/prompts/classification.ts` and instructs Gemini to:

1. Identify different content types from transcripts
2. Extract segments into 4 categories:
   - **ACCOMPLISHMENTS**: Things completed/achieved
   - **TODOS**: Tasks or action items
   - **IDEAS**: Concepts or plans for future
   - **LEARNINGS**: Insights or knowledge gained
3. Assign confidence scores
4. Add type-specific metadata (priority for todos, etc.)

### Example Input/Output

**Input transcript:**
```
"I finished the user authentication module today.
I need to write tests for it tomorrow.
I'm thinking we could add OAuth support in the future."
```

**Output segments:**
```json
[
  {
    "type": "accomplishment",
    "text": "Finished the user authentication module",
    "confidence": 0.95
  },
  {
    "type": "todo",
    "text": "Write tests for user authentication module",
    "confidence": 0.9,
    "priority": "high"
  },
  {
    "type": "idea",
    "text": "Add OAuth support to authentication",
    "confidence": 0.85,
    "category": "product"
  }
]
```

## Error Handling

The service handles various error cases:

1. **Empty/Invalid Input**: Throws `INVALID_REQUEST` error
2. **Malformed JSON**: Attempts to clean markdown code blocks, then throws if unparseable
3. **Invalid Segments**: Skips invalid segments with warning logs
4. **Invalid Types**: Filters out segments with unrecognized types
5. **API Errors**: Propagates `GeminiError` from underlying services

### Validation Rules

- **Type**: Must be one of: `accomplishment`, `todo`, `idea`, `learning` (case-insensitive)
- **Text**: Required, must be non-empty string
- **Confidence**: Optional, must be 0.0-1.0 if provided
- **Priority**: Optional for todos, must be `high`, `medium`, or `low` (defaults to `medium`)
- **Category**: Optional for ideas, any string
- **Topic**: Optional for learnings, any string

## Logging

The service includes debug logging for each pipeline step:

```
[AnalysisService] Starting audio analysis
[AnalysisService] Step 1: Transcribing audio...
[AnalysisService] Transcription complete: I finished the...
[AnalysisService] Step 2: Analyzing content with classification prompt...
[AnalysisService] Step 3: Parsing JSON response...
[AnalysisService] Step 4: Validating and transforming response...
[AnalysisService] Analysis complete: extracted 3 segments
```

Warnings are logged for validation issues:
```
[AnalysisService] Warning: Segment 2 has invalid type "unknown", skipping
[AnalysisService] Warning: Segment 5 has invalid confidence "2.5", ignoring
```

## Usage Examples

### Basic Audio Analysis

```typescript
import { analysisService } from './services';
import fs from 'fs';

const audioBuffer = fs.readFileSync('recording.wav');
const result = await analysisService.analyzeAudio(audioBuffer);

// Process segments
for (const segment of result.segments) {
  switch (segment.type) {
    case 'todo':
      console.log(`TODO [${segment.priority}]: ${segment.text}`);
      break;
    case 'idea':
      console.log(`IDEA (${segment.category}): ${segment.text}`);
      break;
    // ... handle other types
  }
}
```

### Text Analysis for Testing

```typescript
const testTranscript = "I learned that TypeScript generics improve type safety.";
const result = await analysisService.analyzeText(testTranscript);

expect(result.segments[0].type).toBe('learning');
expect(result.segments[0].topic).toBe('typescript');
```

### With Custom Gemini Instance

```typescript
import { AnalysisService, GeminiService } from './services';

const customGemini = new GeminiService();
await customGemini.setApiKey('your-api-key');

const customAnalysis = new AnalysisService(customGemini);
const result = await customAnalysis.analyzeAudio(buffer);
```

## Testing

Comprehensive tests are in `tests/analysis.test.ts`:

- Unit tests for each method
- JSON parsing edge cases (markdown blocks, invalid JSON)
- Validation logic (types, confidence, priorities)
- Error handling
- Empty/whitespace handling
- Mock integration with GeminiService

Run tests:
```bash
npm test tests/analysis.test.ts
```

## Future Enhancements

Potential improvements:

1. **Streaming Analysis**: Process long audio in chunks
2. **Confidence Thresholds**: Flag low-confidence segments for review
3. **Custom Prompts**: Allow per-user prompt customization
4. **Language Detection**: Auto-detect and handle multiple languages
5. **Batch Processing**: Analyze multiple recordings in parallel
6. **Caching**: Cache analysis results for identical inputs

## Dependencies

- `GeminiService` - Handles Gemini API communication
- `CLASSIFICATION_PROMPT` - Defines the analysis instructions
- Types from `src/types/index.ts` and `src/types/gemini.ts`

## Related Files

- `src/services/analysis.ts` - Main implementation
- `src/prompts/classification.ts` - Classification prompt
- `tests/analysis.test.ts` - Test suite
- `src/types/index.ts` - Type definitions
