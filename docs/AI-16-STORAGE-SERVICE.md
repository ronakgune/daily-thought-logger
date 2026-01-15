# AI-16: Storage Service Implementation

## Overview

The `StorageService` provides transactional storage of AI analysis results with proper foreign key relationships. It ensures that every extracted segment (todo, idea, learning, accomplishment) is linked to its source log for full traceability.

## Key Features

1. **Transactional Storage**: All log and segment inserts happen atomically - either everything is saved or nothing is
2. **Foreign Key Traceability**: Every segment has a `log_id` that links back to the source log
3. **Type-Safe**: Full TypeScript support with proper type definitions
4. **Simple API**: Easy-to-use methods for saving and retrieving analysis results

## Architecture

### Storage Pipeline

The storage pipeline follows these steps:

1. Create log record with transcript and metadata
2. Get the generated log_id
3. For each segment in the analysis:
   - Insert into appropriate table (todos, ideas, learnings, accomplishments)
   - Set log_id foreign key to maintain relationship
4. Use database transaction to ensure atomicity

### Database Schema

```sql
-- Main log table
logs: id, date, audio_path, transcript, summary, created_at, updated_at

-- Segment tables (all reference logs via log_id FK)
todos: id, log_id, text, completed, due_date, priority, created_at, updated_at
ideas: id, log_id, text, status, tags, created_at, updated_at
learnings: id, log_id, text, category, created_at
accomplishments: id, log_id, text, impact, created_at
```

All segment tables have `ON DELETE CASCADE` so deleting a log automatically deletes all associated segments.

## Usage

### Basic Example

```typescript
import { StorageService } from './services/storage';
import { DatabaseService } from './services/database';
import { AnalysisResult } from './types';

// Initialize services
const db = new DatabaseService();
const storage = new StorageService(db);

// Save an analysis result
const analysisResult: AnalysisResult = {
  transcript: "I completed the API integration. Need to write tests next.",
  segments: [
    {
      type: 'accomplishment',
      text: 'Completed API integration',
      confidence: 0.95
    },
    {
      type: 'todo',
      text: 'Write tests for API',
      priority: 'high',
      confidence: 0.92
    }
  ]
};

const audioPath = '/recordings/2024-01-15-morning.wav';
const result = storage.saveAnalysisResult(analysisResult, audioPath);

console.log(`Saved log ${result.id}`);
console.log(`- Accomplishments: ${result.accomplishments.length}`);
console.log(`- Todos: ${result.todos.length}`);
```

### Retrieving Logs with Segments

```typescript
// Get a specific log with all its segments
const log = storage.getLogWithSegments(42);
if (log) {
  console.log(`Log from ${log.date}:`);
  console.log(`Transcript: ${log.transcript}`);
  console.log(`Todos: ${log.todos.length}`);
  console.log(`Ideas: ${log.ideas.length}`);
}

// Get all logs with pagination
const allLogs = storage.getAllLogsWithSegments({ limit: 10, offset: 0 });
allLogs.forEach(log => {
  console.log(`${log.date}: ${log.transcript}`);
});
```

### Traceability - View Source Log

The foreign key relationship enables "view source log" functionality:

```typescript
// Get a todo from the database
const todo = db.getTodoById(123);

// Trace back to the source log
const sourceLog = storage.getLogWithSegments(todo.logId);
console.log(`This todo came from: ${sourceLog.transcript}`);
```

## Type Definitions

### AnalysisResult

```typescript
interface AnalysisResult {
  transcript: string;
  segments: Segment[];
}
```

### Segment

```typescript
interface Segment {
  type: SegmentType; // 'todo' | 'idea' | 'learning' | 'accomplishment'
  text: string;
  confidence?: number;

  // Type-specific fields
  priority?: string;      // For todos: 'high' | 'medium' | 'low'
  category?: string;      // For ideas
  topic?: string;         // For learnings
}
```

### LogWithSegments

```typescript
interface LogWithSegments extends Log {
  todos: Todo[];
  ideas: Idea[];
  learnings: Learning[];
  accomplishments: Accomplishment[];
}
```

## Field Mappings

The StorageService automatically maps analysis segment fields to database schema:

| Segment Field | Database Field | Notes |
|--------------|----------------|-------|
| `priority: 'high'` | `priority: 1` | Converted to number |
| `priority: 'medium'` | `priority: 2` | Default if not specified |
| `priority: 'low'` | `priority: 3` | |
| `category` (ideas) | `tags: ["category"]` | Stored as JSON array |
| `topic` (learnings) | `category` | Direct mapping |
| - | `status: 'raw'` | Default for new ideas |
| - | `impact: 'medium'` | Default for accomplishments |
| - | `completed: false` | Default for todos |

## Error Handling

The StorageService uses the DatabaseService transaction mechanism which automatically rolls back on errors:

```typescript
try {
  const result = storage.saveAnalysisResult(analysisResult, audioPath);
  console.log('Successfully saved');
} catch (error) {
  console.error('Failed to save:', error);
  // Database automatically rolled back - no partial data
}
```

Common errors:
- `ValidationError`: Invalid data (e.g., text too long, invalid date format)
- `DatabaseError`: Database operation failed
- `NotFoundError`: Referenced entity not found

## Testing

Comprehensive test suite in `tests/storage.test.ts`:

- Basic storage operations
- Foreign key relationships
- Transaction atomicity
- Priority conversion
- Segment type mapping
- Retrieval operations
- Traceability
- Full pipeline integration

Run tests:
```bash
npm test storage.test.ts
```

## Performance Considerations

1. **Batch Operations**: The transaction mechanism ensures all inserts complete in a single database round-trip
2. **Indexes**: All FK columns (log_id) are indexed for fast lookups
3. **Cascade Deletes**: Foreign key constraints handle cleanup automatically

## Integration with Other Services

### With GeminiService

```typescript
import { GeminiService } from './services/gemini';
import { StorageService } from './services/storage';

const gemini = new GeminiService(apiKey);
const storage = new StorageService(db);

// Analyze transcript
const transcript = await gemini.transcribeAudio(audioBuffer);
const analysis = await gemini.analyzeTranscript(transcript);

// Parse and store results
const result = storage.saveAnalysisResult({
  transcript: transcript.text,
  segments: parseSegments(analysis.content) // Your parsing logic
}, audioPath);
```

### With PendingQueueService (AI-18)

```typescript
import { PendingQueueService } from './services/pending-queue';

const queue = new PendingQueueService(storage);

// Queue saves data locally first, retries API later
const result = await queue.queueLog({
  transcript: 'My thought...',
  segments: [...]
}, audioPath);
```

## Files

- **Implementation**: `src/services/storage.ts`
- **Tests**: `tests/storage.test.ts`
- **Types**: `src/types/index.ts` (AnalysisResult, Segment)
- **Database Types**: `src/types/database.ts` (LogWithSegments, etc.)

## Acceptance Criteria

- [x] Log created with all fields (transcript, audio_path, date)
- [x] All segments stored with correct log_id FK
- [x] Transaction rollback on failure (atomicity guaranteed)
- [x] StorageService in `src/services/storage.ts`
- [x] Integration tests for full pipeline in `tests/storage.test.ts`
- [x] Traceability: Every segment has log_id for "view source log" functionality
- [x] Exported from `src/services/index.ts`

## Next Steps

1. **AI-17**: Connect to Gemini API for analysis
2. **AI-18**: Implement pending queue for offline support
3. **AI-19**: Build UI to display logs and segments
