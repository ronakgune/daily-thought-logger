/**
 * Tests for GeminiService
 * [AI-11] Set up Gemini API service with API key config
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from '../src/services/gemini';
import { KeychainService } from '../src/services/keychain';

// Mock the keychain service
vi.mock('../src/services/keychain', () => {
  const MockKeychainService = vi.fn().mockImplementation(() => ({
    setSecret: vi.fn().mockResolvedValue(undefined),
    getSecret: vi.fn().mockResolvedValue(null),
    deleteSecret: vi.fn().mockResolvedValue(true),
    hasSecret: vi.fn().mockResolvedValue(false),
  }));
  return { KeychainService: MockKeychainService };
});

// Mock the Google Generative AI library
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => 'Mock response text',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
      candidates: [
        {
          finishReason: 'STOP',
          safetyRatings: [
            { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
          ],
        },
      ],
    },
  });

  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });

  const MockGoogleGenerativeAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));

  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

describe('GeminiService', () => {
  let service: GeminiService;
  let mockKeychain: {
    setSecret: ReturnType<typeof vi.fn>;
    getSecret: ReturnType<typeof vi.fn>;
    deleteSecret: ReturnType<typeof vi.fn>;
    hasSecret: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain = {
      setSecret: vi.fn().mockResolvedValue(undefined),
      getSecret: vi.fn().mockResolvedValue(null),
      deleteSecret: vi.fn().mockResolvedValue(true),
      hasSecret: vi.fn().mockResolvedValue(false),
    };
    service = new GeminiService(mockKeychain as unknown as KeychainService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('API Key Management', () => {
    describe('setApiKey', () => {
      it('should store a valid API key', async () => {
        const validKey = 'AIzaTestKey123456789';
        await service.setApiKey(validKey);
        expect(mockKeychain.setSecret).toHaveBeenCalledWith(
          'gemini-api-key',
          validKey
        );
      });

      it('should reject empty API key', async () => {
        await expect(service.setApiKey('')).rejects.toEqual({
          code: 'INVALID_API_KEY',
          message: 'API key cannot be empty',
        });
      });

      it('should reject API key with invalid format', async () => {
        await expect(service.setApiKey('invalid-key')).rejects.toEqual({
          code: 'INVALID_API_KEY',
          message: 'Invalid API key format. Gemini API keys start with "AIza"',
        });
      });
    });

    describe('getApiKey', () => {
      it('should retrieve stored API key', async () => {
        const storedKey = 'AIzaStoredKey123';
        mockKeychain.getSecret.mockResolvedValue(storedKey);
        const result = await service.getApiKey();
        expect(result).toBe(storedKey);
      });

      it('should return null when no key is stored', async () => {
        mockKeychain.getSecret.mockResolvedValue(null);
        const result = await service.getApiKey();
        expect(result).toBeNull();
      });
    });

    describe('deleteApiKey', () => {
      it('should delete the API key', async () => {
        const result = await service.deleteApiKey();
        expect(mockKeychain.deleteSecret).toHaveBeenCalledWith('gemini-api-key');
        expect(result).toBe(true);
      });
    });

    describe('hasApiKey', () => {
      it('should return true when key exists', async () => {
        mockKeychain.hasSecret.mockResolvedValue(true);
        const result = await service.hasApiKey();
        expect(result).toBe(true);
      });

      it('should return false when no key exists', async () => {
        mockKeychain.hasSecret.mockResolvedValue(false);
        const result = await service.hasApiKey();
        expect(result).toBe(false);
      });
    });

    describe('validateApiKey', () => {
      it('should return false for invalid format', async () => {
        const result = await service.validateApiKey('invalid-key');
        expect(result).toBe(false);
      });

      it('should return false for empty key', async () => {
        const result = await service.validateApiKey('');
        expect(result).toBe(false);
      });
    });
  });

  describe('Core Methods', () => {
    beforeEach(() => {
      mockKeychain.getSecret.mockResolvedValue('AIzaValidTestKey123');
    });

    describe('sendRequest', () => {
      it('should send a request and return formatted response', async () => {
        const result = await service.sendRequest('Test prompt');

        expect(result).toEqual({
          text: 'Mock response text',
          usage: {
            promptTokens: 10,
            candidatesTokens: 20,
            totalTokens: 30,
          },
          safetyRatings: [
            { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
          ],
          finishReason: 'STOP',
        });
      });

      it('should reject empty prompt', async () => {
        await expect(service.sendRequest('')).rejects.toEqual({
          code: 'INVALID_REQUEST',
          message: 'Prompt cannot be empty',
        });
      });

      it('should throw when no API key is configured', async () => {
        mockKeychain.getSecret.mockResolvedValue(null);
        await expect(service.sendRequest('Test')).rejects.toEqual({
          code: 'INVALID_API_KEY',
          message: 'No API key configured. Please set an API key first.',
        });
      });
    });

    describe('analyzeContent', () => {
      it('should analyze text with a prompt', async () => {
        const result = await service.analyzeContent(
          'Sample text',
          'Summarize this'
        );

        expect(result).toEqual({
          content: 'Mock response text',
          promptTokens: 10,
          responseTokens: 20,
        });
      });

      it('should reject empty text', async () => {
        await expect(
          service.analyzeContent('', 'Summarize this')
        ).rejects.toEqual({
          code: 'INVALID_REQUEST',
          message: 'Text content cannot be empty',
        });
      });

      it('should reject empty prompt', async () => {
        await expect(service.analyzeContent('Text', '')).rejects.toEqual({
          code: 'INVALID_REQUEST',
          message: 'Analysis prompt cannot be empty',
        });
      });
    });

    describe('transcribeAudio', () => {
      it('should transcribe audio buffer', async () => {
        const audioBuffer = Buffer.from('fake audio data');
        const result = await service.transcribeAudio(audioBuffer);

        expect(result).toEqual({
          text: 'Mock response text',
          confidence: undefined,
          language: 'en',
        });
      });
    });
  });

  describe('Model Configuration', () => {
    it('should have default model set', () => {
      expect(service.getDefaultModel()).toBe('gemini-1.5-flash');
    });

    it('should allow changing default model', () => {
      service.setDefaultModel('gemini-1.5-pro');
      expect(service.getDefaultModel()).toBe('gemini-1.5-pro');
    });
  });
});
