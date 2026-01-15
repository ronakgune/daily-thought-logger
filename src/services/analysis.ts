/**
 * AnalysisService - Orchestrates the full analysis pipeline
 * [AI-14] Build AnalysisService (audio → structured JSON)
 *
 * Pipeline flow:
 * 1. Accept audio buffer or file path
 * 2. Send to Gemini with classification prompt
 * 3. Parse JSON response
 * 4. Validate response structure
 * 5. Return typed AnalysisResult
 */

import { GeminiService } from './gemini';
import { CLASSIFICATION_PROMPT } from '../prompts/classification';
import type {
  AnalysisResult,
  Segment,
  SegmentType,
  Priority,
} from '../types';
import type { GeminiError } from '../types/gemini';

/**
 * Options for audio analysis
 */
export interface AnalyzeAudioOptions {
  /** MIME type of the audio (default: audio/wav) */
  mimeType?: string;
  /** Whether to include raw AI response in logs (default: false) */
  includeRaw?: boolean;
}

/**
 * Options for text analysis
 */
export interface AnalyzeTextOptions {
  /** Whether to include raw AI response in logs (default: false) */
  includeRaw?: boolean;
}

/**
 * Internal response structure from Gemini
 */
interface GeminiAnalysisResponse {
  segments: Array<{
    type: string;
    text: string;
    confidence?: number;
    priority?: string;
    category?: string;
    topic?: string;
  }>;
}

/**
 * AnalysisService provides the core analysis pipeline for voice logs
 */
export class AnalysisService {
  private gemini: GeminiService;

  constructor(gemini?: GeminiService) {
    this.gemini = gemini ?? new GeminiService();
  }

  /**
   * Analyze audio and extract structured segments
   *
   * @param audioBuffer - The audio data as a Buffer
   * @param options - Analysis options
   * @returns Structured analysis result with transcript and segments
   * @throws {GeminiError} If transcription or analysis fails
   *
   * @example
   * ```typescript
   * const analysis = await service.analyzeAudio(audioBuffer);
   * console.log(analysis.transcript);
   * console.log(analysis.segments); // Structured todos, ideas, etc.
   * ```
   */
  async analyzeAudio(
    audioBuffer: Buffer,
    options: AnalyzeAudioOptions = {}
  ): Promise<AnalysisResult> {
    this.log('Starting audio analysis');

    // Step 1: Transcribe audio
    this.log('Step 1: Transcribing audio...');
    const transcriptionResult = await this.gemini.transcribeAudio(
      audioBuffer,
      options.mimeType ?? 'audio/wav'
    );
    const transcript = transcriptionResult.text;

    if (!transcript || transcript.trim().length === 0) {
      this.log('Warning: Empty transcript received');
      return {
        transcript: '',
        segments: [],
      };
    }

    this.log(`Transcription complete: ${transcript.substring(0, 50)}...`);

    // Step 2: Analyze transcript
    return await this.analyzeText(transcript, options);
  }

  /**
   * Analyze text content and extract structured segments
   *
   * This method is useful for:
   * - Testing without audio
   * - Re-analyzing existing transcripts
   * - Analyzing text from other sources
   *
   * @param text - The text to analyze
   * @param options - Analysis options
   * @returns Structured analysis result
   * @throws {GeminiError} If analysis fails
   *
   * @example
   * ```typescript
   * const analysis = await service.analyzeText(
   *   "I finished the report. I need to send it to the team."
   * );
   * // Returns: { transcript: "...", segments: [...] }
   * ```
   */
  async analyzeText(
    text: string,
    options: AnalyzeTextOptions = {}
  ): Promise<AnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw this.createError('INVALID_REQUEST', 'Text cannot be empty');
    }

    this.log('Step 2: Analyzing content with classification prompt...');

    try {
      // Construct the full prompt with the transcript
      const fullPrompt = `${CLASSIFICATION_PROMPT}\n\n${text}`;

      // Get raw analysis from Gemini
      const geminiResult = await this.gemini.analyzeContent(text, CLASSIFICATION_PROMPT);
      const rawResponse = geminiResult.content;

      if (options.includeRaw) {
        this.log(`Raw AI response: ${rawResponse}`);
      }

      // Step 3: Parse JSON response
      this.log('Step 3: Parsing JSON response...');
      const parsed = this.parseJsonResponse(rawResponse);

      // Step 4: Validate and transform response
      this.log('Step 4: Validating and transforming response...');
      const segments = this.validateResponse(parsed);

      this.log(`Analysis complete: extracted ${segments.length} segments`);

      return {
        transcript: text,
        segments,
      };
    } catch (error) {
      this.log(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Parse the JSON response from Gemini
   * Handles cases where the response might include markdown code blocks
   *
   * @param response - Raw text response from Gemini
   * @returns Parsed response object
   * @throws {GeminiError} If JSON parsing fails
   */
  private parseJsonResponse(response: string): GeminiAnalysisResponse {
    try {
      // Remove markdown code block markers if present
      let cleaned = response.trim();

      // Check for markdown code blocks: ```json ... ``` or ``` ... ```
      if (cleaned.startsWith('```')) {
        // Remove opening ```json or ```
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing ```
        cleaned = cleaned.replace(/\n?```\s*$/, '');
      }

      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Response is not an object');
      }

      return parsed as GeminiAnalysisResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parsing error';
      throw this.createError(
        'INVALID_REQUEST',
        `Failed to parse JSON response: ${message}\n\nResponse:\n${response.substring(0, 500)}`
      );
    }
  }

  /**
   * Validate the response structure and convert to typed segments
   *
   * @param response - Parsed response from Gemini
   * @returns Array of validated segments
   * @throws {GeminiError} If validation fails
   */
  private validateResponse(response: GeminiAnalysisResponse): Segment[] {
    // Validate top-level structure
    if (!response.segments || !Array.isArray(response.segments)) {
      throw this.createError(
        'INVALID_REQUEST',
        'Response missing "segments" array'
      );
    }

    const validSegments: Segment[] = [];

    for (let i = 0; i < response.segments.length; i++) {
      const segment = response.segments[i];

      try {
        // Validate required fields
        if (!segment.type || typeof segment.type !== 'string') {
          this.log(`Warning: Segment ${i} missing or invalid type, skipping`);
          continue;
        }

        if (!segment.text || typeof segment.text !== 'string') {
          this.log(`Warning: Segment ${i} missing or invalid text, skipping`);
          continue;
        }

        // Validate segment type
        const type = this.validateSegmentType(segment.type);
        if (!type) {
          this.log(`Warning: Segment ${i} has invalid type "${segment.type}", skipping`);
          continue;
        }

        // Build valid segment
        const validSegment: Segment = {
          type,
          text: segment.text.trim(),
        };

        // Add optional confidence score
        if (segment.confidence !== undefined) {
          const confidence = Number(segment.confidence);
          if (!isNaN(confidence) && confidence >= 0 && confidence <= 1) {
            validSegment.confidence = confidence;
          } else {
            this.log(`Warning: Segment ${i} has invalid confidence "${segment.confidence}", ignoring`);
          }
        }

        // Add type-specific fields
        if (type === 'todo' && segment.priority) {
          const priority = this.validatePriority(segment.priority);
          if (priority) {
            validSegment.priority = priority;
          } else {
            this.log(`Warning: Segment ${i} has invalid priority "${segment.priority}", using default`);
            validSegment.priority = 'medium';
          }
        }

        if (type === 'idea' && segment.category) {
          if (typeof segment.category === 'string') {
            validSegment.category = segment.category.trim();
          }
        }

        if (type === 'learning' && segment.topic) {
          if (typeof segment.topic === 'string') {
            validSegment.topic = segment.topic.trim();
          }
        }

        validSegments.push(validSegment);
      } catch (error) {
        // Log and skip invalid segments
        this.log(`Warning: Error validating segment ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    if (validSegments.length === 0 && response.segments.length > 0) {
      this.log('Warning: All segments failed validation');
    }

    return validSegments;
  }

  /**
   * Validate and normalize segment type
   *
   * @param type - Raw type string from API
   * @returns Valid SegmentType or null if invalid
   */
  private validateSegmentType(type: string): SegmentType | null {
    const normalized = type.toLowerCase().trim();

    const validTypes: SegmentType[] = ['accomplishment', 'todo', 'idea', 'learning'];

    if (validTypes.includes(normalized as SegmentType)) {
      return normalized as SegmentType;
    }

    return null;
  }

  /**
   * Validate and normalize priority
   *
   * @param priority - Raw priority string from API
   * @returns Valid Priority or null if invalid
   */
  private validatePriority(priority: string): Priority | null {
    const normalized = priority.toLowerCase().trim();

    const validPriorities: Priority[] = ['high', 'medium', 'low'];

    if (validPriorities.includes(normalized as Priority)) {
      return normalized as Priority;
    }

    return null;
  }

  /**
   * Create a standardized GeminiError
   */
  private createError(
    code: GeminiError['code'],
    message: string
  ): GeminiError {
    return { code, message };
  }

  /**
   * Log a message (for debugging)
   * In production, this could be replaced with a proper logging service
   */
  private log(message: string): void {
    console.log(`[AnalysisService] ${message}`);
  }
}

// Export singleton instance for common use
export const analysisService = new AnalysisService();
