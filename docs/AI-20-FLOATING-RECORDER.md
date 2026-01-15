# AI-20: FloatingRecorder Window Component - Implementation Documentation

## Overview
The FloatingRecorder is a compact, always-on-top window that appears when the user presses a global shortcut to start a voice recording. It provides visual feedback for recording state, a timer, and controls.

## Features Implemented

### Window Properties
- **Size**: 300x150px (compact design)
- **Always on top**: Window stays above all other windows
- **Frameless**: Custom title bar with drag support
- **Positioned**: Top-right corner of screen with 20px padding
- **No taskbar icon**: Uses `skipTaskbar: true`
- **Non-resizable**: Fixed size for consistent UI

### Visual States

#### 1. Recording State
- Red pulsing indicator dot
- "Recording..." label
- Running timer (MM:SS format)
- "Done" button to stop recording
- Updates every second

#### 2. Processing State
- Yellow pulsing indicator dot
- "Analyzing..." message
- Animated spinner
- No controls (automatic transition)

#### 3. Complete State
- Green solid indicator dot
- "Complete!" message
- Green checkmark icon
- Auto-closes after 2 seconds

### UI Components

#### Title Bar
- Draggable area (allows window repositioning)
- State indicator (colored dot with pulse animation)
- State message text
- No window controls (frameless)

#### Main Content Area
- Large timer display (4xl font, monospace)
- Action button (Done)
- Status messages and icons
- Centered layout

## File Structure

```
src/
├── main/
│   ├── floating-recorder-window.ts  # Window creation and management
│   ├── preload.ts                   # IPC bridge (secure)
│   └── index.example.ts             # Integration examples
├── renderer/
│   ├── components/
│   │   └── FloatingRecorder.tsx     # React component
│   ├── styles/
│   │   └── floating-recorder.css    # Component styles
│   ├── floating-recorder.html       # HTML entry point
│   └── floating-recorder.tsx        # React mount point
├── types/
│   └── recorder.ts                  # TypeScript definitions
tests/
└── floating-recorder.test.ts        # Comprehensive tests
docs/
└── AI-20-FLOATING-RECORDER.md      # This file
```

## Architecture

### Main Process (Electron)

#### FloatingRecorderWindow Class
Manages the Electron BrowserWindow instance.

**Key Methods:**
- `create(onStop?)`: Create and show the window
- `close()`: Destroy the window
- `isOpen()`: Check if window exists
- `updateState(state)`: Change recording state
- `updateTime(seconds)`: Update elapsed time
- `cleanup()`: Remove IPC handlers

**Singleton Functions:**
- `getFloatingRecorderWindow()`: Get singleton instance
- `createFloatingRecorder(onStop?)`: Shortcut to create
- `closeFloatingRecorder()`: Shortcut to close
- `isFloatingRecorderOpen()`: Shortcut to check status

#### IPC Communication

**Renderer → Main:**
- `recorder:stop`: User clicked Done button
- `recorder:close`: Close the window

**Main → Renderer:**
- `recorder:state-change`: Update recording state
- `recorder:time-update`: Update elapsed time

### Renderer Process (React)

#### FloatingRecorder Component

**State Management:**
```typescript
interface RecordingSession {
  startTime: number;
  elapsedTime: number;
  state: RecordingState;
}
```

**Effects:**
1. **Timer Effect**: Updates elapsed time every second while recording
2. **Auto-close Effect**: Closes window 2 seconds after completion

**Callbacks:**
- `handleStop()`: Transitions to processing, sends IPC message
- `handleClose()`: Sends close IPC message
- `formatTime()`: Formats seconds as MM:SS

### Preload Script
Securely exposes IPC methods to renderer:
- Whitelists specific channels
- Strips Electron event objects
- Provides type-safe API

## Usage Examples

### Basic Usage

```typescript
import { createFloatingRecorder } from './main/floating-recorder-window';

// Start recording
createFloatingRecorder(() => {
  console.log('User clicked Done');
  // Handle stop recording
});
```

### With State Updates

```typescript
import { getFloatingRecorderWindow } from './main/floating-recorder-window';

const recorder = getFloatingRecorderWindow();

// Create window
recorder.create(() => {
  // Handle stop
});

// Update timer every second
setInterval(() => {
  const elapsed = getElapsedSeconds();
  recorder.updateTime(elapsed);
}, 1000);

// Update state when processing
recorder.updateState('processing');

// Update state when complete
recorder.updateState('complete');
```

### Global Shortcut Integration

```typescript
import { globalShortcut } from 'electron';
import { createFloatingRecorder, isFloatingRecorderOpen } from './main/floating-recorder-window';

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (!isFloatingRecorderOpen()) {
      createFloatingRecorder(() => {
        stopRecording();
      });
    }
  });
});
```

### Full Integration Example

See `src/main/index.example.ts` for a complete implementation including:
- Global shortcut registration
- Recording lifecycle management
- Timer updates
- Error handling
- Cleanup on app quit

## Type Definitions

### RecordingState
```typescript
type RecordingState = 'recording' | 'processing' | 'complete';
```

### FloatingRecorderProps
```typescript
interface FloatingRecorderProps {
  initialState?: RecordingState;
  onStop?: () => void;
  onClose?: () => void;
}
```

### RecordingSession
```typescript
interface RecordingSession {
  startTime: number;
  elapsedTime: number;
  state: RecordingState;
}
```

### FloatingRecorderIpcMessages
```typescript
interface FloatingRecorderIpcMessages {
  'recorder:stop': Record<string, never>;
  'recorder:state-change': { state: RecordingState };
  'recorder:close': Record<string, never>;
  'recorder:time-update': { elapsedTime: number };
}
```

## Testing

### Test Coverage
Comprehensive test suite in `tests/floating-recorder.test.ts`:

1. **Window Creation**
   - Correct properties (size, position, flags)
   - Development vs production URLs
   - Window button visibility

2. **Window Lifecycle**
   - Create window
   - Focus existing window
   - Close window
   - Check open status

3. **State Management**
   - State transitions (recording → processing → complete)
   - Timer updates
   - IPC message sending

4. **Callbacks**
   - onStop callback invocation
   - IPC event handling

5. **Cleanup**
   - IPC handler removal
   - Window destruction

6. **Singleton Pattern**
   - Instance reuse
   - Helper functions

### Running Tests

```bash
# Run all tests
npm test

# Run only FloatingRecorder tests
npm test -- floating-recorder.test.ts

# Run with coverage
npm run test:coverage
```

## Styling

### CSS Architecture
- Custom utility classes (Tailwind-style)
- CSS animations (pulse, spin)
- Drag-area support for title bar
- Responsive to state changes
- System font stack

### Key Animations

**Pulse Animation** (Recording/Processing indicators):
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Spin Animation** (Processing spinner):
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Security

### Context Isolation
- `contextBridge` used to expose IPC safely
- No `nodeIntegration` in renderer
- Whitelisted IPC channels only
- Event sanitization in preload script

### IPC Channel Whitelist

**Renderer can send:**
- `recorder:stop`
- `recorder:close`

**Renderer can receive:**
- `recorder:state-change`
- `recorder:time-update`

## Integration Points

### With Audio Recording
```typescript
// When recording starts
createFloatingRecorder(() => {
  const audioBuffer = stopAudioCapture();
  // Process audio...
});
```

### With Pending Queue Service
```typescript
import { pendingQueueService } from '@/services';

createFloatingRecorder(async () => {
  const recorder = getFloatingRecorderWindow();
  recorder.updateState('processing');

  try {
    const audioBuffer = getRecordedAudio();
    const date = new Date().toISOString().split('T')[0];
    await pendingQueueService.queueForAnalysis(audioBuffer, date);

    recorder.updateState('complete');
  } catch (error) {
    console.error('Failed to queue audio:', error);
    closeFloatingRecorder();
  }
});
```

### With Storage Service
```typescript
import { storageService } from '@/services';

// Save recording with auto-retry
const audioPath = await storageService.saveRecording(audioBuffer, date);
```

## Future Enhancements

### Potential Improvements
1. **Waveform Visualization**: Show audio levels while recording
2. **Keyboard Shortcuts**: ESC to cancel, Space to pause
3. **Countdown Timer**: Show time remaining (if max duration set)
4. **Error State**: Visual feedback for recording errors
5. **Dark Mode**: Theme support based on system preferences
6. **Accessibility**: Screen reader support, ARIA labels
7. **Sound Effects**: Audio feedback for state changes
8. **Multi-monitor**: Position on screen where mouse is located
9. **Minimize/Restore**: Click to minimize to menu bar
10. **Settings**: Configurable position, size, opacity

### Potential Features
1. **Pause/Resume**: Pause recording and continue later
2. **Cancel**: Discard recording without processing
3. **Transcription Preview**: Show live transcription
4. **Audio Level Meter**: Visual VU meter
5. **Retry**: Retry failed analysis from window
6. **History**: Show recent recordings in dropdown
7. **Quick Actions**: Add tags, priority while recording
8. **Drag-and-Drop**: Drop audio files to analyze

## Acceptance Criteria

All acceptance criteria from Linear issue AI-20 have been met:

- [x] Compact floating design (300x150px)
- [x] Always on top
- [x] Recording indicator visible (pulsing red dot)
- [x] Timer counts up (MM:SS format)
- [x] Done button stops recording
- [x] Shows processing state (yellow, spinner)
- [x] Auto-closes after success (2 second delay)
- [x] Frameless with custom title bar
- [x] React component in src/renderer/components/
- [x] Electron window creation in src/main/
- [x] Comprehensive tests in tests/

## Development Notes

### Local Development

1. **Start Vite dev server** (for hot reload):
   ```bash
   npm run dev:renderer
   ```

2. **Build main process**:
   ```bash
   npm run build:main
   ```

3. **Start Electron**:
   ```bash
   npm start
   ```

### Production Build

```bash
npm run build
npm run package
```

### Debugging

**Main Process:**
- Use `console.log()` (appears in terminal)
- Use Electron DevTools: `--inspect` flag

**Renderer Process:**
- Open DevTools: `BrowserWindow.webContents.openDevTools()`
- Use React DevTools extension

### Common Issues

**Window not appearing:**
- Check screen dimensions are correct
- Verify window position is on-screen
- Check `alwaysOnTop` is set to `true`

**IPC not working:**
- Verify preload script is loaded
- Check channel names match exactly
- Ensure contextIsolation is enabled

**Styles not loading:**
- Check CSS file path in HTML
- Verify Vite dev server is running (dev mode)
- Check build output (production mode)

**Timer not updating:**
- Verify state is 'recording'
- Check interval is not cleared prematurely
- Ensure component is mounted

## Files Created

### Source Files
- `src/types/recorder.ts` - Type definitions
- `src/renderer/components/FloatingRecorder.tsx` - React component
- `src/renderer/floating-recorder.tsx` - React entry point
- `src/renderer/floating-recorder.html` - HTML template
- `src/renderer/styles/floating-recorder.css` - Component styles
- `src/main/floating-recorder-window.ts` - Window management
- `src/main/preload.ts` - IPC bridge
- `src/main/index.example.ts` - Integration examples

### Test Files
- `tests/floating-recorder.test.ts` - Comprehensive test suite

### Documentation
- `docs/AI-20-FLOATING-RECORDER.md` - This file

## Related Issues
- AI-16: Storage Service (audio file handling)
- AI-18: Pending Queue (retry failed analysis)
- Future: Global shortcut registration
- Future: Audio recording integration

## References
- [Electron BrowserWindow Documentation](https://www.electronjs.org/docs/latest/api/browser-window)
- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Vitest Testing Documentation](https://vitest.dev/)
