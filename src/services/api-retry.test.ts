/**
 * Tests for API Retry and Error Handling Module
 * Run with: npm test or ts-node api-retry.test.ts
 */

import {
  withRetry,
  withTimeout,
  classifyHttpError,
  getErrorRecovery,
  NetworkError,
  RateLimitError,
  AuthError,
  ParseError,
  ServerError,
  type RetryOptions,
} from './api-retry';

// Test utilities
let testOutput: string[] = [];

function log(message: string) {
  testOutput.push(message);
  console.log(message);
}

function resetTestOutput() {
  testOutput = [];
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  log(`✓ ${message}`);
}

// Test 1: Successful call without retry
async function test1_SuccessfulCall() {
  log('\n=== Test 1: Successful call without retry ===');
  resetTestOutput();

  let callCount = 0;

  const result = await withRetry(async () => {
    callCount++;
    return { success: true, data: 'test' };
  });

  assert(callCount === 1, 'Function called exactly once');
  assert(result.success === true, 'Returns correct result');
}

// Test 2: Retry on NetworkError
async function test2_NetworkErrorRetry() {
  log('\n=== Test 2: Retry on NetworkError ===');
  resetTestOutput();

  let callCount = 0;

  try {
    await withRetry(
      async () => {
        callCount++;
        if (callCount < 3) {
          throw new NetworkError('Connection failed');
        }
        return { success: true };
      },
      { maxRetries: 3, initialDelay: 10 }
    );

    assert(callCount === 3, 'Retried until success on attempt 3');
  } catch (error) {
    throw new Error('Should have succeeded on third attempt');
  }
}

// Test 3: No retry on AuthError
async function test3_AuthErrorNoRetry() {
  log('\n=== Test 3: No retry on AuthError ===');
  resetTestOutput();

  let callCount = 0;

  try {
    await withRetry(
      async () => {
        callCount++;
        throw new AuthError('Invalid API key', 401);
      },
      { maxRetries: 3, initialDelay: 10 }
    );

    throw new Error('Should have thrown AuthError');
  } catch (error) {
    assert(error instanceof AuthError, 'Throws AuthError');
    assert(callCount === 1, 'Function called only once (no retry)');
  }
}

// Test 4: Exponential backoff timing
async function test4_ExponentialBackoff() {
  log('\n=== Test 4: Exponential backoff timing ===');
  resetTestOutput();

  const delays: number[] = [];
  let lastTime = Date.now();

  try {
    await withRetry(
      async () => {
        throw new NetworkError('Connection failed');
      },
      {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        onRetry: (error, attempt, delay) => {
          const now = Date.now();
          delays.push(now - lastTime);
          lastTime = now;
        },
      }
    );
  } catch (error) {
    // Expected to fail
  }

  assert(delays.length === 3, 'Three retry delays recorded');
  // Allow some tolerance for timing (±50ms)
  assert(Math.abs(delays[0] - 100) < 50, 'First delay ~100ms');
  assert(Math.abs(delays[1] - 200) < 50, 'Second delay ~200ms');
  assert(Math.abs(delays[2] - 400) < 50, 'Third delay ~400ms');
}

// Test 5: classifyHttpError
async function test5_ClassifyHttpError() {
  log('\n=== Test 5: HTTP Error Classification ===');
  resetTestOutput();

  const authError = classifyHttpError(401, 'Unauthorized');
  assert(authError instanceof AuthError, 'Status 401 -> AuthError');

  const rateLimitError = classifyHttpError(429, 'Too many requests');
  assert(rateLimitError instanceof RateLimitError, 'Status 429 -> RateLimitError');

  const serverError = classifyHttpError(500, 'Internal server error');
  assert(serverError instanceof ServerError, 'Status 500 -> ServerError');

  const parseError = classifyHttpError(400, 'Bad request');
  assert(parseError instanceof ParseError, 'Status 400 -> ParseError');
}

// Test 6: withTimeout
async function test6_WithTimeout() {
  log('\n=== Test 6: Timeout handling ===');
  resetTestOutput();

  // Test timeout triggers
  try {
    await withTimeout(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      100,
      'Operation timed out'
    );
    throw new Error('Should have timed out');
  } catch (error) {
    assert(error instanceof NetworkError, 'Timeout throws NetworkError');
    assert(error.message.includes('timed out'), 'Error message mentions timeout');
  }

  // Test successful completion before timeout
  const result = await withTimeout(
    Promise.resolve('success'),
    1000,
    'Should not timeout'
  );
  assert(result === 'success', 'Completes successfully before timeout');
}

// Test 7: getErrorRecovery
async function test7_ErrorRecovery() {
  log('\n=== Test 7: Error recovery messages ===');
  resetTestOutput();

  const networkRecovery = getErrorRecovery(new NetworkError('Connection failed'));
  assert(
    networkRecovery.message.includes('Network'),
    'Network error has network message'
  );

  const authRecovery = getErrorRecovery(new AuthError('Invalid key', 401));
  assert(authRecovery.message.includes('Authentication'), 'Auth error has auth message');
  assert(authRecovery.action.includes('API key'), 'Auth action mentions API key');

  const rateLimitRecovery = getErrorRecovery(new RateLimitError('Too many requests', 60));
  assert(
    rateLimitRecovery.action.includes('60 seconds'),
    'Rate limit action includes retry time'
  );
}

// Test 8: Custom shouldRetry function
async function test8_CustomShouldRetry() {
  log('\n=== Test 8: Custom shouldRetry function ===');
  resetTestOutput();

  let callCount = 0;

  const options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 10,
    shouldRetry: (error, attempt) => {
      // Only retry once for server errors
      return error instanceof ServerError && attempt === 0;
    },
  };

  try {
    await withRetry(async () => {
      callCount++;
      throw new ServerError('Server error', 500);
    }, options);
  } catch (error) {
    assert(error instanceof ServerError, 'Throws ServerError');
    assert(callCount === 2, 'Called twice (initial + 1 retry)');
  }
}

// Test 9: RateLimitError with retryAfter
async function test9_RateLimitRetryAfter() {
  log('\n=== Test 9: RateLimitError with retryAfter ===');
  resetTestOutput();

  let callCount = 0;
  let retryDelay = 0;

  try {
    await withRetry(
      async () => {
        callCount++;
        if (callCount < 2) {
          throw new RateLimitError('Rate limited', 2); // retry after 2 seconds
        }
        return { success: true };
      },
      {
        maxRetries: 3,
        initialDelay: 100,
        onRetry: (error, attempt, delay) => {
          retryDelay = delay;
        },
      }
    );

    assert(callCount === 2, 'Successfully retried once');
    assert(retryDelay === 2000, 'Used retryAfter value (2000ms)');
  } catch (error) {
    throw new Error('Should have succeeded on second attempt');
  }
}

// Test 10: Max retries exhausted
async function test10_MaxRetriesExhausted() {
  log('\n=== Test 10: Max retries exhausted ===');
  resetTestOutput();

  let callCount = 0;

  try {
    await withRetry(
      async () => {
        callCount++;
        throw new NetworkError('Always fails');
      },
      { maxRetries: 3, initialDelay: 10 }
    );

    throw new Error('Should have thrown after max retries');
  } catch (error) {
    assert(error instanceof NetworkError, 'Throws final error');
    assert(callCount === 4, 'Called 4 times (initial + 3 retries)');
  }
}

// Test 11: No retry on ParseError
async function test11_ParseErrorNoRetry() {
  log('\n=== Test 11: No retry on ParseError ===');
  resetTestOutput();

  let callCount = 0;

  try {
    await withRetry(
      async () => {
        callCount++;
        throw new ParseError('Invalid JSON', '{ broken json }');
      },
      { maxRetries: 3, initialDelay: 10 }
    );

    throw new Error('Should have thrown ParseError');
  } catch (error) {
    assert(error instanceof ParseError, 'Throws ParseError');
    assert(callCount === 1, 'Function called only once (no retry)');
    assert(
      (error as ParseError).response === '{ broken json }',
      'Response is preserved'
    );
  }
}

// Test 12: onRetry callback
async function test12_OnRetryCallback() {
  log('\n=== Test 12: onRetry callback ===');
  resetTestOutput();

  const retryLog: Array<{ attempt: number; delay: number }> = [];

  try {
    await withRetry(
      async () => {
        throw new NetworkError('Connection failed');
      },
      {
        maxRetries: 2,
        initialDelay: 50,
        onRetry: (error, attempt, delay) => {
          retryLog.push({ attempt, delay });
        },
      }
    );
  } catch (error) {
    // Expected to fail
  }

  assert(retryLog.length === 2, 'onRetry called twice');
  assert(retryLog[0].attempt === 1, 'First retry is attempt 1');
  assert(retryLog[1].attempt === 2, 'Second retry is attempt 2');
  assert(retryLog[0].delay === 50, 'First delay is 50ms');
  assert(retryLog[1].delay === 100, 'Second delay is 100ms');
}

// Run all tests
async function runAllTests() {
  console.log('Starting API Retry Tests...\n');

  const tests = [
    test1_SuccessfulCall,
    test2_NetworkErrorRetry,
    test3_AuthErrorNoRetry,
    test4_ExponentialBackoff,
    test5_ClassifyHttpError,
    test6_WithTimeout,
    test7_ErrorRecovery,
    test8_CustomShouldRetry,
    test9_RateLimitRetryAfter,
    test10_MaxRetriesExhausted,
    test11_ParseErrorNoRetry,
    test12_OnRetryCallback,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n✗ ${test.name} FAILED:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
