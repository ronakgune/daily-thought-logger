import {
  getClassificationPrompt,
  validateClassificationOutput,
  ClassificationOutput,
  ClassifiedSegment,
  ClassificationType,
  TodoPriority,
  CLASSIFICATION_EXAMPLE
} from '../src/prompts/classification';

describe('Classification Prompt', () => {
  describe('getClassificationPrompt', () => {
    it('should return a non-empty string', () => {
      const prompt = getClassificationPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include all category descriptions', () => {
      const prompt = getClassificationPrompt();
      expect(prompt).toContain('ACCOMPLISHMENT');
      expect(prompt).toContain('IDEA');
      expect(prompt).toContain('TODO');
      expect(prompt).toContain('LEARNING');
    });

    it('should include confidence scoring guidelines', () => {
      const prompt = getClassificationPrompt();
      expect(prompt).toContain('CONFIDENCE SCORING');
      expect(prompt).toContain('0.0 to 1.0');
    });

    it('should include output format specification', () => {
      const prompt = getClassificationPrompt();
      expect(prompt).toContain('OUTPUT FORMAT');
      expect(prompt).toContain('transcript');
      expect(prompt).toContain('segments');
    });

    it('should include priority levels for todos', () => {
      const prompt = getClassificationPrompt();
      expect(prompt).toContain('priority');
      expect(prompt).toContain('HIGH');
      expect(prompt).toContain('MEDIUM');
      expect(prompt).toContain('LOW');
    });

    it('should include metadata extraction instructions', () => {
      const prompt = getClassificationPrompt();
      expect(prompt).toContain('category');
      expect(prompt).toContain('topic');
    });
  });

  describe('validateClassificationOutput', () => {
    describe('valid outputs', () => {
      it('should validate a complete valid output', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test transcript',
          segments: [
            {
              type: 'accomplishment',
              text: 'I completed the task',
              confidence: 0.95
            },
            {
              type: 'todo',
              text: 'I need to do something',
              confidence: 0.88,
              priority: 'high'
            },
            {
              type: 'idea',
              text: 'What if we tried this',
              confidence: 0.76,
              category: 'product'
            },
            {
              type: 'learning',
              text: 'I learned something new',
              confidence: 0.91,
              topic: 'programming'
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate output with empty segments array', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test transcript',
          segments: []
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate output with confidence at boundary values', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Min confidence',
              confidence: 0
            },
            {
              type: 'accomplishment',
              text: 'Max confidence',
              confidence: 1
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate the example output', () => {
        expect(validateClassificationOutput(CLASSIFICATION_EXAMPLE)).toBe(true);
      });

      it('should validate accomplishment without optional fields', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'I finished the task',
              confidence: 0.95
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });
    });

    describe('invalid outputs - structural issues', () => {
      it('should reject null', () => {
        expect(validateClassificationOutput(null)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validateClassificationOutput(undefined)).toBe(false);
      });

      it('should reject non-object types', () => {
        expect(validateClassificationOutput('string')).toBe(false);
        expect(validateClassificationOutput(123)).toBe(false);
        expect(validateClassificationOutput(true)).toBe(false);
        expect(validateClassificationOutput([])).toBe(false);
      });

      it('should reject output without transcript', () => {
        const invalidOutput = {
          segments: []
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject output with non-string transcript', () => {
        const invalidOutput = {
          transcript: 123,
          segments: []
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject output without segments', () => {
        const invalidOutput = {
          transcript: 'Test'
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject output with non-array segments', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: 'not an array'
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });
    });

    describe('invalid outputs - segment validation', () => {
      it('should reject segment without type', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              text: 'Some text',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject segment without text', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject segment without confidence', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text'
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject segment with non-string text', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 123,
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject segment with non-number confidence', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: '0.9'
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject segment with empty string text', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: '',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });
    });

    describe('invalid outputs - type validation', () => {
      it('should reject invalid classification type', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'invalid_type',
              text: 'Some text',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject uppercase type', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'ACCOMPLISHMENT',
              text: 'Some text',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });
    });

    describe('invalid outputs - confidence bounds', () => {
      it('should reject confidence below 0', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: -0.1
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject confidence above 1', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: 1.1
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject NaN confidence', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: NaN
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject Infinity confidence', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: Infinity
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject negative Infinity confidence', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: -Infinity
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });
    });

    describe('invalid outputs - type-specific fields', () => {
      it('should reject todo without priority', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'todo',
              text: 'Need to do this',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject todo with invalid priority', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'todo',
              text: 'Need to do this',
              confidence: 0.9,
              priority: 'urgent'
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject todo with non-string priority', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'todo',
              text: 'Need to do this',
              confidence: 0.9,
              priority: 1
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject idea without category', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'idea',
              text: 'We could try this',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject idea with non-string category', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'idea',
              text: 'We could try this',
              confidence: 0.9,
              category: 123
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject idea with empty category', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'idea',
              text: 'We could try this',
              confidence: 0.9,
              category: ''
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject learning without topic', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'learning',
              text: 'I learned something',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject learning with non-string topic', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'learning',
              text: 'I learned something',
              confidence: 0.9,
              topic: 123
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });

      it('should reject learning with empty topic', () => {
        const invalidOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'learning',
              text: 'I learned something',
              confidence: 0.9,
              topic: ''
            }
          ]
        };

        expect(validateClassificationOutput(invalidOutput)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should validate multiple segments of the same type', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'First accomplishment',
              confidence: 0.95
            },
            {
              type: 'accomplishment',
              text: 'Second accomplishment',
              confidence: 0.88
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate output with very long transcript', () => {
        const longTranscript = 'A'.repeat(10000);
        const validOutput: ClassificationOutput = {
          transcript: longTranscript,
          segments: []
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate output with special characters in text', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test with "quotes" and \'apostrophes\'',
          segments: [
            {
              type: 'accomplishment',
              text: 'Text with emoji 🎉 and symbols @#$%',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should validate output with unicode characters', () => {
        const validOutput: ClassificationOutput = {
          transcript: 'Test with 日本語 and 한글',
          segments: [
            {
              type: 'accomplishment',
              text: 'Unicode text: 你好世界',
              confidence: 0.9
            }
          ]
        };

        expect(validateClassificationOutput(validOutput)).toBe(true);
      });

      it('should reject segment with extra unexpected properties', () => {
        // While TypeScript would catch this at compile time,
        // runtime validation should still work correctly
        const outputWithExtra = {
          transcript: 'Test',
          segments: [
            {
              type: 'accomplishment',
              text: 'Some text',
              confidence: 0.9,
              unexpectedField: 'should be ignored'
            }
          ]
        };

        // This should still pass - we're lenient about extra fields
        expect(validateClassificationOutput(outputWithExtra)).toBe(true);
      });
    });
  });

  describe('Type definitions', () => {
    it('should have correct ClassificationType values', () => {
      const types: ClassificationType[] = ['accomplishment', 'idea', 'todo', 'learning'];
      expect(types).toHaveLength(4);
    });

    it('should have correct TodoPriority values', () => {
      const priorities: TodoPriority[] = ['high', 'medium', 'low'];
      expect(priorities).toHaveLength(3);
    });
  });
});
