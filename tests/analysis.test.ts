/**
 * Tests for AnalysisService
 * [AI-14] Build AnalysisService (audio → structured JSON)
 */

import { AnalysisService } from '../src/services/analysis';
import { GeminiService } from '../src/services/gemini';
import type { AnalysisResult as GeminiAnalysisResult } from '../src/types/gemini';
import type { TranscriptionResult } from '../src/types/gemini';

// Mock GeminiService
jest.mock('../src/services/gemini');

describe('AnalysisService', () => {
  let service: AnalysisService;
  let mockGemini: jest.Mocked<GeminiService>;

  beforeEach(() => {
    // Create mock Gemini service
    mockGemini = new GeminiService() as jest.Mocked<GeminiService>;
    service = new AnalysisService(mockGemini);

    // Silence console.log in tests
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeText', () => {
    it('should analyze text and extract structured segments', async () => {
      // Mock Gemini response
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            {
              type: 'accomplishment',
              text: 'Finished the user authentication module',
              confidence: 0.95,
            },
            {
              type: 'todo',
              text: 'Write tests for authentication',
              confidence: 0.9,
              priority: 'high',
            },
            {
              type: 'idea',
              text: 'Add OAuth support',
              confidence: 0.85,
              category: 'product',
            },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      // Analyze text
      const result = await service.analyzeText(
        'I finished the user authentication module. I need to write tests for it. Maybe add OAuth support later.'
      );

      // Verify structure
      expect(result).toBeDefined();
      expect(result.transcript).toBe(
        'I finished the user authentication module. I need to write tests for it. Maybe add OAuth support later.'
      );
      expect(result.segments).toHaveLength(3);

      // Verify accomplishment
      expect(result.segments[0]).toEqual({
        type: 'accomplishment',
        text: 'Finished the user authentication module',
        confidence: 0.95,
      });

      // Verify todo
      expect(result.segments[1]).toEqual({
        type: 'todo',
        text: 'Write tests for authentication',
        confidence: 0.9,
        priority: 'high',
      });

      // Verify idea
      expect(result.segments[2]).toEqual({
        type: 'idea',
        text: 'Add OAuth support',
        confidence: 0.85,
        category: 'product',
      });
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: '```json\n{"segments":[{"type":"todo","text":"Review code","confidence":0.9}]}\n```',
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('I need to review the code');

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('todo');
      expect(result.segments[0].text).toBe('Review code');
    });

    it('should handle JSON wrapped in code blocks without language tag', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: '```\n{"segments":[{"type":"learning","text":"TypeScript is great","topic":"typescript"}]}\n```',
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('I learned that TypeScript is great');

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('learning');
      expect(result.segments[0].topic).toBe('typescript');
    });

    it('should throw error for empty text', async () => {
      await expect(service.analyzeText('')).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
        message: 'Text cannot be empty',
      });

      await expect(service.analyzeText('   ')).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
        message: 'Text cannot be empty',
      });
    });

    it('should throw error for invalid JSON response', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: 'This is not JSON',
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      await expect(
        service.analyzeText('Some text')
      ).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
        message: expect.stringContaining('Failed to parse JSON response'),
      });
    });

    it('should throw error for missing segments array', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({ data: 'invalid' }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      await expect(
        service.analyzeText('Some text')
      ).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
        message: 'Response missing "segments" array',
      });
    });

    it('should skip segments with invalid types', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'todo', text: 'Valid todo', confidence: 0.9 },
            { type: 'invalid_type', text: 'This should be skipped', confidence: 0.8 },
            { type: 'idea', text: 'Valid idea', confidence: 0.85 },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].type).toBe('todo');
      expect(result.segments[1].type).toBe('idea');
    });

    it('should skip segments with missing text', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'todo', text: 'Valid todo' },
            { type: 'idea' }, // Missing text
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('todo');
    });

    it('should normalize segment types to lowercase', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'TODO', text: 'Uppercase todo' },
            { type: 'Idea', text: 'Mixed case idea' },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments[0].type).toBe('todo');
      expect(result.segments[1].type).toBe('idea');
    });

    it('should validate confidence scores', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'todo', text: 'Valid confidence', confidence: 0.9 },
            { type: 'idea', text: 'Invalid confidence', confidence: 1.5 }, // Out of range
            { type: 'learning', text: 'No confidence' }, // No confidence
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments[0].confidence).toBe(0.9);
      expect(result.segments[1].confidence).toBeUndefined();
      expect(result.segments[2].confidence).toBeUndefined();
    });

    it('should validate and set default priority for todos', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'todo', text: 'Valid priority', priority: 'high' },
            { type: 'todo', text: 'Invalid priority', priority: 'urgent' }, // Invalid
            { type: 'todo', text: 'No priority' }, // Missing
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments[0].priority).toBe('high');
      expect(result.segments[1].priority).toBe('medium'); // Default
      expect(result.segments[2].priority).toBeUndefined(); // Not set if not provided
    });

    it('should extract optional category for ideas', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'idea', text: 'Product idea', category: 'product' },
            { type: 'idea', text: 'No category' },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments[0].category).toBe('product');
      expect(result.segments[1].category).toBeUndefined();
    });

    it('should extract optional topic for learnings', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            { type: 'learning', text: 'TypeScript learning', topic: 'typescript' },
            { type: 'learning', text: 'No topic' },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments[0].topic).toBe('typescript');
      expect(result.segments[1].topic).toBeUndefined();
    });

    it('should handle empty segments array', async () => {
      const mockResponse: GeminiAnalysisResult = {
        content: JSON.stringify({ segments: [] }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockResponse);

      const result = await service.analyzeText('Some text');

      expect(result.segments).toHaveLength(0);
    });
  });

  describe('analyzeAudio', () => {
    it('should transcribe audio and analyze transcript', async () => {
      // Mock transcription
      const mockTranscription: TranscriptionResult = {
        text: 'I finished the project today',
        confidence: 0.95,
        language: 'en',
      };

      mockGemini.transcribeAudio.mockResolvedValue(mockTranscription);

      // Mock analysis
      const mockAnalysis: GeminiAnalysisResult = {
        content: JSON.stringify({
          segments: [
            {
              type: 'accomplishment',
              text: 'Finished the project',
              confidence: 0.9,
            },
          ],
        }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockAnalysis);

      // Analyze audio
      const audioBuffer = Buffer.from('fake audio data');
      const result = await service.analyzeAudio(audioBuffer);

      // Verify transcription was called
      expect(mockGemini.transcribeAudio).toHaveBeenCalledWith(audioBuffer, 'audio/wav');

      // Verify analysis was called with transcript
      expect(mockGemini.analyzeContent).toHaveBeenCalled();

      // Verify result
      expect(result.transcript).toBe('I finished the project today');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('accomplishment');
    });

    it('should use custom MIME type for audio', async () => {
      const mockTranscription: TranscriptionResult = {
        text: 'Test transcript',
        language: 'en',
      };

      mockGemini.transcribeAudio.mockResolvedValue(mockTranscription);

      const mockAnalysis: GeminiAnalysisResult = {
        content: JSON.stringify({ segments: [] }),
      };

      mockGemini.analyzeContent.mockResolvedValue(mockAnalysis);

      const audioBuffer = Buffer.from('fake audio data');
      await service.analyzeAudio(audioBuffer, { mimeType: 'audio/mp3' });

      expect(mockGemini.transcribeAudio).toHaveBeenCalledWith(audioBuffer, 'audio/mp3');
    });

    it('should handle empty transcription', async () => {
      const mockTranscription: TranscriptionResult = {
        text: '',
        language: 'en',
      };

      mockGemini.transcribeAudio.mockResolvedValue(mockTranscription);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await service.analyzeAudio(audioBuffer);

      // Should return empty result without calling analysis
      expect(result.transcript).toBe('');
      expect(result.segments).toHaveLength(0);
      expect(mockGemini.analyzeContent).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only transcription', async () => {
      const mockTranscription: TranscriptionResult = {
        text: '   \n\t  ',
        language: 'en',
      };

      mockGemini.transcribeAudio.mockResolvedValue(mockTranscription);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await service.analyzeAudio(audioBuffer);

      expect(result.transcript).toBe('');
      expect(result.segments).toHaveLength(0);
      expect(mockGemini.analyzeContent).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate Gemini transcription errors', async () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network error',
      };

      mockGemini.transcribeAudio.mockRejectedValue(error);

      const audioBuffer = Buffer.from('fake audio data');

      await expect(service.analyzeAudio(audioBuffer)).rejects.toEqual(error);
    });

    it('should propagate Gemini analysis errors', async () => {
      const error = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
      };

      mockGemini.analyzeContent.mockRejectedValue(error);

      await expect(service.analyzeText('Some text')).rejects.toEqual(error);
    });
  });
});
