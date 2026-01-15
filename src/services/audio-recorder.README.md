# AudioRecorderService

AI-21: Audio recording with MediaRecorder

## Overview

The `AudioRecorderService` provides a comprehensive solution for capturing audio using the Web Audio API and MediaRecorder. It handles microphone permissions, audio recording in webm/opus format, duration tracking, and real-time audio level visualization.

## Features

- **Microphone Permission Management**: Request and track microphone access permissions
- **MediaRecorder Integration**: Record audio using the MediaRecorder API with webm/opus format
- **Real-time Audio Visualization**: Get audio level data for displaying volume meters
- **Duration Tracking**: Accurately track recording duration in seconds
- **Graceful Error Handling**: Clear error messages for permission denial and recording failures
- **Resource Management**: Proper cleanup of audio streams and contexts

## Installation

```typescript
import { AudioRecorderService } from './services/audio-recorder';
```

## Usage

### Basic Recording

```typescript
// Create recorder instance
const recorder = new AudioRecorderService();

try {
  // 1. Request permission
  const permissionState = await recorder.requestPermission();
  if (permissionState === 'granted') {
    console.log('Microphone access granted');
  }

  // 2. Start recording
  await recorder.startRecording();
  console.log('Recording started');

  // 3. Wait for user to finish
  // ... user records audio ...

  // 4. Stop recording and get result
  const result = await recorder.stopRecording();
  console.log(`Recorded ${result.duration}s of audio`);
  console.log(`Blob size: ${result.blob.size} bytes`);

  // 5. Save to file (implementation depends on your platform)
  await saveAudioFile(result.blob, 'recording.webm');

} catch (error) {
  if (error instanceof AudioRecorderError) {
    if (error.code === 'PERMISSION_DENIED') {
      console.error('Please enable microphone access');
    }
  }
} finally {
  // 6. Clean up resources
  recorder.release();
}
```

### Audio Level Visualization

```typescript
// Start recording
await recorder.startRecording();

// Update UI with audio level every 100ms
const levelInterval = setInterval(() => {
  const level = recorder.getAudioLevel();

  if (level) {
    // Update volume meter
    updateVolumeMeter(level.volume); // 0-100

    // Show clipping warning
    if (level.isClipping) {
      showClippingWarning('Audio level too high!');
    }
  }
}, 100);

// Stop recording
const result = await recorder.stopRecording();
clearInterval(levelInterval);
```

### Duration Tracking

```typescript
await recorder.startRecording();

// Display duration during recording
const durationInterval = setInterval(() => {
  const duration = recorder.getDuration();
  updateDurationDisplay(duration); // in seconds
}, 100);

const result = await recorder.stopRecording();
clearInterval(durationInterval);

console.log(`Final duration: ${result.duration}s`);
```

### Error Handling

```typescript
try {
  await recorder.requestPermission();
  await recorder.startRecording();
} catch (error) {
  if (error instanceof AudioRecorderError) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        alert('Please enable microphone access in browser settings');
        break;
      case 'NOT_SUPPORTED':
        alert('Your browser does not support audio recording');
        break;
      case 'RECORDING_FAILED':
        alert('Failed to start recording. Please try again.');
        break;
      case 'NO_RECORDING':
        alert('No active recording to stop');
        break;
    }
  }
}
```

### React Component Example

```typescript
import { useEffect, useState } from 'react';
import { AudioRecorderService, RecordingResult } from './services/audio-recorder';

function AudioRecorder() {
  const [recorder] = useState(() => new AudioRecorderService());
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recorder.release();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      await recorder.requestPermission();
      await recorder.startRecording();
      setIsRecording(true);

      // Update duration and level
      const interval = setInterval(() => {
        setDuration(recorder.getDuration());
        const level = recorder.getAudioLevel();
        if (level) setAudioLevel(level.volume);
      }, 100);

      return () => clearInterval(interval);
    } catch (err) {
      setError(err.message);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await recorder.stopRecording();
      setIsRecording(false);
      setDuration(0);
      setAudioLevel(0);

      // Save or process the recording
      await saveRecording(result.blob);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}

      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>

      {isRecording && (
        <div>
          <div>Duration: {duration.toFixed(1)}s</div>
          <div>Level: {audioLevel}%</div>
          <div className="volume-meter" style={{ width: `${audioLevel}%` }} />
        </div>
      )}
    </div>
  );
}
```

## API Reference

### Methods

#### `requestPermission(): Promise<PermissionState>`

Requests microphone permission from the user.

**Returns:** Promise resolving to permission state ('granted', 'denied', 'prompt', 'unknown')

**Throws:** `AudioRecorderError` if permission denied or not supported

```typescript
const state = await recorder.requestPermission();
```

#### `startRecording(): Promise<void>`

Starts audio recording.

**Prerequisites:** Permission must be granted

**Throws:** `AudioRecorderError` if permission not granted or recording fails

```typescript
await recorder.startRecording();
```

#### `stopRecording(): Promise<RecordingResult>`

Stops the current recording and returns the audio blob.

**Returns:** Promise resolving to `RecordingResult` with blob, duration, and MIME type

**Throws:** `AudioRecorderError` if no active recording

```typescript
const result = await recorder.stopRecording();
```

#### `getState(): RecordingState`

Gets the current recording state.

**Returns:** 'inactive', 'recording', or 'paused'

```typescript
const state = recorder.getState();
```

#### `getPermissionState(): PermissionState`

Gets the current permission state.

**Returns:** 'granted', 'denied', 'prompt', or 'unknown'

```typescript
const permission = recorder.getPermissionState();
```

#### `getDuration(): number`

Gets the current recording duration in seconds.

**Returns:** Duration in seconds, or 0 if not recording

```typescript
const duration = recorder.getDuration();
```

#### `getAudioLevel(): AudioLevel | null`

Gets the current audio level for visualization.

**Returns:** Audio level information, or null if not recording

```typescript
const level = recorder.getAudioLevel();
if (level) {
  console.log(`Volume: ${level.volume}%`);
  console.log(`Clipping: ${level.isClipping}`);
}
```

#### `release(): void`

Releases all resources and stops the audio stream.

```typescript
recorder.release();
```

### Types

#### `PermissionState`

```typescript
type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';
```

#### `RecordingState`

```typescript
type RecordingState = 'inactive' | 'recording' | 'paused';
```

#### `RecordingResult`

```typescript
interface RecordingResult {
  blob: Blob;           // Audio blob in webm/opus format
  duration: number;     // Recording duration in seconds
  mimeType: string;     // MIME type of the recording
}
```

#### `AudioLevel`

```typescript
interface AudioLevel {
  volume: number;       // Current volume level (0-100)
  isClipping: boolean;  // Whether the level is clipping
}
```

#### `AudioRecorderError`

```typescript
class AudioRecorderError extends Error {
  code: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'RECORDING_FAILED' | 'NO_RECORDING';
}
```

## Technical Details

### Audio Format

The service records audio in **webm/opus** format for optimal compression and quality. If opus is not supported, it falls back to:

1. `audio/webm;codecs=opus` (preferred)
2. `audio/webm`
3. `audio/ogg;codecs=opus`
4. `audio/mp4`

### Audio Settings

The microphone is configured with:
- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled
- **Auto Gain Control**: Enabled

### Audio Analysis

Real-time audio analysis uses the Web Audio API:
- **FFT Size**: 256
- **Frequency Bins**: 128
- **Update Rate**: On-demand (call `getAudioLevel()`)

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Requires HTTPS or localhost
- Mobile browsers: May require user interaction to start

## Testing

The service includes comprehensive tests covering:

- Permission management
- Recording lifecycle
- State transitions
- Error handling
- Resource cleanup
- Audio level visualization
- Duration tracking

Run tests:

```bash
npm test
```

## Best Practices

1. **Always request permission before recording**
   ```typescript
   await recorder.requestPermission();
   await recorder.startRecording();
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     await recorder.startRecording();
   } catch (error) {
     if (error.code === 'PERMISSION_DENIED') {
       // Show user-friendly message
     }
   }
   ```

3. **Clean up resources**
   ```typescript
   useEffect(() => {
     return () => recorder.release();
   }, []);
   ```

4. **Save audio before processing**
   ```typescript
   const result = await recorder.stopRecording();
   await saveToFile(result.blob, 'recording.webm');
   // Now process the audio
   ```

5. **Monitor audio levels**
   ```typescript
   setInterval(() => {
     const level = recorder.getAudioLevel();
     if (level?.isClipping) {
       warnUser('Audio too loud!');
     }
   }, 100);
   ```

## Acceptance Criteria

- [x] Microphone permission requested
- [x] Audio recorded successfully
- [x] Blob available after stop
- [x] Duration tracked accurately
- [x] Permission denial handled gracefully
- [x] Audio saved to file (via RecordingResult.blob)
- [x] Audio level visualization (optional)

## Related Files

- Service: `src/services/audio-recorder.ts`
- Tests: `tests/audio-recorder.test.ts`
- Types: Exported from `src/services/index.ts`

## License

MIT
