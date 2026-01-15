/**
 * Renderer Process Exports
 * AI-23: Wire recording/text to analysis pipeline
 *
 * This module exports the renderer-side IPC client for use in React components.
 */

export { IPCClient, useIPCClient } from './ipc-client';
export type { ProgressCallback, CompleteCallback, ErrorCallback } from './ipc-client';

/**
 * Example React component using IPCClient:
 *
 * ```typescript
 * import React, { useState, useEffect } from 'react';
 * import { IPCClient } from './renderer';
 *
 * export function RecorderComponent() {
 *   const [ipc] = useState(() => new IPCClient());
 *   const [status, setStatus] = useState('');
 *   const [progress, setProgress] = useState(0);
 *   const [recording, setRecording] = useState(false);
 *
 *   useEffect(() => {
 *     // Set up event listeners
 *     const removeProgress = ipc.onProgress((status, progress) => {
 *       setStatus(status);
 *       setProgress(progress);
 *     });
 *
 *     const removeComplete = ipc.onComplete((result, logId) => {
 *       console.log(`Analysis complete! Log ID: ${logId}`);
 *       console.log(`Found ${result.segments.length} segments`);
 *       // Refresh UI, show notification, etc.
 *     });
 *
 *     const removeError = ipc.onError((error) => {
 *       console.error('Analysis failed:', error);
 *       alert(`Analysis failed: ${error}`);
 *     });
 *
 *     // Cleanup on unmount
 *     return () => {
 *       removeProgress();
 *       removeComplete();
 *       removeError();
 *       ipc.cleanup();
 *     };
 *   }, [ipc]);
 *
 *   const handleAnalyzeAudio = async (audioBlob: Blob) => {
 *     try {
 *       const arrayBuffer = await audioBlob.arrayBuffer();
 *       const log = await ipc.analyzeAudio(arrayBuffer);
 *       console.log('Saved log:', log);
 *     } catch (error) {
 *       console.error('Failed to analyze audio:', error);
 *     }
 *   };
 *
 *   const handleAnalyzeText = async (text: string) => {
 *     try {
 *       const log = await ipc.analyzeText(text);
 *       console.log('Saved log:', log);
 *     } catch (error) {
 *       console.error('Failed to analyze text:', error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h2>Voice Recorder</h2>
 *       <div>Status: {status}</div>
 *       <div>Progress: {progress}%</div>
 *       {/* Add your recording UI here *\/}
 *     </div>
 *   );
 * }
 * ```
 */
