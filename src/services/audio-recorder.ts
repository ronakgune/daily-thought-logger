/**
 * AudioRecorderService - Audio capture using Web Audio API and MediaRecorder
 * AI-21: Implement audio recording with MediaRecorder
 *
 * This service handles microphone access, audio recording, and blob generation
 * using the MediaRecorder API with webm/opus format.
 *
 * Features:
 * - Microphone permission management
 * - Audio recording with MediaRecorder (webm/opus format)
 * - Real-time audio level visualization
 * - Duration tracking
 * - Graceful permission denial handling
 * - Audio blob export for file saving
 *
 * Usage:
 * ```typescript
 * const recorder = new AudioRecorderService();
 * await recorder.requestPermission();
 * await recorder.startRecording();
 * // ... user records audio ...
 * const result = await recorder.stopRecording();
 * // Save blob to file
 * await saveAudioFile(result.blob, 'recording.webm');
 * ```
 */

/**
 * Permission state for microphone access
 */
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

/**
 * Recording state
 */
export type RecordingState = 'inactive' | 'recording' | 'paused';

/**
 * Result of a completed recording
 */
export interface RecordingResult {
  /** Audio blob in webm/opus format */
  blob: Blob;
  /** Recording duration in seconds */
  duration: number;
  /** MIME type of the recording */
  mimeType: string;
}

/**
 * Audio level information for visualization
 */
export interface AudioLevel {
  /** Current volume level (0-100) */
  volume: number;
  /** Whether the level is clipping */
  isClipping: boolean;
}

/**
 * Error types for audio recording
 */
export class AudioRecorderError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'RECORDING_FAILED' | 'NO_RECORDING'
  ) {
    super(message);
    this.name = 'AudioRecorderError';
  }
}

/**
 * AudioRecorderService handles audio capture using MediaRecorder API.
 *
 * The service manages the full lifecycle of audio recording:
 * 1. Request microphone permission
 * 2. Initialize MediaRecorder with optimal settings
 * 3. Track recording duration
 * 4. Provide audio level visualization data
 * 5. Generate audio blob for saving
 *
 * Implementation details:
 * - Uses webm/opus format for efficient compression
 * - Falls back to available codecs if opus not supported
 * - Provides real-time audio analysis via Web Audio API
 * - Handles permission denial gracefully with clear error messages
 */
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private permissionState: PermissionState = 'unknown';

  /**
   * Requests microphone permission from the user.
   *
   * This method must be called before starting recording.
   * It will prompt the user for permission if not already granted.
   *
   * @returns Promise resolving to permission state
   * @throws AudioRecorderError if permission denied or not supported
   *
   * @example
   * ```typescript
   * try {
   *   const state = await recorder.requestPermission();
   *   if (state === 'granted') {
   *     console.log('Microphone access granted');
   *   }
   * } catch (error) {
   *   if (error.code === 'PERMISSION_DENIED') {
   *     // Show user-friendly message
   *   }
   * }
   * ```
   */
  async requestPermission(): Promise<PermissionState> {
    // Check if MediaRecorder is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'denied';
      throw new AudioRecorderError(
        'MediaRecorder is not supported in this browser',
        'NOT_SUPPORTED'
      );
    }

    // Clean up existing stream if requesting permission again
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Store stream for later use
      this.audioStream = stream;
      this.permissionState = 'granted';

      return 'granted';
    } catch (error) {
      this.permissionState = 'denied';

      // Handle specific permission errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new AudioRecorderError(
            'Microphone permission denied. Please enable microphone access in your browser settings.',
            'PERMISSION_DENIED'
          );
        } else if (error.name === 'NotFoundError') {
          throw new AudioRecorderError(
            'No microphone found. Please connect a microphone and try again.',
            'NOT_SUPPORTED'
          );
        }
      }

      throw new AudioRecorderError(
        'Failed to access microphone: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'PERMISSION_DENIED'
      );
    }
  }

  /**
   * Starts audio recording.
   *
   * Prerequisites:
   * - Permission must be granted (call requestPermission first)
   * - No active recording in progress
   *
   * @throws AudioRecorderError if permission not granted or recording fails
   *
   * @example
   * ```typescript
   * await recorder.requestPermission();
   * await recorder.startRecording();
   * console.log('Recording started');
   * ```
   */
  async startRecording(): Promise<void> {
    // Ensure permission is granted
    if (this.permissionState !== 'granted' || !this.audioStream) {
      throw new AudioRecorderError(
        'Microphone permission not granted. Call requestPermission() first.',
        'PERMISSION_DENIED'
      );
    }

    // Check if already recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      throw new AudioRecorderError(
        'Recording already in progress',
        'RECORDING_FAILED'
      );
    }

    try {
      // Reset audio chunks
      this.audioChunks = [];

      // Determine best MIME type
      const mimeType = this.getSupportedMimeType();

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
      });

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Initialize audio analysis for visualization
      this.initializeAudioAnalysis(this.audioStream);

      // Start recording
      this.startTime = Date.now();
      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      throw new AudioRecorderError(
        'Failed to start recording: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'RECORDING_FAILED'
      );
    }
  }

  /**
   * Stops the current recording and returns the audio blob.
   *
   * @returns Promise resolving to recording result with blob and duration
   * @throws AudioRecorderError if no active recording
   *
   * @example
   * ```typescript
   * const result = await recorder.stopRecording();
   * console.log(`Recorded ${result.duration}s of audio`);
   * console.log(`Blob size: ${result.blob.size} bytes`);
   * // Save to file
   * await saveToFile(result.blob, 'recording.webm');
   * ```
   */
  async stopRecording(): Promise<RecordingResult> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      throw new AudioRecorderError(
        'No active recording to stop',
        'NO_RECORDING'
      );
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new AudioRecorderError('MediaRecorder not initialized', 'NO_RECORDING'));
        return;
      }

      // Handle stop event
      this.mediaRecorder.onstop = () => {
        try {
          // Calculate duration
          const duration = (Date.now() - this.startTime) / 1000;

          // Create blob from chunks
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.audioChunks, { type: mimeType });

          // Clean up
          this.cleanup();

          resolve({
            blob,
            duration,
            mimeType,
          });
        } catch (error) {
          reject(new AudioRecorderError(
            'Failed to create audio blob: ' + (error instanceof Error ? error.message : 'Unknown error'),
            'RECORDING_FAILED'
          ));
        }
      };

      // Stop recording
      this.mediaRecorder.stop();
    });
  }

  /**
   * Gets the current recording state.
   *
   * @returns Current recording state
   */
  getState(): RecordingState {
    return (this.mediaRecorder?.state as RecordingState) || 'inactive';
  }

  /**
   * Gets the current permission state.
   *
   * @returns Current permission state
   */
  getPermissionState(): PermissionState {
    return this.permissionState;
  }

  /**
   * Gets the current recording duration in seconds.
   *
   * @returns Duration in seconds, or 0 if not recording
   */
  getDuration(): number {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      return (Date.now() - this.startTime) / 1000;
    }
    return 0;
  }

  /**
   * Gets the current audio level for visualization.
   *
   * This method analyzes the audio stream and returns volume information
   * that can be used to display a live audio level meter.
   *
   * @returns Audio level information, or null if not recording
   *
   * @example
   * ```typescript
   * // Update UI with audio level
   * setInterval(() => {
   *   const level = recorder.getAudioLevel();
   *   if (level) {
   *     updateMeter(level.volume);
   *     if (level.isClipping) {
   *       showClippingWarning();
   *     }
   *   }
   * }, 100);
   * ```
   */
  getAudioLevel(): AudioLevel | null {
    if (!this.analyser || !this.dataArray) {
      return null;
    }

    try {
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const average = sum / this.dataArray.length;

      // Convert to 0-100 scale
      const volume = Math.round((average / 255) * 100);

      // Check for clipping (volume > 95%)
      const isClipping = volume > 95;

      return {
        volume,
        isClipping,
      };
    } catch (error) {
      console.error('Error getting audio level:', error);
      return null;
    }
  }

  /**
   * Releases all resources and stops the audio stream.
   *
   * This should be called when the recorder is no longer needed.
   *
   * @example
   * ```typescript
   * // Clean up when component unmounts
   * useEffect(() => {
   *   return () => {
   *     recorder.release();
   *   };
   * }, []);
   * ```
   */
  release(): void {
    this.cleanup();

    // Stop all tracks in the stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    this.permissionState = 'unknown';
  }

  /**
   * Initializes audio analysis for level visualization.
   *
   * @param stream - The audio stream to analyze
   */
  private initializeAudioAnalysis(stream: MediaStream): void {
    try {
      // Create audio context
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      // Create source from stream
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.analyser);

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
      // Clean up audio context on failure
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      // Non-critical, continue without visualization
    }
  }

  /**
   * Determines the best supported MIME type for recording.
   *
   * Prefers webm/opus for efficient compression, falls back to alternatives.
   *
   * @returns Supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback to default - verify it's supported
    const fallback = 'audio/webm';
    if (MediaRecorder.isTypeSupported(fallback)) {
      return fallback;
    }

    // If even the fallback isn't supported, return empty string
    // (MediaRecorder will use its default)
    return '';
  }

  /**
   * Cleans up recording resources.
   */
  private cleanup(): void {
    // Disconnect media stream source
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear analyser
    this.analyser = null;
    this.dataArray = null;

    // Clear chunks
    this.audioChunks = [];

    // Reset recorder
    this.mediaRecorder = null;
  }
}
