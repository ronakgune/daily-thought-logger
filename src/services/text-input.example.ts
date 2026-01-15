/**
 * Example usage of TextInputService
 * [AI-22] Add text input mode for testing (bypass audio)
 *
 * This file demonstrates how to use the TextInputService for testing
 * the analysis pipeline without audio input.
 *
 * Usage:
 * ```bash
 * # Set your Gemini API key first
 * export GEMINI_API_KEY="your-api-key-here"
 *
 * # Run the example
 * npx tsx src/services/text-input.example.ts
 * ```
 */

import { TextInputService } from './text-input';
import { AnalysisService } from './analysis';
import { GeminiService } from './gemini';

/**
 * Example 1: Basic text input usage
 */
async function example1_basicUsage() {
  console.log('\n=== Example 1: Basic Text Input ===\n');

  const service = new TextInputService();

  // Check current mode
  console.log('Current mode:', service.getMode()); // 'voice'

  // Switch to text mode
  service.setMode('text');
  console.log('Switched to:', service.getMode()); // 'text'

  // Submit text for analysis
  const text = `
    I finished the user authentication module today.
    Tomorrow I need to write comprehensive tests for it.
    I'm thinking we could add OAuth support in the future.
  `;

  try {
    const result = await service.submitText(text);

    console.log('\nAnalysis Result:');
    console.log('Transcript:', result.transcript);
    console.log('\nExtracted Segments:');

    result.segments.forEach((segment, index) => {
      console.log(`\n${index + 1}. ${segment.type.toUpperCase()}`);
      console.log(`   Text: ${segment.text}`);
      if (segment.confidence) {
        console.log(`   Confidence: ${(segment.confidence * 100).toFixed(1)}%`);
      }
      if (segment.priority) {
        console.log(`   Priority: ${segment.priority}`);
      }
      if (segment.category) {
        console.log(`   Category: ${segment.category}`);
      }
      if (segment.topic) {
        console.log(`   Topic: ${segment.topic}`);
      }
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Toggle between modes
 */
function example2_toggleModes() {
  console.log('\n=== Example 2: Toggle Between Modes ===\n');

  const service = new TextInputService();

  console.log('Initial mode:', service.getMode()); // 'voice'
  console.log('Is voice mode?', service.isVoiceMode()); // true
  console.log('Is text mode?', service.isTextMode()); // false

  // Toggle to text
  service.toggle();
  console.log('\nAfter toggle:', service.getMode()); // 'text'
  console.log('Is voice mode?', service.isVoiceMode()); // false
  console.log('Is text mode?', service.isTextMode()); // true

  // Toggle back to voice
  service.toggle();
  console.log('\nAfter second toggle:', service.getMode()); // 'voice'
}

/**
 * Example 3: Text validation before submission
 */
function example3_validation() {
  console.log('\n=== Example 3: Text Validation ===\n');

  const service = new TextInputService();

  // Valid text
  const validText = 'I need to review the code tomorrow.';
  const validResult = service.validateText(validText);
  console.log('Valid text:', validResult);

  // Empty text
  const emptyText = '';
  const emptyResult = service.validateText(emptyText);
  console.log('Empty text:', emptyResult);

  // Whitespace only
  const whitespaceText = '   \n   \t   ';
  const whitespaceResult = service.validateText(whitespaceText);
  console.log('Whitespace text:', whitespaceResult);

  // Too long text
  const tooLongText = 'a'.repeat(50001);
  const tooLongResult = service.validateText(tooLongText);
  console.log('Too long text:', tooLongResult);
}

/**
 * Example 4: Development workflow (testing classification prompt)
 */
async function example4_testingWorkflow() {
  console.log('\n=== Example 4: Testing Classification Prompt ===\n');

  const service = new TextInputService();

  // Test different types of segments
  const testCases = [
    {
      name: 'Accomplishment',
      text: 'I successfully deployed the new feature to production.',
    },
    {
      name: 'Todo',
      text: 'I need to fix the bug in the payment processing module.',
    },
    {
      name: 'Idea',
      text: 'We could implement a caching layer to improve performance.',
    },
    {
      name: 'Learning',
      text: 'I learned that TypeScript generics can significantly improve type safety.',
    },
  ];

  service.setMode('text');

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log(`Input: "${testCase.text}"`);

    try {
      const result = await service.submitText(testCase.text, {
        includeRaw: false, // Set to true to see raw AI response
      });

      if (result.segments.length > 0) {
        const segment = result.segments[0];
        console.log(`✓ Detected as: ${segment.type}`);
        if (segment.confidence) {
          console.log(`  Confidence: ${(segment.confidence * 100).toFixed(1)}%`);
        }
      } else {
        console.log('✗ No segments detected');
      }
    } catch (error) {
      console.error('✗ Error:', error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Example 5: Multi-line thought entry
 */
async function example5_multiLineInput() {
  console.log('\n=== Example 5: Multi-line Thought Entry ===\n');

  const service = new TextInputService();
  service.setMode('text');

  // Simulate user entering multiple thoughts at once
  const multiLineThoughts = `
Today was productive. I finished three major tasks:

1. Completed the API integration with the payment gateway
2. Fixed the authentication bug that was affecting mobile users
3. Reviewed and merged two pull requests from the team

Tomorrow's priorities:
- Write documentation for the new API endpoints
- Schedule a meeting with the product team
- Start working on the performance optimization task

I had an interesting idea: what if we implemented real-time collaboration
features? It could really differentiate us from competitors.

I also learned that using React.memo() can prevent unnecessary re-renders
and significantly improve performance in large component trees.
  `;

  try {
    const result = await service.submitText(multiLineThoughts);

    console.log(`Analyzed multi-line input (${multiLineThoughts.length} characters)`);
    console.log(`\nExtracted ${result.segments.length} segments:\n`);

    // Group by type
    const byType: Record<string, number> = {};
    result.segments.forEach(segment => {
      byType[segment.type] = (byType[segment.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    console.log('\nDetailed segments:');
    result.segments.forEach((segment, index) => {
      console.log(`\n${index + 1}. [${segment.type.toUpperCase()}] ${segment.text}`);
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 6: Using singleton instance
 */
async function example6_singletonUsage() {
  console.log('\n=== Example 6: Singleton Instance ===\n');

  // Import the singleton instance
  const { textInputService } = await import('./text-input');

  console.log('Using singleton instance...');
  console.log('Current mode:', textInputService.getMode());

  textInputService.setMode('text');

  const text = 'Quick test using the singleton instance.';
  const validation = textInputService.validateText(text);

  console.log('Validation result:', validation);

  if (validation.valid) {
    try {
      const result = await textInputService.submitText(text);
      console.log(`Success! Extracted ${result.segments.length} segments.`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Example 7: Custom AnalysisService instance
 */
async function example7_customAnalysisService() {
  console.log('\n=== Example 7: Custom AnalysisService ===\n');

  // Create custom Gemini service with specific configuration
  const customGemini = new GeminiService();

  // Set API key (in production, get from environment or keychain)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    await customGemini.setApiKey(apiKey);
  }

  // Create custom AnalysisService
  const customAnalysis = new AnalysisService(customGemini);

  // Create TextInputService with custom AnalysisService
  const service = new TextInputService(customAnalysis);

  service.setMode('text');

  console.log('Using custom AnalysisService instance');
  console.log('This allows for custom configuration and testing');
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('='.repeat(60));
  console.log('TextInputService Examples');
  console.log('AI-22: Text Input Mode for Testing');
  console.log('='.repeat(60));

  // Run examples that don't require API calls
  example2_toggleModes();
  example3_validation();

  // Examples that require API calls (only if API key is set)
  if (process.env.GEMINI_API_KEY) {
    console.log('\n✓ Gemini API key found, running integration examples...\n');

    try {
      await example1_basicUsage();
      await example4_testingWorkflow();
      await example5_multiLineInput();
      await example6_singletonUsage();
      await example7_customAnalysisService();
    } catch (error) {
      console.error('\nError running integration examples:');
      console.error(error instanceof Error ? error.message : error);
    }
  } else {
    console.log('\n⚠ No Gemini API key found (set GEMINI_API_KEY environment variable)');
    console.log('  Skipping examples that require API calls');
    console.log('\n  To run full examples:');
    console.log('  export GEMINI_API_KEY="your-api-key"');
    console.log('  npx tsx src/services/text-input.example.ts');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Examples complete!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  example1_basicUsage,
  example2_toggleModes,
  example3_validation,
  example4_testingWorkflow,
  example5_multiLineInput,
  example6_singletonUsage,
  example7_customAnalysisService,
};
