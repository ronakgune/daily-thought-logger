/**
 * Tests for TextInputService
 * [AI-22] Add text input mode for testing (bypass audio)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextInputService } from '../src/services/text-input';
import { AnalysisService } from '../src/services/analysis';
import type { AnalysisResult } from '../src/types';

// Mock AnalysisService
vi.mock('../src/services/analysis');

describe('TextInputService', () => {
  let service: TextInputService;
  let mockAnalysis: AnalysisService;

  beforeEach(() => {
    // Create mock AnalysisService
    mockAnalysis = new AnalysisService() as any;
    mockAnalysis.analyzeText = vi.fn();
    service = new TextInputService(mockAnalysis);

    // Silence console.log in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('mode management', () => {
    it('should default to voice mode', () => {
      expect(service.getMode()).toBe('voice');
      expect(service.isVoiceMode()).toBe(true);
      expect(service.isTextMode()).toBe(false);
    });

    it('should set mode to text', () => {
      service.setMode('text');

      expect(service.getMode()).toBe('text');
      expect(service.isTextMode()).toBe(true);
      expect(service.isVoiceMode()).toBe(false);
    });

    it('should set mode to voice', () => {
      service.setMode('text');
      service.setMode('voice');

      expect(service.getMode()).toBe('voice');
      expect(service.isVoiceMode()).toBe(true);
      expect(service.isTextMode()).toBe(false);
    });

    it('should throw error for invalid mode', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        service.setMode('invalid');
      }).toThrow("Invalid input mode: invalid. Must be 'voice' or 'text'");
    });

    it('should toggle from voice to text', () => {
      expect(service.getMode()).toBe('voice');

      const newMode = service.toggle();

      expect(newMode).toBe('text');
      expect(service.getMode()).toBe('text');
      expect(service.isTextMode()).toBe(true);
    });

    it('should toggle from text to voice', () => {
      service.setMode('text');

      const newMode = service.toggle();

      expect(newMode).toBe('voice');
      expect(service.getMode()).toBe('voice');
      expect(service.isVoiceMode()).toBe(true);
    });

    it('should toggle multiple times', () => {
      expect(service.getMode()).toBe('voice');

      service.toggle(); // voice -> text
      expect(service.getMode()).toBe('text');

      service.toggle(); // text -> voice
      expect(service.getMode()).toBe('voice');

      service.toggle(); // voice -> text
      expect(service.getMode()).toBe('text');
    });
  });

  describe('text submission', () => {
    const mockResult: AnalysisResult = {
      transcript: 'Test transcript',
      segments: [
        {
          type: 'todo',
          text: 'Complete the task',
          confidence: 0.95,
          priority: 'high',
        },
      ],
    };

    beforeEach(() => {
      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);
    });

    it('should submit single-line text', async () => {
      const text = 'I need to complete the task today.';
      const result = await service.submitText(text);

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(text, {
        includeRaw: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should submit multi-line text', async () => {
      const text = `I finished the authentication module.
Tomorrow I need to write tests.
Maybe add OAuth support later.`;

      const result = await service.submitText(text);

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(text, {
        includeRaw: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle text with leading/trailing whitespace', async () => {
      const text = '  I need to review the code.  ';
      await service.submitText(text);

      // Should pass the text as-is to AnalysisService
      // (AnalysisService is responsible for trimming)
      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(text, {
        includeRaw: undefined,
      });
    });

    it('should pass includeRaw option to AnalysisService', async () => {
      const text = 'Test text';
      await service.submitText(text, { includeRaw: true });

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(text, {
        includeRaw: true,
      });
    });

    it('should throw error for empty text', async () => {
      await expect(service.submitText('')).rejects.toThrow(
        'Text input cannot be empty'
      );
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(service.submitText('   \n   \t   ')).rejects.toThrow(
        'Text input cannot be empty'
      );
    });

    it('should propagate AnalysisService errors', async () => {
      const error = new Error('Analysis failed');
      (mockAnalysis.analyzeText as any).mockRejectedValue(error);

      await expect(service.submitText('Test text')).rejects.toThrow(
        'Analysis failed'
      );
    });

    it('should work with text containing special characters', async () => {
      const text = "I need to review John's code! It's @urgent #priority-1.";
      await service.submitText(text);

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(text, {
        includeRaw: undefined,
      });
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      await service.submitText(longText);

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith(longText, {
        includeRaw: undefined,
      });
    });
  });

  describe('text validation', () => {
    it('should validate non-empty text as valid', () => {
      const result = service.validateText('This is valid text');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate multi-line text as valid', () => {
      const text = `Line 1
Line 2
Line 3`;

      const result = service.validateText(text);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty string', () => {
      const result = service.validateText('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = service.validateText('   \n   \t   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text cannot be empty');
    });

    it('should reject text exceeding maximum length', () => {
      const tooLongText = 'a'.repeat(50001); // MAX_LENGTH is 50000

      const result = service.validateText(tooLongText);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text exceeds maximum length of 50000 characters');
    });

    it('should validate text at maximum length boundary', () => {
      const maxLengthText = 'a'.repeat(50000);

      const result = service.validateText(maxLengthText);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate text with special characters', () => {
      const text = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

      const result = service.validateText(text);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should get current configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual({
        mode: 'voice',
      });
    });

    it('should return immutable configuration copy', () => {
      const config = service.getConfig();

      // Attempt to modify the returned config
      (config as any).mode = 'text';

      // Original service config should be unchanged
      expect(service.getMode()).toBe('voice');
    });

    it('should reflect mode changes in config', () => {
      service.setMode('text');

      const config = service.getConfig();

      expect(config.mode).toBe('text');
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical development workflow', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Test input',
        segments: [
          {
            type: 'accomplishment',
            text: 'Finished feature',
            confidence: 0.9,
          },
        ],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      // 1. Start in voice mode
      expect(service.isVoiceMode()).toBe(true);

      // 2. Switch to text mode for testing
      service.setMode('text');
      expect(service.isTextMode()).toBe(true);

      // 3. Validate input before submission
      const validation = service.validateText('I finished the feature today.');
      expect(validation.valid).toBe(true);

      // 4. Submit text
      const result = await service.submitText('I finished the feature today.');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('accomplishment');

      // 5. Switch back to voice mode
      service.setMode('voice');
      expect(service.isVoiceMode()).toBe(true);
    });

    it('should handle debugging scenario with includeRaw', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Debug test',
        segments: [],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      // Enable text mode
      service.setMode('text');

      // Submit with includeRaw for debugging
      await service.submitText('Debug test', { includeRaw: true });

      expect(mockAnalysis.analyzeText).toHaveBeenCalledWith('Debug test', {
        includeRaw: true,
      });
    });

    it('should handle manual thought entry when mic unavailable', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Manual entry',
        segments: [
          { type: 'todo', text: 'Call the client', priority: 'high' },
          { type: 'idea', text: 'New feature idea', category: 'product' },
        ],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      // User can't use mic, switches to text
      service.toggle();

      // Enter multiple thoughts at once
      const result = await service.submitText(
        'I need to call the client tomorrow. Had an idea for a new feature.'
      );

      expect(result.segments).toHaveLength(2);
    });
  });

  describe('logging', () => {
    let consoleLogSpy: any;

    beforeEach(() => {
      // Re-enable console.log for these tests
      vi.restoreAllMocks();
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log mode changes', () => {
      service.setMode('text');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[TextInputService] Switching input mode from 'voice' to 'text'"
      );
    });

    it('should log text submission', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Test',
        segments: [{ type: 'todo', text: 'Task' }],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      await service.submitText('Test text');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TextInputService] Submitting text for analysis...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TextInputService] Text length: 9 characters'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TextInputService] Analysis complete: 1 segments extracted'
      );
    });

    it('should log multi-line detection', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Multi-line',
        segments: [],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      await service.submitText('Line 1\nLine 2\nLine 3');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TextInputService] Multi-line input detected: 3 non-empty lines'
      );
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', async () => {
      const { textInputService } = await import('../src/services/text-input');

      expect(textInputService).toBeInstanceOf(TextInputService);
      expect(textInputService.getMode()).toBe('voice');
    });
  });

  describe('same analysis pipeline as voice', () => {
    it('should use AnalysisService.analyzeText (same as voice workflow)', async () => {
      const mockResult: AnalysisResult = {
        transcript: 'Test',
        segments: [
          {
            type: 'learning',
            text: 'Learned something new',
            topic: 'TypeScript',
            confidence: 0.88,
          },
        ],
      };

      (mockAnalysis.analyzeText as any).mockResolvedValue(mockResult);

      const result = await service.submitText('Test text');

      // Verify it uses the same analyzeText method that voice workflow uses
      expect(mockAnalysis.analyzeText).toHaveBeenCalled();

      // Verify output format is identical
      expect(result).toHaveProperty('transcript');
      expect(result).toHaveProperty('segments');
      expect(result.segments[0]).toHaveProperty('type');
      expect(result.segments[0]).toHaveProperty('text');
      expect(result.segments[0]).toHaveProperty('confidence');
      expect(result.segments[0]).toHaveProperty('topic');
    });
  });
});
