/**
 * RecordingDemo Component
 * [AI-24] Show recording status and analysis progress
 *
 * Demo component showing how to use RecordingStatus with useRecordingState hook.
 * This serves as both a usage example and integration test for the recording UI.
 */

import React from 'react';
import { RecordingStatus } from './RecordingStatus';
import { ProgressIndicator } from './ProgressIndicator';
import { useRecordingState } from '../hooks/useRecordingState';

/**
 * RecordingDemo Component
 *
 * Full example implementation showing:
 * - Integration of RecordingStatus and useRecordingState
 * - Recording controls (start/stop)
 * - Error handling with retry
 * - Success state with auto-dismiss
 * - Display of analysis results
 */
export function RecordingDemo(): JSX.Element {
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Recording Status Demo
        </h1>
        <p className="text-gray-600">
          AI-24: Recording status and analysis progress feedback
        </p>
      </div>

      {/* Status Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <RecordingStatus
          state={state}
          duration={duration}
          errorMessage={errorMessage}
          onRetry={retry}
          onDismiss={reset}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={startRecording}
            disabled={state === 'recording' || state === 'processing' || state === 'analyzing'}
            className="
              px-4 py-2 rounded-md font-medium
              bg-blue-600 text-white
              hover:bg-blue-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Start Recording
          </button>

          <button
            onClick={stopRecording}
            disabled={state !== 'recording'}
            className="
              px-4 py-2 rounded-md font-medium
              bg-red-600 text-white
              hover:bg-red-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Stop Recording
          </button>

          <button
            onClick={reset}
            className="
              px-4 py-2 rounded-md font-medium
              bg-gray-600 text-white
              hover:bg-gray-700
              transition-colors
            "
          >
            Reset
          </button>
        </div>

        {/* State Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700">
            <strong>Current State:</strong> {state}
          </div>
          {state === 'recording' && (
            <div className="text-sm text-gray-700 mt-1">
              <strong>Duration:</strong> {duration}s
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicators Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Progress Indicators</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-gray-700">Spinner:</span>
            <ProgressIndicator type="spinner" color="blue" label="Loading spinner" />
          </div>

          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-gray-700">Dots:</span>
            <ProgressIndicator type="dots" color="purple" label="Loading dots" />
          </div>

          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-gray-700">Bar (50%):</span>
            <div className="flex-1">
              <ProgressIndicator type="bar" progress={50} color="green" label="Progress bar" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-gray-700">Bar (75%):</span>
            <div className="flex-1">
              <ProgressIndicator type="bar" progress={75} color="yellow" label="Progress bar" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Result</h2>
          <div className="space-y-3">
            <div>
              <strong className="text-gray-700">Transcript:</strong>
              <p className="mt-1 text-gray-600">{result.transcript}</p>
            </div>

            {result.segments.length > 0 && (
              <div>
                <strong className="text-gray-700">Extracted Segments:</strong>
                <ul className="mt-2 space-y-2">
                  {result.segments.map((segment, index) => (
                    <li key={index} className="p-2 bg-gray-50 rounded">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {segment.type}
                      </span>
                      <p className="mt-1 text-sm text-gray-700">{segment.text}</p>
                      {segment.confidence && (
                        <span className="text-xs text-gray-500">
                          Confidence: {(segment.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">States</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">ready</span>
            <span className="text-gray-600">Ready to record - initial state</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">recording</span>
            <span className="text-gray-600">Currently recording with timer</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">processing</span>
            <span className="text-gray-600">Processing audio file</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">analyzing</span>
            <span className="text-gray-600">Analyzing content with AI</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">complete</span>
            <span className="text-gray-600">Successfully completed (auto-dismisses after 2s)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">error</span>
            <span className="text-gray-600">Error occurred with retry option</span>
          </div>
        </div>
      </div>
    </div>
  );
}
