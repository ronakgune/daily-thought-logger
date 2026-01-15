# AI-18: Pending Analysis State - Implementation Documentation

## Overview
This feature implements a robust pending analysis system to handle cases where audio analysis cannot complete immediately due to network issues, API unavailability, or rate limiting.

## Database Schema Changes

### Schema Version
Updated from version 1 to version 2.

### New Fields in `logs` Table
- `pending_analysis` (INTEGER, default 0): Flag indicating if log is awaiting analysis
- `retry_count` (INTEGER, default 0): Number of retry attempts made
- `last_error` (TEXT, nullable): Last error message encountered

### New Index
- `idx_logs_pending`: Index on `pending_analysis` field for efficient queries

### Migration
The migration is automatically applied when the DatabaseService initializes:
```sql
ALTER TABLE logs ADD COLUMN pending_analysis INTEGER DEFAULT 0;
ALTER TABLE logs ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE logs ADD COLUMN last_error TEXT;
CREATE INDEX IF NOT EXISTS idx_logs_pending ON logs(pending_analysis);
```

## Service Implementation

### PendingQueueService (`src/services/pending-queue.ts`)

#### Key Features
1. **Audio Persistence**: Saves audio files to disk before attempting analysis
2. **Automatic Pending State**: Marks logs as pending when analysis fails
3. **Smart Retry Logic**: Distinguishes between retryable and non-retryable errors
4. **Exponential Backoff**: Configurable retry delays with exponential backoff
5. **Batch Processing**: Can retry all pending items at once

#### Core Methods

##### `queueForAnalysis(audioBuffer: Buffer, date: string): Promise<number>`
Primary method to queue audio for analysis:
1. Saves audio file to disk immediately
2. Creates log record with audio path
3. Attempts transcription/analysis
4. On failure, marks as pending with error details
5. Returns log ID regardless of success/failure

**Retryable Errors:**
- `NETWORK_ERROR`: No internet connection
- `SERVICE_UNAVAILABLE`: API temporarily down
- `RATE_LIMIT_EXCEEDED`: Too many requests

**Non-Retryable Errors:**
- `INVALID_API_KEY`: Authentication failure
- `INVALID_REQUEST`: Malformed request
- `CONTENT_FILTERED`: Safety violation
- Others

##### `getPendingItems(): Promise<PendingLog[]>`
Returns all logs marked as pending that have audio files.

##### `retryPending(logId: number): Promise<void>`
Retries analysis for a specific pending log:
- Checks if log is still pending
- Verifies retry count hasn't exceeded max
- Reads audio file from disk
- Attempts analysis
- Updates status based on result

##### `retryAllPending(): Promise<void>`
Processes all pending logs sequentially:
- Prevents concurrent processing
- Adds delays between retries
- Continues on individual failures
- Reports success/failure counts

#### Configuration

```typescript
interface RetryConfig {
  maxRetries: number;           // Default: 3
  retryDelay: number;           // Default: 5000ms
  exponentialBackoff: boolean;  // Default: true
}
```

## DatabaseService Extensions

### New Methods

#### `getPendingLogs(): Log[]`
Returns all logs where `pending_analysis = 1`, ordered by creation date.

#### `markLogAsPending(logId: number, errorMessage?: string): Log`
- Sets `pending_analysis = 1`
- Increments `retry_count`
- Stores `last_error`
- Updates `updated_at` timestamp

#### `markLogAsAnalyzed(logId: number): Log`
- Sets `pending_analysis = 0`
- Clears `last_error`
- Keeps `retry_count` for historical tracking

#### `resetRetryCount(logId: number): Log`
Resets `retry_count` to 0 (useful for manual intervention).

## Type Definitions

### PendingLog
Extends `Log` with guaranteed non-null `audioPath`:
```typescript
interface PendingLog extends Log {
  audioPath: string;
}
```

### QueueResult
```typescript
interface QueueResult {
  success: boolean;
  logId?: number;
  error?: string;
}
```

## Audio Storage

Audio files are stored in the user data directory:
```
{userData}/audio-recordings/{date}-{timestamp}.wav
```

Example: `2024-01-15-1705337700000.wav`

## Usage Examples

### Queue Audio for Analysis
```typescript
import { pendingQueueService } from './services';

const audioBuffer = /* recorded audio */;
const logId = await pendingQueueService.queueForAnalysis(
  audioBuffer,
  '2024-01-15'
);

// Log is created immediately, may be pending if analysis failed
```

### Check for Pending Items
```typescript
const hasPending = await pendingQueueService.hasPendingItems();
if (hasPending) {
  console.log('There are items waiting for analysis');
}
```

### Retry Pending Items on App Start
```typescript
// In your app initialization
async function initApp() {
  // ... other initialization

  // Retry pending items from previous session
  await pendingQueueService.retryAllPending();
}
```

### Retry on Network Reconnection
```typescript
// Listen for network status changes
window.addEventListener('online', async () => {
  console.log('Network available, retrying pending items...');
  await pendingQueueService.retryAllPending();
});
```

### Manual Retry
```typescript
// Get pending items
const pending = await pendingQueueService.getPendingItems();

// Retry specific item
if (pending.length > 0) {
  await pendingQueueService.retryPending(pending[0].id);
}
```

## Error Handling

### Retryable Errors
When a retryable error occurs:
1. Log is marked as pending
2. Retry count is incremented
3. Error message is stored
4. Audio file remains on disk for future retry

### Non-Retryable Errors
When a non-retryable error occurs:
1. Log is still marked as pending (for visibility)
2. Error message is stored
3. No automatic retry will occur
4. Manual intervention may be needed

### Max Retries Exceeded
When `retry_count >= maxRetries`:
1. Automatic retry is skipped
2. Log remains pending
3. Manual retry is still possible after `resetRetryCount()`

## Testing

Comprehensive test suite in `tests/pending-queue.test.ts`:
- Database schema validation
- Queue operations with various error types
- Retry logic and limits
- Batch processing
- Error handling
- Utility methods

Run tests:
```bash
npm test -- pending-queue.test.ts
```

## Integration Points

### UI Indicators
Logs with `pendingAnalysis = true` should show:
- Visual "pending" indicator (spinner, icon, badge)
- Error message if available
- Retry count
- Manual retry button

### App Lifecycle
1. **Startup**: Call `retryAllPending()` to process items from previous session
2. **Network Change**: Listen for online events and retry
3. **Background**: Optionally schedule periodic retry attempts

### Storage Integration
Works alongside existing storage service (AI-16):
- Audio files saved before storage pipeline
- Pending logs can be retried later
- Storage pipeline handles successful analysis

## Future Enhancements

### Potential Improvements
1. **Priority Queue**: Prioritize recent recordings
2. **Background Worker**: Dedicated process for retries
3. **Notification System**: Alert user when retries succeed/fail
4. **Analytics**: Track retry success rates
5. **Cleanup**: Auto-delete old audio files after success
6. **Network Detection**: Pause retries when offline

### API Endpoint (for future UI)
```typescript
// IPC handlers for renderer process
ipcMain.handle('pending:get-all', async () => {
  return await pendingQueueService.getPendingItems();
});

ipcMain.handle('pending:retry', async (event, logId) => {
  await pendingQueueService.retryPending(logId);
});

ipcMain.handle('pending:retry-all', async () => {
  await pendingQueueService.retryAllPending();
});
```

## Files Modified/Created

### Modified
- `src/database/schema.ts`: Added schema v2 with new fields and migration
- `src/types/database.ts`: Updated Log interface with pending fields
- `src/services/database.ts`: Added migration support and pending methods
- `src/services/index.ts`: Exported PendingQueueService

### Created
- `src/services/pending-queue.ts`: Main service implementation
- `tests/pending-queue.test.ts`: Comprehensive test suite
- `docs/AI-18-IMPLEMENTATION.md`: This documentation

## Acceptance Criteria Status

- [x] Audio saved before analysis attempt
- [x] Pending state tracked in database
- [x] Auto-retry on reconnection (via `retryAllPending()`)
- [x] Manual retry option (`retryPending()`)
- [x] UI indicator support (via `getPendingItems()`)
- [x] Retry limit to prevent infinite loops
- [x] Error message storage for debugging
- [x] Exponential backoff for retries
- [x] Batch retry processing
- [x] Database migration for existing installations
