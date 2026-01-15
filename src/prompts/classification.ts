/**
 * Gemini Classification Prompt
 *
 * This module provides the core prompt for audio transcription and content classification.
 * The prompt is designed to work with Google's Gemini API to transcribe audio and classify
 * segments into categories: ACCOMPLISHMENTS, IDEAS, TODOS, and LEARNINGS.
 *
 * @module prompts/classification
 */

/**
 * Classification types supported by the system
 */
export type ClassificationType = 'accomplishment' | 'idea' | 'todo' | 'learning';

/**
 * Priority levels for TODO items
 */
export type TodoPriority = 'high' | 'medium' | 'low';

/**
 * Represents a classified segment from the audio
 */
export interface ClassifiedSegment {
  /** The type of content */
  type: ClassificationType;
  /** The transcribed text for this segment */
  text: string;
  /** Confidence score between 0 and 1 */
  confidence: number;
  /** Priority level (only for TODOs) */
  priority?: TodoPriority;
  /** Category (only for IDEAS) */
  category?: string;
  /** Topic (only for LEARNINGS) */
  topic?: string;
}

/**
 * Expected output format from the classification prompt
 */
export interface ClassificationOutput {
  /** Full transcription of the audio */
  transcript: string;
  /** Array of classified segments */
  segments: ClassifiedSegment[];
}

/**
 * Generates the classification prompt for Gemini
 *
 * This prompt instructs Gemini to:
 * 1. Transcribe the audio accurately
 * 2. Identify and classify distinct segments
 * 3. Assign confidence scores
 * 4. Extract metadata (priority, category, topic)
 * 5. Return structured JSON output
 *
 * @returns The formatted prompt string
 */
export function getClassificationPrompt(): string {
  return `You are an expert audio transcription and content classification assistant. Your task is to transcribe audio content and classify each meaningful segment into one of four categories.

**CATEGORIES:**

1. **ACCOMPLISHMENT**: Something the speaker has completed or achieved
   - Past tense actions ("I finished...", "I completed...", "I built...")
   - Achievements and successes
   - Completed milestones

2. **IDEA**: A thought, suggestion, or potential future action
   - Creative concepts or brainstorming
   - Suggestions for improvement
   - Future possibilities ("What if...", "We could...", "It might be good to...")
   - Extract a relevant category (e.g., "product", "marketing", "technical", "business")

3. **TODO**: An action item or task to be completed
   - Explicit tasks ("I need to...", "I should...", "I have to...")
   - Action items and obligations
   - Assign priority based on urgency cues:
     - HIGH: "urgent", "ASAP", "critical", "immediately", "today"
     - MEDIUM: "soon", "this week", "important"
     - LOW: "eventually", "someday", "when possible", or no urgency indicators

4. **LEARNING**: New knowledge, insight, or lesson learned
   - Discoveries ("I learned...", "I discovered...", "I realized...")
   - Insights and observations
   - Knowledge gained from experience
   - Extract a relevant topic (e.g., "programming", "management", "design", "communication")

**CONFIDENCE SCORING:**

Assign a confidence score (0.0 to 1.0) for each classification:
- 0.9-1.0: Very clear and unambiguous
- 0.7-0.89: Confident but some ambiguity
- 0.5-0.69: Moderate confidence, could fit multiple categories
- 0.3-0.49: Low confidence, unclear
- 0.0-0.29: Very uncertain

**HANDLING AMBIGUITY:**

- If a segment could fit multiple categories, choose the most likely and adjust confidence accordingly
- If a segment contains multiple distinct items, split it into separate segments
- If content is casual conversation with no clear category, you may omit it or classify with low confidence
- Preserve the speaker's original meaning and intent

**OUTPUT FORMAT:**

Return ONLY valid JSON in this exact format:

\`\`\`json
{
  "transcript": "The complete verbatim transcription of the audio",
  "segments": [
    {
      "type": "todo",
      "text": "The specific text for this segment",
      "confidence": 0.95,
      "priority": "high"
    },
    {
      "type": "idea",
      "text": "Another segment",
      "confidence": 0.88,
      "category": "product"
    },
    {
      "type": "learning",
      "text": "A third segment",
      "confidence": 0.92,
      "topic": "programming"
    },
    {
      "type": "accomplishment",
      "text": "A fourth segment",
      "confidence": 0.97
    }
  ]
}
\`\`\`

**IMPORTANT RULES:**

1. The "transcript" field must contain the complete, accurate transcription
2. Each segment must have: type, text, and confidence (all required)
3. TODOs must include a priority field
4. IDEAS must include a category field
5. LEARNINGS must include a topic field
6. ACCOMPLISHMENTS only need type, text, and confidence
7. Confidence scores must be between 0.0 and 1.0
8. Return ONLY the JSON object, no additional text or markdown
9. Ensure all JSON is properly formatted and parseable
10. If the audio is unclear or empty, return an empty segments array but still include the transcript field

Process the audio and provide your classification now.`;
}

/**
 * Validates the classification output format
 *
 * @param output - The output to validate
 * @returns True if valid, false otherwise
 */
export function validateClassificationOutput(output: any): output is ClassificationOutput {
  // Check basic structure
  if (!output || typeof output !== 'object') {
    return false;
  }

  // Check transcript
  if (typeof output.transcript !== 'string') {
    return false;
  }

  // Check segments array
  if (!Array.isArray(output.segments)) {
    return false;
  }

  // Validate each segment
  for (const segment of output.segments) {
    // Required fields
    if (!segment.type || !segment.text || typeof segment.confidence !== 'number') {
      return false;
    }

    // Valid type
    const validTypes: ClassificationType[] = ['accomplishment', 'idea', 'todo', 'learning'];
    if (!validTypes.includes(segment.type)) {
      return false;
    }

    // Confidence range
    if (segment.confidence < 0 || segment.confidence > 1) {
      return false;
    }

    // Type-specific validations
    if (segment.type === 'todo' && !segment.priority) {
      return false;
    }

    if (segment.type === 'idea' && !segment.category) {
      return false;
    }

    if (segment.type === 'learning' && !segment.topic) {
      return false;
    }

    // Validate priority values
    if (segment.priority) {
      const validPriorities: TodoPriority[] = ['high', 'medium', 'low'];
      if (!validPriorities.includes(segment.priority)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Example usage and expected output format
 */
export const CLASSIFICATION_EXAMPLE: ClassificationOutput = {
  transcript: "I finished implementing the login feature today. I need to write tests for it tomorrow. I'm thinking we could add social login options. I learned that JWT tokens should be rotated regularly for security.",
  segments: [
    {
      type: 'accomplishment',
      text: 'I finished implementing the login feature today',
      confidence: 0.95
    },
    {
      type: 'todo',
      text: 'I need to write tests for it tomorrow',
      confidence: 0.93,
      priority: 'medium'
    },
    {
      type: 'idea',
      text: 'We could add social login options',
      confidence: 0.88,
      category: 'product'
    },
    {
      type: 'learning',
      text: 'JWT tokens should be rotated regularly for security',
      confidence: 0.91,
      topic: 'security'
    }
  ]
};
