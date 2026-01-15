# AI-23: Wire Recording/Text to Analysis Pipeline

## Overview

This implementation connects the recording flow to the analysis pipeline from Phase 2, enabling the complete flow from audio/text input through AI analysis to database storage with real-time UI updates.

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RENDERER PROCESS                            │
│                                                                  │
│  ┌────────────────┐                                             │
│  │  User Action   │                                             │
│  │  (Record/Type) │                                             │
│  └────────┬───────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                             │
│  │   IPCClient    │                                             │
│  │  (ipc-client)  │                                             │
│  └────────┬───────┘                                             │
│           │                                                      │
│           │ IPC: analyze:audio / analyze:text                   │
│           │                                                      │
├───────────┼──────────────────────────────────────────────────────┤
│           │          ELECTRON IPC BRIDGE                         │
│           │          (preload.ts)                                │
├───────────┼──────────────────────────────────────────────────────┤
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐        MAIN PROCESS                         │
│  │  IPCHandlers   │                                             │
│  │ (ipc-handlers) │                                             │
│  └────────┬───────┘                                             │
│           │                                                      │
│           ├─────────────┐                                        │
│           │             │                                        │
│           ▼             ▼                                        │
│  ┌────────────┐  ┌──────────────┐                              │
│  │  Analysis  │  │   Storage    │                               │
│  │  Service   │  │   Service    │                               │
│  └────────────┘  └──────────────┘                               │
│           │             │                                        │
│           │             ▼                                        │
│           │      ┌──────────────┐                               │
│           │      │   Database   │                               │
│           │      │   (SQLite)   │                               │
│           │      └──────────────┘                               │
│           │                                                      │
│           │ IPC: analyze:progress                               │
│           │      analyze:complete                               │
│           │      analyze:error                                  │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────┐                                             │
│  │   Renderer     │                                             │
│  │   (UI Update)  │                                             │
│  └────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Main Process (`src/main/`)

#### 1. `ipc-handlers.ts`

The main IPC handler that orchestrates the analysis pipeline.

**Key Features:**
- Handles `analyze:audio` and `analyze:text` IPC calls
- Saves audio files to disk with unique timestamps
- Sends progress updates during analysis
- Coordinates AnalysisService and StorageService
- Sends completion/error events to renderer

**Flow for Audio:**
1. Receive audio data from renderer
2. Send progress: "Saving audio file..." (10%)
3. Save audio blob to `~/.daily-thought-logger/audio/`
4. Send progress: "Analyzing audio..." (30%)
5. Call AnalysisService.analyzeAudio()
6. Send progress: "Storing results..." (80%)
7. Call StorageService.saveAnalysisResult()
8. Send progress: "Complete" (100%)
9. Send `analyze:complete` event with results
10. Return saved log

**Flow for Text:**
1. Receive text from renderer
2. Send progress: "Analyzing text..." (30%)
3. Call AnalysisService.analyzeText()
4. Send progress: "Storing results..." (80%)
5. Call StorageService.saveAnalysisResult()
6. Send progress: "Complete" (100%)
7. Send `analyze:complete` event with results
8. Return saved log

**Error Handling:**
- Catches all errors during analysis/storage
- Sends `analyze:error` event to renderer
- Re-throws error for caller to handle

**Configuration:**
```typescript
interface AudioStorageConfig {
  audioDir: string; // Default: ~/.daily-thought-logger/audio
}
```

#### 2. `preload.ts`

Secure bridge between renderer and main process using `contextBridge`.

**Exposed API:**
```typescript
window.electron = {
  analyzeAudio: (audioData: ArrayBuffer) => Promise<LogWithSegments>,
  analyzeText: (text: string) => Promise<LogWithSegments>,
  onAnalyzeProgress: (callback) => () => void,
  onAnalyzeComplete: (callback) => () => void,
  onAnalyzeError: (callback) => () => void,
}
```

**Security:**
- Uses `contextIsolation: true`
- Exposes only type-safe, minimal API
- No direct access to Node.js or Electron internals

#### 3. `index.ts`

Main process entry point with exports and usage documentation.

### Renderer Process (`src/renderer/`)

#### 1. `ipc-client.ts`

Type-safe client for renderer-side IPC communication.

**Key Features:**
- Clean API for audio/text analysis
- Event listener management with cleanup
- Multiple callback support
- React hook for easy integration

**Usage:**
```typescript
const client = new IPCClient();

// Set up callbacks
client.onProgress((status, progress) => {
  console.log(`${status}: ${progress}%`);
});

client.onComplete((result, logId) => {
  console.log(`Analysis complete! Log ID: ${logId}`);
  refreshUI();
});

client.onError((error) => {
  console.error('Analysis failed:', error);
});

// Analyze audio
const log = await client.analyzeAudio(audioBlob.arrayBuffer());

// Analyze text
const log = await client.analyzeText("I finished the project.");

// Cleanup
client.cleanup();
```

**React Hook:**
```typescript
function RecorderComponent() {
  const ipc = useIPCClient();

  useEffect(() => {
    const removeProgress = ipc.onProgress((status, progress) => {
      setProgress({ status, progress });
    });

    return removeProgress;
  }, [ipc]);

  // Use ipc.analyzeAudio() or ipc.analyzeText()
}
```

#### 2. `index.ts`

Renderer process exports.

## IPC Communication

### Request-Response (invoke/handle)

**From Renderer to Main:**
- `analyze:audio` - Analyze audio data
  - Input: `{ audioData: ArrayBuffer }`
  - Returns: `Promise<LogWithSegments>`

- `analyze:text` - Analyze text input
  - Input: `{ text: string }`
  - Returns: `Promise<LogWithSegments>`

### Events (send/on)

**From Main to Renderer:**
- `analyze:progress` - Progress update
  - Payload: `{ status: string, progress: number }`

- `analyze:complete` - Analysis completed
  - Payload: `{ result: AnalysisResult, logId: number }`

- `analyze:error` - Analysis failed
  - Payload: `{ error: string }`

## Tests

### 1. `tests/ipc-handlers.test.ts`

Tests for main process IPC handlers.

**Coverage:**
- Handler registration/unregistration
- Audio analysis flow
- Text analysis flow
- Progress updates
- Error handling
- Audio file saving
- Directory creation
- Unique filename generation

**Key Tests:**
- ✅ Registers IPC handlers correctly
- ✅ Processes audio and saves results
- ✅ Processes text and saves results
- ✅ Sends progress updates
- ✅ Sends error events on failure
- ✅ Saves audio files with timestamps
- ✅ Creates audio directory if needed
- ✅ Generates unique filenames

### 2. `tests/ipc-client.test.ts`

Tests for renderer process IPC client.

**Coverage:**
- Client initialization
- Audio/text analysis methods
- Callback registration/cleanup
- Error handling
- Multiple callbacks
- Full workflow integration

**Key Tests:**
- ✅ Throws error if Electron API missing
- ✅ Sets up event listeners on creation
- ✅ Calls Electron API for audio analysis
- ✅ Calls Electron API for text analysis
- ✅ Registers progress callbacks
- ✅ Cleanup removes callbacks
- ✅ Supports multiple callbacks
- ✅ Handles full analysis workflow

### 3. `tests/pipeline-integration.test.ts`

End-to-end integration tests.

**Coverage:**
- Complete text-to-database flow
- Complete audio-to-database flow
- Error handling
- Multiple analyses
- Segment categorization
- Traceability
- Data integrity

**Key Tests:**
- ✅ Text flows through complete pipeline
- ✅ Audio flows through complete pipeline
- ✅ Saves audio files correctly
- ✅ Handles errors gracefully
- ✅ Processes multiple analyses
- ✅ Categorizes segments correctly
- ✅ Maintains log-to-segment traceability
- ✅ Uses correct dates

## Usage Examples

### Basic Audio Recording Flow

```typescript
// In a React component
import { IPCClient } from './renderer';

function VoiceRecorder() {
  const [ipc] = useState(() => new IPCClient());
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cleanup1 = ipc.onProgress((status, progress) => {
      setStatus(status);
      setProgress(progress);
    });

    const cleanup2 = ipc.onComplete((result, logId) => {
      console.log(`Saved log ${logId}`);
      console.log(`Found ${result.segments.length} segments`);
      // Refresh UI to show new items
      refreshLogs();
    });

    const cleanup3 = ipc.onError((error) => {
      alert(`Analysis failed: ${error}`);
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      ipc.cleanup();
    };
  }, [ipc]);

  const handleRecordComplete = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      await ipc.analyzeAudio(arrayBuffer);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <div>
      <RecordButton onComplete={handleRecordComplete} />
      <div>Status: {status}</div>
      <ProgressBar value={progress} />
    </div>
  );
}
```

### Text Input Flow

```typescript
function TextInput() {
  const ipc = useIPCClient();

  const handleSubmit = async (text: string) => {
    try {
      const log = await ipc.analyzeText(text);
      console.log(`Saved as log ${log.id}`);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(e.target.text.value);
    }}>
      <textarea name="text" />
      <button type="submit">Analyze</button>
    </form>
  );
}
```

### Main Process Initialization

```typescript
// In main.ts or index.ts
import { app, BrowserWindow } from 'electron';
import { DatabaseService } from './services/database';
import { initializeIPCHandlers } from './main';

let mainWindow: BrowserWindow | null = null;
let ipcHandlers: IPCHandlers | null = null;

app.whenReady().then(async () => {
  // Initialize database
  const db = new DatabaseService();

  // Initialize IPC handlers
  ipcHandlers = initializeIPCHandlers(db, {
    audioDir: '/path/to/audio',
  });

  // Create window
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadFile('index.html');
});

app.on('before-quit', () => {
  if (ipcHandlers) {
    ipcHandlers.unregisterHandlers();
  }
});
```

## Acceptance Criteria

- ✅ **Audio flows to analysis service** - `IPCHandlers.handleAudioAnalysis()` passes audio to `AnalysisService.analyzeAudio()`
- ✅ **Text input flows to analysis service** - `IPCHandlers.handleTextAnalysis()` passes text to `AnalysisService.analyzeText()`
- ✅ **Results stored in database** - Both flows call `StorageService.saveAnalysisResult()` which uses database transactions
- ✅ **IPC communication working** - Preload script exposes secure API, handlers respond to invoke calls
- ✅ **Progress updates received** - `analyze:progress` events sent at 10%, 30%, 80%, 100%

## Files Created

```
src/main/
├── ipc-handlers.ts    # Main IPC handlers
├── preload.ts         # Secure IPC bridge
└── index.ts           # Exports and documentation

src/renderer/
├── ipc-client.ts      # Renderer-side client
└── index.ts           # Exports and examples

tests/
├── ipc-handlers.test.ts          # IPC handler tests
├── ipc-client.test.ts            # IPC client tests
└── pipeline-integration.test.ts  # End-to-end tests

docs/
└── AI-23-IMPLEMENTATION.md        # This file
```

## Next Steps

After this implementation:

1. **Frontend Components** (Future):
   - Voice recorder UI component
   - Text input component
   - Progress indicator
   - Results display

2. **Main Window** (Future):
   - Create main Electron window
   - Load React app
   - Set up routing

3. **Testing**:
   ```bash
   npm test
   ```

4. **Integration**:
   - Connect recorder UI to IPCClient
   - Add UI refresh on completion
   - Show notifications

## Security Considerations

- **Context Isolation**: Enabled to prevent renderer from accessing Node.js
- **Preload Script**: Only exposes minimal, type-safe API
- **No Direct Access**: Renderer cannot access filesystem or Electron APIs directly
- **Input Validation**: Text length validated, audio data type-checked
- **Error Isolation**: Errors caught and sent as events, not exposed directly

## Performance

- **Audio File Saving**: Async file operations don't block IPC
- **Progress Updates**: Sent at key milestones, not continuously
- **Database Transactions**: Ensure atomicity without performance overhead
- **Memory Management**: Audio data cleaned up after saving

## Troubleshooting

**Error: "Electron API not found"**
- Ensure preload script is loaded in BrowserWindow config
- Check `contextIsolation: true` is set
- Verify preload path is correct

**Progress events not received**
- Make sure event listeners are set up before calling analyze methods
- Check that cleanup functions are called on unmount

**Audio file not saved**
- Verify audio directory has write permissions
- Check disk space
- Ensure audioDir path is absolute

**Database errors**
- Ensure database is initialized before creating IPC handlers
- Check database file permissions
- Verify SQLite schema is up to date
