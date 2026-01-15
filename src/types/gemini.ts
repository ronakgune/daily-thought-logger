/**
 * Types for Gemini API service
 * [AI-11] Set up Gemini API service with API key config
 */

export interface GeminiOptions {
  /** Model to use (default: gemini-1.5-flash) */
  model?: GeminiModel;
  /** Maximum tokens in response */
  maxOutputTokens?: number;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Top-k sampling parameter */
  topK?: number;
  /** Stop sequences to end generation */
  stopSequences?: string[];
}

export type GeminiModel =
  | 'gemini-1.5-flash'
  | 'gemini-1.5-flash-8b'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash-exp';

export interface GeminiResponse {
  /** The generated text response */
  text: string;
  /** Token usage information */
  usage?: GeminiUsage;
  /** Safety ratings for the response */
  safetyRatings?: GeminiSafetyRating[];
  /** Finish reason */
  finishReason?: GeminiFinishReason;
}

export interface GeminiUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface GeminiSafetyRating {
  category: string;
  probability: string;
}

export type GeminiFinishReason =
  | 'STOP'
  | 'MAX_TOKENS'
  | 'SAFETY'
  | 'RECITATION'
  | 'OTHER';

export interface GeminiError {
  code: GeminiErrorCode;
  message: string;
  details?: unknown;
}

export type GeminiErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'INVALID_REQUEST'
  | 'SERVICE_UNAVAILABLE'
  | 'CONTENT_FILTERED'
  | 'UNKNOWN_ERROR';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface AnalysisResult {
  content: string;
  promptTokens?: number;
  responseTokens?: number;
}
