/**
 * TextInputService - Text input mode for testing without audio
 * [AI-22] Add text input mode for testing (bypass audio)
 *
 * Purpose:
 * - Development testing without microphone
 * - Manual entry of thoughts when speaking isn't possible
 * - Debugging classification prompt
 *
 * Features:
 * - Toggle between voice/text mode
 * - Accept multi-line text input
 * - Same analysis pipeline regardless of input method
 * - Useful for testing without mic
 */

import { AnalysisService } from './analysis';
import type { AnalysisResult } from '../types';

/**
 * Input mode for the thought logger
 */
export type InputMode = 'voice' | 'text';

/**
 * Options for text input analysis
 */
export interface TextInputOptions {
  /** Whether to include raw AI response in logs (default: false) */
  includeRaw?: boolean;
}

/**
 * Configuration for the TextInputService
 */
export interface TextInputConfig {
  /** Current input mode (default: 'voice') */
  mode: InputMode;
}

/**
 * TextInputService provides a testing interface for the analysis pipeline
 * without requiring audio input.
 *
 * This service allows developers to:
 * - Test the classification prompt without recording audio
 * - Debug segment extraction with known inputs
 * - Manually enter thoughts when microphone is unavailable
 *
 * @example
 * ```typescript
 * const service = new TextInputService();
 *
 * // Switch to text mode
 * service.setMode('text');
 *
 * // Submit text directly
 * const result = await service.submitText(
 *   "I finished the report today. I need to send it to the team tomorrow."
 * );
 *
 * console.log(result.segments); // [{ type: 'accomplishment', ... }, { type: 'todo', ... }]
 * ```
 */
export class TextInputService {
  private config: TextInputConfig;
  private analysisService: AnalysisService;

  /**
   * Create a new TextInputService
   *
   * @param analysisService - Optional AnalysisService instance for testing
   */
  constructor(analysisService?: AnalysisService) {
    this.config = {
      mode: 'voice',
    };
    this.analysisService = analysisService ?? new AnalysisService();
  }

  /**
   * Get the current input mode
   *
   * @returns Current input mode ('voice' or 'text')
   */
  getMode(): InputMode {
    return this.config.mode;
  }

  /**
   * Set the input mode
   *
   * @param mode - The input mode to use ('voice' or 'text')
   *
   * @example
   * ```typescript
   * service.setMode('text'); // Switch to text input
   * service.setMode('voice'); // Switch back to voice input
   * ```
   */
  setMode(mode: InputMode): void {
    if (mode !== 'voice' && mode !== 'text') {
      throw new Error(`Invalid input mode: ${mode}. Must be 'voice' or 'text'`);
    }

    this.log(`Switching input mode from '${this.config.mode}' to '${mode}'`);
    this.config.mode = mode;
  }

  /**
   * Toggle between voice and text input modes
   *
   * @returns The new input mode after toggling
   *
   * @example
   * ```typescript
   * console.log(service.getMode()); // 'voice'
   * service.toggle(); // Switches to 'text'
   * console.log(service.getMode()); // 'text'
   * service.toggle(); // Switches back to 'voice'
   * ```
   */
  toggle(): InputMode {
    const newMode: InputMode = this.config.mode === 'voice' ? 'text' : 'voice';
    this.setMode(newMode);
    return newMode;
  }

  /**
   * Check if currently in text input mode
   *
   * @returns True if in text mode, false if in voice mode
   */
  isTextMode(): boolean {
    return this.config.mode === 'text';
  }

  /**
   * Check if currently in voice input mode
   *
   * @returns True if in voice mode, false if in text mode
   */
  isVoiceMode(): boolean {
    return this.config.mode === 'voice';
  }

  /**
   * Submit text for analysis
   *
   * This method bypasses audio recording and transcription, going directly
   * to the analysis pipeline. It's useful for:
   * - Testing the classification prompt
   * - Development without microphone access
   * - Manual thought entry
   *
   * @param text - The text to analyze (can be multi-line)
   * @param options - Analysis options
   * @returns Structured analysis result with extracted segments
   * @throws {GeminiError} If analysis fails
   *
   * @example
   * ```typescript
   * // Single-line input
   * const result = await service.submitText("I finished the project today.");
   *
   * // Multi-line input
   * const multiLineResult = await service.submitText(`
   *   I completed the user authentication feature.
   *   Tomorrow I need to write tests for it.
   *   Maybe we could add OAuth support in the future.
   * `);
   * ```
   */
  async submitText(
    text: string,
    options: TextInputOptions = {}
  ): Promise<AnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }

    this.log('Submitting text for analysis...');
    this.log(`Text length: ${text.length} characters`);

    if (text.includes('\n')) {
      const lineCount = text.split('\n').filter(line => line.trim().length > 0).length;
      this.log(`Multi-line input detected: ${lineCount} non-empty lines`);
    }

    // Use the same analysis pipeline as voice input
    const result = await this.analysisService.analyzeText(text, {
      includeRaw: options.includeRaw,
    });

    this.log(`Analysis complete: ${result.segments.length} segments extracted`);

    return result;
  }

  /**
   * Validate text input
   *
   * Checks if the text is valid for analysis without actually submitting it.
   * Useful for UI validation before submission.
   *
   * @param text - The text to validate
   * @returns Object with validation result and optional error message
   *
   * @example
   * ```typescript
   * const validation = service.validateText("");
   * if (!validation.valid) {
   *   console.error(validation.error); // "Text cannot be empty"
   * }
   * ```
   */
  validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return {
        valid: false,
        error: 'Text cannot be empty',
      };
    }

    // Check for maximum length (from AnalysisService)
    const MAX_LENGTH = 50000;
    if (text.length > MAX_LENGTH) {
      return {
        valid: false,
        error: `Text exceeds maximum length of ${MAX_LENGTH} characters`,
      };
    }

    return { valid: true };
  }

  /**
   * Get current configuration
   *
   * @returns Current TextInputService configuration
   */
  getConfig(): Readonly<TextInputConfig> {
    return { ...this.config };
  }

  /**
   * Log a message (for debugging)
   */
  private log(message: string): void {
    console.log(`[TextInputService] ${message}`);
  }
}

// Export singleton instance for common use
export const textInputService = new TextInputService();
