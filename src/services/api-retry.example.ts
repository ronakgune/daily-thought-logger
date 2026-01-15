/**
 * Example usage of the API retry and error handling utilities
 * This file demonstrates various scenarios and best practices
 */

import {
  withRetry,
  withTimeout,
  classifyHttpError,
  getErrorRecovery,
  logError,
  NetworkError,
  RateLimitError,
  AuthError,
  ParseError,
  ServerError,
  type RetryOptions,
} from './api-retry';

/**
 * Example 1: Basic retry with default options
 */
async function example1_BasicRetry() {
  try {
    const result = await withRetry(async () => {
      // Simulated API call
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw classifyHttpError(response.status, `HTTP ${response.status}`);
      }
      return response.json();
    });

    console.log('Success:', result);
  } catch (error) {
    const recovery = getErrorRecovery(error as Error);
    console.error(recovery.message);
    console.error(recovery.action);
    logError(error as Error, { operation: 'fetchData' });
  }
}

/**
 * Example 2: Custom retry options with callback
 */
async function example2_CustomRetryOptions() {
  const options: RetryOptions = {
    maxRetries: 5,
    initialDelay: 2000,
    backoffMultiplier: 2,
    onRetry: (error, attempt, delay) => {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      console.log(`Waiting ${delay}ms before retry...`);
      // You could show a toast notification here
    },
  };

  try {
    const result = await withRetry(async () => {
      // Your API call here
      return await performApiCall();
    }, options);

    return result;
  } catch (error) {
    handleFinalError(error as Error);
  }
}

/**
 * Example 3: Network timeout handling
 */
async function example3_NetworkTimeout() {
  try {
    const result = await withRetry(async () => {
      // Wrap the API call with a timeout
      return await withTimeout(
        fetch('https://api.example.com/slow-endpoint').then((r) => r.json()),
        5000, // 5 second timeout
        'API request timed out. The server may be slow or unreachable.'
      );
    });

    return result;
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network issue:', error.message);
      // Show user-friendly message
      const recovery = getErrorRecovery(error);
      showUserNotification(recovery.message, recovery.action);
    }
    throw error;
  }
}

/**
 * Example 4: Handling different error types
 */
async function example4_ErrorTypeHandling() {
  try {
    const result = await withRetry(async () => {
      const response = await fetch('https://api.example.com/gemini', {
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      });

      // Classify the error based on status code
      if (!response.ok) {
        const errorBody = await response.text();
        throw classifyHttpError(
          response.status,
          `API Error: ${response.statusText}`,
          errorBody
        );
      }

      // Try to parse JSON
      try {
        return await response.json();
      } catch (parseError) {
        throw new ParseError(
          'Failed to parse API response as JSON',
          await response.text()
        );
      }
    });

    return result;
  } catch (error) {
    if (error instanceof AuthError) {
      // Don't retry auth errors - notify user immediately
      console.error('Authentication failed. Check your API key.');
      logError(error, { apiKey: 'REDACTED' });
    } else if (error instanceof RateLimitError) {
      // Show user how long to wait
      const waitTime = error.retryAfter || 60;
      console.error(`Rate limited. Wait ${waitTime} seconds.`);
    } else if (error instanceof ParseError) {
      // Log the response for debugging
      console.error('Parse error. Response:', error.response);
      logError(error, { responseLength: error.response?.length });
    } else if (error instanceof ServerError) {
      // Server error - already retried, inform user
      console.error('Server error. Service may be down.');
      logError(error, { statusCode: error.statusCode });
    } else if (error instanceof NetworkError) {
      // Network issue
      console.error('Network error:', error.message);
      logError(error, { originalError: error.originalError?.message });
    }

    throw error;
  }
}

/**
 * Example 5: Custom retry logic for specific scenarios
 */
async function example5_CustomRetryLogic() {
  const options: RetryOptions = {
    maxRetries: 3,
    shouldRetry: (error, attempt) => {
      // Custom logic: Only retry network errors and server errors
      // Don't retry after 2 attempts for server errors
      if (error instanceof ServerError && attempt >= 2) {
        return false;
      }

      if (error instanceof NetworkError || error instanceof ServerError) {
        return true;
      }

      return false;
    },
  };

  return await withRetry(async () => {
    return await performApiCall();
  }, options);
}

/**
 * Example 6: Gemini API specific implementation
 */
async function example6_GeminiAPICall(prompt: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new AuthError('GEMINI_API_KEY environment variable is not set');
  }

  const options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    onRetry: (error, attempt, delay) => {
      logError(error, {
        operation: 'gemini-api-call',
        attempt,
        delay,
        promptLength: prompt.length,
      });
    },
  };

  try {
    const result = await withRetry(async () => {
      // Add timeout to the API call
      return await withTimeout(
        (async () => {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: prompt }],
                  },
                ],
              }),
            }
          );

          if (!response.ok) {
            const errorBody = await response.text();
            throw classifyHttpError(
              response.status,
              `Gemini API Error: ${response.statusText}`,
              errorBody
            );
          }

          let data;
          try {
            data = await response.json();
          } catch {
            throw new ParseError(
              'Failed to parse Gemini API response',
              await response.text()
            );
          }

          // Validate response structure
          if (!data.candidates || !data.candidates[0]?.content) {
            throw new ParseError(
              'Unexpected response structure from Gemini API',
              JSON.stringify(data)
            );
          }

          return data;
        })(),
        30000, // 30 second timeout
        'Gemini API request timed out'
      );
    }, options);

    return result;
  } catch (error) {
    // Handle the error and provide user feedback
    const recovery = getErrorRecovery(error as Error);
    console.error(`[Gemini API] ${recovery.message}`);
    console.error(`[Gemini API] ${recovery.action}`);

    logError(error as Error, {
      operation: 'gemini-api-call',
      promptLength: prompt.length,
    });

    throw error;
  }
}

/**
 * Example 7: Batch operations with individual retry
 */
async function example7_BatchOperations(items: string[]) {
  const results = await Promise.allSettled(
    items.map((item) =>
      withRetry(async () => {
        return await processItem(item);
      })
    )
  );

  const successful = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  console.log(`Processed: ${successful.length} successful, ${failed.length} failed`);

  // Log failed items
  failed.forEach((result, index) => {
    if (result.status === 'rejected') {
      logError(result.reason, { item: items[index] });
    }
  });

  return {
    successful: successful.map((r) => (r as PromiseFulfilledResult<any>).value),
    failed: failed.map((r, i) => ({ item: items[i], error: (r as PromiseRejectedResult).reason })),
  };
}

// Helper functions for examples

async function performApiCall(): Promise<any> {
  // Simulated API call
  return { data: 'example' };
}

async function processItem(item: string): Promise<any> {
  // Simulated item processing
  return { item, processed: true };
}

function handleFinalError(error: Error): void {
  const recovery = getErrorRecovery(error);
  console.error(recovery.message);
  console.error(recovery.action);
  logError(error);
}

function showUserNotification(message: string, action: string): void {
  // This would show a UI notification in a real application
  console.log(`[Notification] ${message} - ${action}`);
}

// Export examples for testing
export {
  example1_BasicRetry,
  example2_CustomRetryOptions,
  example3_NetworkTimeout,
  example4_ErrorTypeHandling,
  example5_CustomRetryLogic,
  example6_GeminiAPICall,
  example7_BatchOperations,
};
