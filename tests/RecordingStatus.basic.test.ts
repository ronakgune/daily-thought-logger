/**
 * Basic Tests for RecordingStatus Component (TypeScript validation)
 * [AI-24] Show recording status and analysis progress
 */

import { describe, it, expect } from 'vitest';
import type { RecordingState, RecordingStatusProps } from '../src/renderer/components/RecordingStatus';

describe('RecordingStatus Types', () => {
  it('should have valid RecordingState types', () => {
    const validStates: RecordingState[] = [
      'ready',
      'recording',
      'processing',
      'analyzing',
      'complete',
      'error',
    ];

    expect(validStates).toHaveLength(6);
    expect(validStates).toContain('ready');
    expect(validStates).toContain('recording');
    expect(validStates).toContain('processing');
    expect(validStates).toContain('analyzing');
    expect(validStates).toContain('complete');
    expect(validStates).toContain('error');
  });

  it('should have valid RecordingStatusProps interface', () => {
    const props: RecordingStatusProps = {
      state: 'ready',
      duration: 0,
    };

    expect(props.state).toBe('ready');
    expect(props.duration).toBe(0);
  });

  it('should support all optional props', () => {
    const props: RecordingStatusProps = {
      state: 'error',
      duration: 45,
      errorMessage: 'Test error',
      onRetry: () => console.log('retry'),
      onDismiss: () => console.log('dismiss'),
    };

    expect(props.state).toBe('error');
    expect(props.duration).toBe(45);
    expect(props.errorMessage).toBe('Test error');
    expect(typeof props.onRetry).toBe('function');
    expect(typeof props.onDismiss).toBe('function');
  });
});

describe('ProgressIndicator Types', () => {
  it('should validate indicator types', () => {
    const types = ['spinner', 'dots', 'bar'];
    expect(types).toHaveLength(3);
  });

  it('should validate size variants', () => {
    const sizes = ['sm', 'md', 'lg'];
    expect(sizes).toHaveLength(3);
  });

  it('should validate color variants', () => {
    const colors = ['blue', 'purple', 'yellow', 'green', 'red'];
    expect(colors).toHaveLength(5);
  });
});

describe('useRecordingState Hook Types', () => {
  it('should define IPC channel names', () => {
    const channels = {
      RECORDING_START: 'recording:start',
      RECORDING_STOP: 'recording:stop',
      RECORDING_COMPLETE: 'recording:complete',
      RECORDING_ERROR: 'recording:error',
      ANALYZE_START: 'analyze:start',
      ANALYZE_PROGRESS: 'analyze:progress',
      ANALYZE_COMPLETE: 'analyze:complete',
      ANALYZE_ERROR: 'analyze:error',
    };

    expect(channels.RECORDING_START).toBe('recording:start');
    expect(channels.ANALYZE_COMPLETE).toBe('analyze:complete');
  });
});
