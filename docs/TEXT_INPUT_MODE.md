# Text Input Mode

**Feature:** AI-22 - Text input mode for testing (bypass audio)

## Overview

The Text Input Mode feature allows developers to test the analysis pipeline without requiring audio input. This is useful for:

- **Development Testing**: Test classification prompts without recording audio
- **Manual Entry**: Enter thoughts when speaking isn't possible
- **Debugging**: Test specific input scenarios with known text
- **CI/CD**: Run automated tests without audio files

## Key Features

✅ Toggle between voice and text input modes
✅ Multi-line text support
✅ Same analysis pipeline as voice input
✅ Input validation before submission
✅ Singleton instance for easy access
✅ Comprehensive error handling

## Quick Start

### Basic Usage

```typescript
import { textInputService } from './services';

// Switch to text mode
textInputService.setMode('text');

// Submit text for analysis
const result = await textInputService.submitText(
  "I finished the report today. I need to send it to the team tomorrow."
);

console.log(result.segments);
// [
//   { type: 'accomplishment', text: 'Finished the report', ... },
//   { type: 'todo', text: 'Send report to the team', priority: 'medium', ... }
// ]
```

### Toggle Modes

```typescript
import { textInputService } from './services';

// Check current mode
console.log(textInputService.getMode()); // 'voice'

// Toggle to text mode
textInputService.toggle();
console.log(textInputService.getMode()); // 'text'

// Toggle back to voice
textInputService.toggle();
console.log(textInputService.getMode()); // 'voice'
```

### Validate Before Submit

```typescript
import { textInputService } from './services';

const text = "Review the pull request";

// Validate first
const validation = textInputService.validateText(text);

if (validation.valid) {
  const result = await textInputService.submitText(text);
  // Process result...
} else {
  console.error(validation.error);
}
```

## API Reference

### TextInputService

#### Constructor

```typescript
new TextInputService(analysisService?: AnalysisService)
```

Creates a new TextInputService instance. Optionally accepts a custom AnalysisService for testing.

#### Methods

##### `getMode(): InputMode`

Returns the current input mode (`'voice'` or `'text'`).

```typescript
const mode = service.getMode(); // 'voice' or 'text'
```

##### `setMode(mode: InputMode): void`

Sets the input mode.

```typescript
service.setMode('text');  // Switch to text input
service.setMode('voice'); // Switch to voice input
```

**Throws:** Error if mode is invalid

##### `toggle(): InputMode`

Toggles between voice and text modes. Returns the new mode.

```typescript
const newMode = service.toggle(); // Switches and returns new mode
```

##### `isTextMode(): boolean`

Returns `true` if currently in text mode.

```typescript
if (service.isTextMode()) {
  // Show text input UI
}
```

##### `isVoiceMode(): boolean`

Returns `true` if currently in voice mode.

```typescript
if (service.isVoiceMode()) {
  // Show microphone UI
}
```

##### `submitText(text: string, options?: TextInputOptions): Promise<AnalysisResult>`

Submits text for analysis. Returns structured segments extracted by AI.

```typescript
const result = await service.submitText(
  "Multi-line\ntext\nsupported",
  { includeRaw: true } // Optional: include raw AI response in logs
);
```

**Parameters:**
- `text`: The text to analyze (supports multi-line)
- `options.includeRaw`: Include raw AI response in logs (default: false)

**Returns:** `Promise<AnalysisResult>` with transcript and segments

**Throws:**
- Error if text is empty or whitespace-only
- GeminiError if analysis fails

##### `validateText(text: string): { valid: boolean; error?: string }`

Validates text without submitting it. Useful for UI validation.

```typescript
const validation = service.validateText("");
// { valid: false, error: "Text cannot be empty" }

const validation2 = service.validateText("Valid text");
// { valid: true }
```

##### `getConfig(): Readonly<TextInputConfig>`

Returns the current configuration (immutable copy).

```typescript
const config = service.getConfig();
console.log(config.mode); // 'voice' or 'text'
```

### Types

#### `InputMode`

```typescript
type InputMode = 'voice' | 'text';
```

#### `TextInputOptions`

```typescript
interface TextInputOptions {
  /** Whether to include raw AI response in logs (default: false) */
  includeRaw?: boolean;
}
```

#### `TextInputConfig`

```typescript
interface TextInputConfig {
  /** Current input mode (default: 'voice') */
  mode: InputMode;
}
```

## Use Cases

### 1. Development Testing

Test the classification prompt without recording audio:

```typescript
import { textInputService } from './services';

textInputService.setMode('text');

const testCases = [
  "I finished the project",           // Should detect: accomplishment
  "I need to review the code",        // Should detect: todo
  "We could add dark mode",           // Should detect: idea
  "I learned about React hooks",      // Should detect: learning
];

for (const test of testCases) {
  const result = await textInputService.submitText(test);
  console.log(`Input: "${test}"`);
  console.log(`Detected: ${result.segments[0]?.type}`);
}
```

### 2. Manual Thought Entry

Enter thoughts when microphone is unavailable:

```typescript
import { textInputService } from './services';

// User's microphone is broken or in a quiet environment
textInputService.setMode('text');

const result = await textInputService.submitText(`
  Had a productive day today:
  - Finished the authentication module
  - Fixed three critical bugs
  - Reviewed two PRs

  Tomorrow I need to:
  - Write documentation
  - Deploy to staging
  - Schedule team meeting
`);

// Extracts multiple accomplishments and todos
```

### 3. Debugging Classification

Test edge cases and debug classification accuracy:

```typescript
import { textInputService } from './services';

textInputService.setMode('text');

// Enable raw response logging for debugging
const result = await textInputService.submitText(
  "Edge case: I might need to maybe possibly review the code",
  { includeRaw: true }
);

// Check logs to see how AI interpreted the uncertain language
```

### 4. Automated Testing

Run tests without audio files:

```typescript
describe('Classification Accuracy', () => {
  it('should classify accomplishments correctly', async () => {
    const result = await textInputService.submitText(
      "I successfully deployed the feature to production"
    );

    expect(result.segments[0].type).toBe('accomplishment');
    expect(result.segments[0].confidence).toBeGreaterThan(0.8);
  });
});
```

## Multi-line Input

The service fully supports multi-line text input:

```typescript
const multiLine = `
Line 1: I finished the report.
Line 2: I need to send it tomorrow.
Line 3: Maybe add charts next time.
`;

const result = await textInputService.submitText(multiLine);
// Analyzes all lines together
```

## Input Validation

The service validates text before submission:

### Valid Input

- Non-empty strings
- Multi-line text
- Text with special characters
- Up to 50,000 characters

### Invalid Input

- Empty strings (`""`)
- Whitespace-only (`"   \n   "`)
- Text exceeding 50,000 characters

### Validation Examples

```typescript
// Empty text
service.validateText("");
// { valid: false, error: "Text cannot be empty" }

// Whitespace only
service.validateText("   \n   ");
// { valid: false, error: "Text cannot be empty" }

// Too long
service.validateText("a".repeat(50001));
// { valid: false, error: "Text exceeds maximum length of 50000 characters" }

// Valid
service.validateText("This is valid");
// { valid: true }
```

## Same Pipeline as Voice

The text input service uses the **exact same analysis pipeline** as voice input:

```
Voice Input:     Audio → Transcription → Analysis → Segments
Text Input:      Text  ─────────────────→ Analysis → Segments
                          (same analyzeText method)
```

This ensures:
- Consistent output format
- Same segment types and structure
- Identical validation rules
- Same error handling

## Singleton Instance

The module exports a singleton instance for convenience:

```typescript
import { textInputService } from './services/text-input';

// Use directly without instantiation
textInputService.setMode('text');
const result = await textInputService.submitText("Test text");
```

Or create custom instances:

```typescript
import { TextInputService, AnalysisService } from './services';

const customAnalysis = new AnalysisService();
const customTextInput = new TextInputService(customAnalysis);
```

## Error Handling

The service handles various error cases:

```typescript
try {
  // Empty text
  await textInputService.submitText("");
} catch (error) {
  console.error(error.message); // "Text input cannot be empty"
}

try {
  // Analysis error (e.g., API failure)
  await textInputService.submitText("Valid text");
} catch (error) {
  console.error(error); // GeminiError with details
}

try {
  // Invalid mode
  textInputService.setMode('invalid');
} catch (error) {
  console.error(error.message); // "Invalid input mode: invalid..."
}
```

## Examples

See comprehensive examples in:

```
src/services/text-input.example.ts
```

Run examples:

```bash
# Set API key
export GEMINI_API_KEY="your-api-key"

# Run examples
npx tsx src/services/text-input.example.ts
```

## Testing

Comprehensive tests are available in:

```
tests/text-input.test.ts
```

Run tests:

```bash
npm test tests/text-input.test.ts
```

Test coverage includes:
- Mode management (get, set, toggle)
- Text submission (single-line, multi-line)
- Input validation
- Error handling
- Configuration management
- Integration scenarios
- Logging

## Integration with Existing Code

The TextInputService integrates seamlessly with existing services:

### With AnalysisService

```typescript
import { TextInputService, AnalysisService } from './services';

const analysis = new AnalysisService();
const textInput = new TextInputService(analysis);

// Both use the same AnalysisService instance
```

### With DatabaseService

```typescript
import { textInputService, getDatabaseService } from './services';

textInputService.setMode('text');

const result = await textInputService.submitText("I finished the task");
const db = getDatabaseService();

// Save to database
const log = await db.createLog({
  transcript: result.transcript,
});

// Save segments
for (const segment of result.segments) {
  if (segment.type === 'todo') {
    await db.createTodo({
      log_id: log.id,
      text: segment.text,
      priority: segment.priority || 'medium',
      confidence: segment.confidence,
    });
  }
}
```

### With IPC (Electron)

```typescript
// Main process
ipcMain.handle('text-input:submit', async (event, text: string) => {
  const result = await textInputService.submitText(text);
  return result;
});

// Renderer process
const result = await ipcRenderer.invoke('text-input:submit', textFromUI);
```

## Best Practices

1. **Validate Before Submit**: Always validate text before submission to provide immediate feedback

   ```typescript
   const validation = textInputService.validateText(userInput);
   if (!validation.valid) {
     showError(validation.error);
     return;
   }
   ```

2. **Handle Errors Gracefully**: Wrap submissions in try-catch blocks

   ```typescript
   try {
     const result = await textInputService.submitText(text);
     handleSuccess(result);
   } catch (error) {
     handleError(error);
   }
   ```

3. **Use Singleton for Consistency**: Use the singleton instance to maintain consistent mode across the app

   ```typescript
   import { textInputService } from './services';
   // Always use textInputService, not new TextInputService()
   ```

4. **Toggle Mode Based on Context**: Switch modes based on user preference or device capabilities

   ```typescript
   // Check if microphone is available
   const hasMicrophone = await checkMicrophone();
   textInputService.setMode(hasMicrophone ? 'voice' : 'text');
   ```

5. **Enable Raw Logs for Debugging**: Use `includeRaw: true` when debugging classification issues

   ```typescript
   const result = await textInputService.submitText(text, {
     includeRaw: true, // See full AI response in console
   });
   ```

## Troubleshooting

### Issue: Empty segments returned

**Solution**: Check the classification prompt and AI response. Enable raw logging:

```typescript
const result = await textInputService.submitText(text, { includeRaw: true });
// Check console for raw AI response
```

### Issue: "Text input cannot be empty" error

**Solution**: Ensure text is not empty or whitespace-only:

```typescript
const trimmed = text.trim();
if (trimmed.length === 0) {
  // Show error to user
  return;
}
```

### Issue: Mode not persisting

**Solution**: Use the singleton instance, not multiple instances:

```typescript
// ✓ Correct
import { textInputService } from './services';
textInputService.setMode('text');

// ✗ Wrong
import { TextInputService } from './services';
new TextInputService().setMode('text'); // Creates new instance
```

## Related Documentation

- [Analysis Service](../ANALYSIS_SERVICE.md) - Core analysis pipeline
- [Classification Prompt](../src/prompts/classification.ts) - AI classification logic
- [Type Definitions](../src/types/index.ts) - TypeScript types
- [Testing Guide](../README.md#testing-requirements) - Testing standards

## Future Enhancements

Potential improvements:

1. **Mode Persistence**: Save mode preference to local storage
2. **Batch Processing**: Submit multiple texts at once
3. **Template Support**: Predefined text templates for common scenarios
4. **Text Formatting**: Auto-formatting and cleanup
5. **History**: Store and recall previous text inputs
6. **Export**: Export text inputs for later analysis

## Support

For issues or questions:

1. Check the [examples](../src/services/text-input.example.ts)
2. Review [tests](../tests/text-input.test.ts) for usage patterns
3. Open an issue in the repository
