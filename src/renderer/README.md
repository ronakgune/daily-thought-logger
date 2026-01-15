# Renderer Components - AI-24

**Recording Status and Analysis Progress UI**

This directory contains React components and hooks for displaying recording status and analysis progress feedback to users.

## Overview

AI-24 implements visual feedback throughout the recording and analysis process with:
- ✅ All states visually distinct
- ✅ Real-time recording timer
- ✅ Analysis progress indicators
- ✅ Brief success animation (auto-dismisses after 2s)
- ✅ Error state with retry option
- ✅ Accessible status messages (WCAG compliant)

## Components

### RecordingStatus

Main status component showing the current state of recording and analysis.

**Usage:**
```tsx
import { RecordingStatus } from './components';

<RecordingStatus
  state="recording"
  duration={45}
  errorMessage="Failed to connect"
  onRetry={() => console.log('Retry')}
  onDismiss={() => console.log('Dismiss')}
/>
```

**States:**
- `ready` - Ready to record (blue)
- `recording` - Currently recording with timer (red, pulsing)
- `processing` - Processing audio (yellow, spinner)
- `analyzing` - Analyzing content (purple, spinner)
- `complete` - Successfully completed (green, auto-dismisses after 2s)
- `error` - Error occurred (red, with retry button)

**Props:**
- `state: RecordingState` - Current state (required)
- `duration?: number` - Recording duration in seconds
- `errorMessage?: string` - Error message to display
- `onRetry?: () => void` - Callback for retry button
- `onDismiss?: () => void` - Callback for dismiss/success

### ProgressIndicator

Animated progress indicators for processing states.

**Usage:**
```tsx
import { ProgressIndicator } from './components';

// Spinner
<ProgressIndicator type="spinner" color="blue" size="md" />

// Dots
<ProgressIndicator type="dots" color="purple" size="sm" />

// Progress bar
<ProgressIndicator type="bar" progress={75} color="green" />
```

**Types:**
- `spinner` - Rotating circular spinner
- `dots` - Three bouncing dots with staggered animation
- `bar` - Linear progress bar with percentage

**Props:**
- `type: 'spinner' | 'dots' | 'bar'` - Indicator type (required)
- `progress?: number` - Progress percentage 0-100 (for bar type)
- `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')
- `color?: 'blue' | 'purple' | 'yellow' | 'green' | 'red'` - Color theme (default: 'blue')
- `label?: string` - Accessible label for screen readers (default: 'Loading')

## Hooks

### useRecordingState

Custom hook managing recording state, duration timer, and IPC communication.

**Usage:**
```tsx
import { useRecordingState } from './hooks';

function RecorderComponent() {
  const {
    state,
    duration,
    errorMessage,
    result,
    startRecording,
    stopRecording,
    retry,
    reset,
  } = useRecordingState();

  return (
    <div>
      <RecordingStatus
        state={state}
        duration={duration}
        errorMessage={errorMessage}
        onRetry={retry}
        onDismiss={reset}
      />
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

**Features:**
- Manages state transitions (ready → recording → processing → analyzing → complete/error)
- Real-time duration tracking with automatic timer management
- IPC event listeners for main process communication
- Automatic cleanup on unmount
- Works in non-Electron environments (gracefully degrades)

**Return Value:**
```typescript
interface UseRecordingStateReturn {
  state: RecordingState;              // Current state
  duration: number;                   // Recording duration (seconds)
  errorMessage?: string;              // Error message if any
  result?: AnalysisResult;            // Analysis result when complete
  startRecording: () => void;         // Start recording
  stopRecording: () => void;          // Stop recording
  retry: () => void;                  // Retry after error
  reset: () => void;                  // Reset to ready state
}
```

## IPC Events

The hook listens to these IPC channels from the main process (defined in Phase 2 types):

**Recording Events:**
- `recording:start` - Sent when recording starts
- `recording:stop` - Sent when recording stops
- `recording:complete` - Received when recording completes with audio data
- `recording:error` - Received when recording fails

**Analysis Events:**
- `analyze:progress` - Received during analysis (optional progress updates)
- `analyze:complete` - Received when analysis completes with results
- `analyze:error` - Received when analysis fails

## Integration Example

See `RecordingDemo.tsx` for a complete working example showing:
- Integration of components and hooks
- Control buttons for testing all states
- Display of analysis results
- Error handling and retry flow

## Testing

Comprehensive test coverage in `/tests`:
- `RecordingStatus.test.tsx` - Component visual states, interactions, accessibility
- `ProgressIndicator.test.tsx` - All indicator types, sizes, colors
- `useRecordingState.test.ts` - State management, timer, IPC events, cleanup

Run tests:
```bash
npm test
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

**RecordingStatus:**
- `role="status"` with `aria-live="polite"` for state updates
- `aria-atomic="true"` for complete announcements
- Screen reader-only text for detailed status
- Focus management on interactive elements
- Keyboard navigation support

**ProgressIndicator:**
- `role="status"` for all types
- `role="progressbar"` with aria attributes for bar type
- Screen reader labels via `aria-label`
- Visual indicators don't rely on color alone

## Styling

Uses Tailwind CSS utility classes for:
- Consistent spacing and sizing
- Responsive design
- Smooth transitions and animations
- Color-coded state indication
- Focus states for accessibility

**Color Scheme:**
- Blue: Ready state, default
- Red: Recording, errors
- Yellow: Processing
- Purple: Analyzing
- Green: Success

## Future Enhancements

Potential improvements for future iterations:
- Granular progress percentage for analysis
- Configurable auto-dismiss timeout
- Custom icons via props
- Sound effects for state transitions
- Keyboard shortcuts for controls
- Dark mode support
- Internationalization (i18n)

## Dependencies

- React 18+
- Tailwind CSS 3+
- TypeScript 5+
- (Optional) Electron IPC for main/renderer communication

## Files Structure

```
src/renderer/
├── components/
│   ├── RecordingStatus.tsx       # Main status component
│   ├── ProgressIndicator.tsx     # Progress indicators
│   ├── RecordingDemo.tsx         # Full demo/example
│   └── index.ts                  # Component exports
├── hooks/
│   ├── useRecordingState.ts      # Recording state hook
│   └── index.ts                  # Hook exports
└── README.md                     # This file

tests/
├── RecordingStatus.test.tsx      # Component tests
├── ProgressIndicator.test.tsx    # Indicator tests
└── useRecordingState.test.ts     # Hook tests
```

## License

MIT
