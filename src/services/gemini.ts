/**
 * GeminiService - Handles all Gemini API interactions
 * Includes secure API key management and core AI methods
 * [AI-11] Set up Gemini API service with API key config
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { KeychainService } from './keychain';
import type {
  GeminiOptions,
  GeminiResponse,
  GeminiError,
  GeminiErrorCode,
  GeminiModel,
  TranscriptionResult,
  AnalysisResult,
} from '../types/gemini';

const GEMINI_API_KEY_ACCOUNT = 'gemini-api-key';
const DEFAULT_MODEL: GeminiModel = 'gemini-1.5-flash';

/**
 * GeminiService provides a high-level interface for Gemini AI operations
 * with secure API key storage and comprehensive error handling
 */
export class GeminiService {
  private keychain: KeychainService;
  private client: GoogleGenerativeAI | null = null;
  private currentModel: GeminiModel = DEFAULT_MODEL;

  constructor(keychain?: KeychainService) {
    this.keychain = keychain ?? new KeychainService();
  }

  // ============================================
  // API Key Management
  // ============================================

  /**
   * Store the Gemini API key securely in macOS Keychain
   * @param key - The Gemini API key to store
   */
  async setApiKey(key: string): Promise<void> {
    if (!key || key.trim().length === 0) {
      throw this.createError('INVALID_API_KEY', 'API key cannot be empty');
    }

    // Validate the key format (Gemini keys start with 'AIza')
    if (!key.startsWith('AIza')) {
      throw this.createError(
        'INVALID_API_KEY',
        'Invalid API key format. Gemini API keys start with "AIza"'
      );
    }

    await this.keychain.setSecret(GEMINI_API_KEY_ACCOUNT, key);
    // Reset client so it will be re-initialized with new key
    this.client = null;
  }

  /**
   * Retrieve the stored Gemini API key
   * @returns The API key or null if not configured
   */
  async getApiKey(): Promise<string | null> {
    return await this.keychain.getSecret(GEMINI_API_KEY_ACCOUNT);
  }

  /**
   * Delete the stored API key
   * @returns True if deleted successfully
   */
  async deleteApiKey(): Promise<boolean> {
    this.client = null;
    return await this.keychain.deleteSecret(GEMINI_API_KEY_ACCOUNT);
  }

  /**
   * Check if an API key is configured
   * @returns True if API key exists in keychain
   */
  async hasApiKey(): Promise<boolean> {
    return await this.keychain.hasSecret(GEMINI_API_KEY_ACCOUNT);
  }

  /**
   * Validate an API key by making a test request
   * @param key - The API key to validate
   * @returns True if the key is valid
   */
  async validateApiKey(key: string): Promise<boolean> {
    if (!key || !key.startsWith('AIza')) {
      return false;
    }

    try {
      const testClient = new GoogleGenerativeAI(key);
      const model = testClient.getGenerativeModel({ model: DEFAULT_MODEL });

      // Make a minimal request to validate the key
      const result = await model.generateContent('Say "ok"');
      const response = result.response;
      return response.text().length > 0;
    } catch (error) {
      // Check if it's an authentication error
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('api key') ||
          message.includes('authentication') ||
          message.includes('401') ||
          message.includes('403')
        ) {
          return false;
        }
      }
      // Other errors (network, etc.) don't mean the key is invalid
      throw this.handleError(error);
    }
  }

  // ============================================
  // Core Methods
  // ============================================

  /**
   * Transcribe audio to text using Gemini's multimodal capabilities
   * @param audioBuffer - The audio data as a Buffer
   * @param mimeType - The MIME type of the audio (default: audio/wav)
   * @returns Transcription result with text
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/wav'
  ): Promise<TranscriptionResult> {
    const model = await this.getModel('gemini-1.5-flash');

    try {
      // Convert buffer to base64 for the API
      const base64Audio = audioBuffer.toString('base64');

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        {
          text: 'Please transcribe this audio recording accurately. Output only the transcribed text, nothing else.',
        },
      ]);

      const response = result.response;
      const text = response.text().trim();

      return {
        text,
        confidence: this.extractConfidence(response),
        language: 'en', // Could be detected from response metadata
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze text content with a custom prompt
   * @param text - The text to analyze
   * @param prompt - The analysis prompt/instructions
   * @returns Analysis result
   */
  async analyzeContent(text: string, prompt: string): Promise<AnalysisResult> {
    if (!text || text.trim().length === 0) {
      throw this.createError('INVALID_REQUEST', 'Text content cannot be empty');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw this.createError('INVALID_REQUEST', 'Analysis prompt cannot be empty');
    }

    const model = await this.getModel();

    try {
      const fullPrompt = `${prompt}\n\n---\n\nContent to analyze:\n${text}`;
      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      return {
        content: response.text(),
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send a raw request to Gemini
   * @param prompt - The prompt to send
   * @param options - Optional configuration
   * @returns The Gemini response
   */
  async sendRequest(
    prompt: string,
    options?: GeminiOptions
  ): Promise<GeminiResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw this.createError('INVALID_REQUEST', 'Prompt cannot be empty');
    }

    const modelName = options?.model ?? this.currentModel;
    const model = await this.getModel(modelName);

    try {
      // Configure generation parameters
      const generationConfig: Record<string, unknown> = {};

      if (options?.maxOutputTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxOutputTokens;
      }
      if (options?.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      }
      if (options?.topP !== undefined) {
        generationConfig.topP = options.topP;
      }
      if (options?.topK !== undefined) {
        generationConfig.topK = options.topK;
      }
      if (options?.stopSequences !== undefined) {
        generationConfig.stopSequences = options.stopSequences;
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig:
          Object.keys(generationConfig).length > 0 ? generationConfig : undefined,
      });

      const response = result.response;
      const candidate = response.candidates?.[0];

      return {
        text: response.text(),
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              candidatesTokens: response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
        safetyRatings: candidate?.safetyRatings?.map((rating) => ({
          category: rating.category,
          probability: rating.probability,
        })),
        finishReason: candidate?.finishReason as GeminiResponse['finishReason'],
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set the default model to use
   * @param model - The model name
   */
  setDefaultModel(model: GeminiModel): void {
    this.currentModel = model;
  }

  /**
   * Get the current default model
   * @returns The current model name
   */
  getDefaultModel(): GeminiModel {
    return this.currentModel;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Get or create the Gemini client
   */
  private async getClient(): Promise<GoogleGenerativeAI> {
    if (this.client) {
      return this.client;
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw this.createError(
        'INVALID_API_KEY',
        'No API key configured. Please set an API key first.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    return this.client;
  }

  /**
   * Get a configured model instance
   */
  private async getModel(modelName?: GeminiModel): Promise<GenerativeModel> {
    const client = await this.getClient();
    return client.getGenerativeModel({
      model: modelName ?? this.currentModel,
    });
  }

  /**
   * Extract confidence from response (placeholder - Gemini doesn't provide this directly)
   */
  private extractConfidence(
    _response: { text: () => string }
  ): number | undefined {
    // Gemini doesn't provide transcription confidence scores directly
    // This could be enhanced with custom logic if needed
    return undefined;
  }

  /**
   * Create a standardized GeminiError
   */
  private createError(code: GeminiErrorCode, message: string): GeminiError {
    return { code, message };
  }

  /**
   * Handle and transform errors from the Gemini API
   */
  private handleError(error: unknown): GeminiError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Rate limiting
      if (message.includes('rate') || message.includes('429')) {
        return this.createError(
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded. Please wait before making more requests.'
        );
      }

      // Quota exceeded
      if (message.includes('quota') || message.includes('billing')) {
        return this.createError(
          'QUOTA_EXCEEDED',
          'API quota exceeded. Please check your billing status.'
        );
      }

      // Authentication errors
      if (
        message.includes('api key') ||
        message.includes('authentication') ||
        message.includes('401') ||
        message.includes('403')
      ) {
        return this.createError(
          'INVALID_API_KEY',
          'Invalid or expired API key.'
        );
      }

      // Network errors
      if (
        message.includes('network') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        message.includes('enotfound')
      ) {
        return this.createError(
          'NETWORK_ERROR',
          'Network error. Please check your internet connection.'
        );
      }

      // Service unavailable
      if (message.includes('503') || message.includes('unavailable')) {
        return this.createError(
          'SERVICE_UNAVAILABLE',
          'Gemini service is temporarily unavailable. Please try again later.'
        );
      }

      // Content filtered
      if (message.includes('safety') || message.includes('blocked')) {
        return this.createError(
          'CONTENT_FILTERED',
          'Content was filtered due to safety settings.'
        );
      }

      // Return the original message for unknown errors
      return this.createError('UNKNOWN_ERROR', error.message);
    }

    return this.createError('UNKNOWN_ERROR', 'An unexpected error occurred');
  }
}

// Export singleton instance for common use
export const geminiService = new GeminiService();
