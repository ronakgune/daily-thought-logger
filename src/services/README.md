# API Retry and Error Handling Service

Comprehensive error handling and retry logic for API failures, specifically designed for the Gemini API integration.

## Overview

This module provides robust error handling capabilities with automatic retry logic using exponential backoff. It handles various failure scenarios including network timeouts, rate limiting, authentication errors, malformed responses, and server errors.

## Features

- **5 Custom Error Types**: Specialized error classes for different failure scenarios
- **Exponential Backoff**: Configurable retry strategy with exponential delay
- **Smart Retry Logic**: Different handling for each error type
- **Timeout Support**: Network timeout protection
- **User-Friendly Messages**: Recovery strategies with actionable guidance
- **Detailed Logging**: Comprehensive error logging for debugging

## Error Types

### NetworkError
Represents network connectivity issues or timeouts.

```typescript
throw new NetworkError('Connection timeout', originalError);
```

**Retry**: Yes
**Use Case**: Network failures, timeouts, DNS errors

### RateLimitError
Represents API rate limiting (HTTP 429).

```typescript
throw new RateLimitError('Rate limit exceeded', 60); // retry after 60 seconds
```

**Retry**: Yes
**Use Case**: Too many requests, quota exceeded

### AuthError
Represents authentication and authorization failures (HTTP 401, 403).

```typescript
throw new AuthError('Invalid API key', 401);
```

**Retry**: No
**Use Case**: Invalid credentials, missing permissions

### ParseError
Represents malformed or unexpected API responses.

```typescript
throw new ParseError('Invalid JSON', responseBody);
```

**Retry**: No
**Use Case**: Unexpected response format, JSON parse errors

### ServerError
Represents server-side errors (HTTP 5xx).

```typescript
throw new ServerError('Service unavailable', 503, responseBody);
```

**Retry**: Yes
**Use Case**: Internal server errors, service downtime

## Core Functions

### `withRetry<T>(fn, options?): Promise<T>`

Wraps an async function with automatic retry logic.

**Parameters:**
- `fn`: Async function to execute
- `options`: Optional retry configuration

**Default Options:**
- `maxRetries`: 3
- `initialDelay`: 1000ms (1 second)
- `backoffMultiplier`: 2 (exponential: 1s, 2s, 4s)
- `maxDelay`: 10000ms (10 seconds)

**Example:**

```typescript
const result = await withRetry(
  async () => {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw classifyHttpError(response.status, 'API Error');
    }
    return response.json();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
    }
  }
);
```

### `withTimeout<T>(promise, timeoutMs, errorMessage?): Promise<T>`

Adds timeout protection to any promise.

**Example:**

```typescript
const result = await withTimeout(
  fetch('https://api.example.com/slow'),
  5000,
  'Request timed out after 5 seconds'
);
```

### `classifyHttpError(statusCode, message, response?): Error`

Classifies HTTP status codes into appropriate error types.

**Example:**

```typescript
if (!response.ok) {
  throw classifyHttpError(response.status, response.statusText);
}
```

### `getErrorRecovery(error): { message, action }`

Provides user-friendly error messages and recovery actions.

**Example:**

```typescript
try {
  await apiCall();
} catch (error) {
  const recovery = getErrorRecovery(error);
  console.error(recovery.message);  // "Network connection issue detected."
  console.error(recovery.action);   // "Please check your internet connection..."
}
```

### `logError(error, context?): void`

Logs detailed error information for debugging.

**Example:**

```typescript
logError(error, {
  operation: 'gemini-api-call',
  userId: 'user123',
  timestamp: Date.now()
});
```

## Retry Strategy

The retry strategy uses exponential backoff with the following defaults:

| Attempt | Delay |
|---------|-------|
| 1       | 1s    |
| 2       | 2s    |
| 3       | 4s    |

**Special Cases:**
- **Rate Limit Errors**: Uses `retryAfter` header value if available
- **Auth Errors**: Never retried (immediate failure)
- **Parse Errors**: Never retried (indicates malformed response)
- **Network Errors**: Always retried
- **Server Errors**: Always retried

## Usage Scenarios

### Scenario 1: Basic Gemini API Call

```typescript
import { withRetry, withTimeout, classifyHttpError, logError } from './api-retry';

async function callGeminiAPI(prompt: string) {
  try {
    const result = await withRetry(async () => {
      return await withTimeout(
        (async () => {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          );

          if (!response.ok) {
            throw classifyHttpError(response.status, 'Gemini API Error');
          }

          return response.json();
        })(),
        30000 // 30 second timeout
      );
    });

    return result;
  } catch (error) {
    logError(error, { operation: 'gemini-api', promptLength: prompt.length });
    throw error;
  }
}
```

### Scenario 2: Custom Retry Logic

```typescript
const options: RetryOptions = {
  maxRetries: 5,
  initialDelay: 2000,
  shouldRetry: (error, attempt) => {
    // Only retry specific errors
    if (error instanceof ServerError && attempt < 3) {
      return true;
    }
    if (error instanceof NetworkError) {
      return true;
    }
    return false;
  },
  onRetry: (error, attempt, delay) => {
    showToast(`Retry attempt ${attempt}. Waiting ${delay}ms...`);
  }
};

await withRetry(apiCall, options);
```

### Scenario 3: Batch Processing with Retry

```typescript
async function processBatch(items: string[]) {
  const results = await Promise.allSettled(
    items.map(item =>
      withRetry(async () => {
        return await processItem(item);
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  // Log failures
  failed.forEach((result, index) => {
    if (result.status === 'rejected') {
      logError(result.reason, { item: items[index] });
    }
  });

  return { successful, failed };
}
```

### Scenario 4: Error Recovery UI

```typescript
try {
  await apiCall();
} catch (error) {
  const recovery = getErrorRecovery(error);

  showErrorDialog({
    title: 'Operation Failed',
    message: recovery.message,
    action: recovery.action,
    retryButton: shouldShowRetry(error)
  });

  logError(error, { userId: currentUser.id });
}

function shouldShowRetry(error: Error): boolean {
  // Don't show retry for auth errors
  return !(error instanceof AuthError || error instanceof ParseError);
}
```

## Error Handling Best Practices

1. **Always Use `withRetry` for API Calls**: Wrap external API calls to handle transient failures
2. **Set Appropriate Timeouts**: Use `withTimeout` to prevent hanging requests
3. **Classify Errors Properly**: Use `classifyHttpError` for HTTP status codes
4. **Log All Errors**: Use `logError` with context for debugging
5. **Provide User Feedback**: Use `getErrorRecovery` for user-friendly messages
6. **Don't Retry Everything**: Auth and parse errors should fail immediately
7. **Respect Rate Limits**: Honor `retryAfter` values from rate limit errors
8. **Add Context**: Include operation details in error logs

## Configuration Examples

### Conservative (fewer retries, longer delays)
```typescript
{
  maxRetries: 2,
  initialDelay: 2000,
  backoffMultiplier: 3
}
// Delays: 2s, 6s
```

### Aggressive (more retries, shorter delays)
```typescript
{
  maxRetries: 5,
  initialDelay: 500,
  backoffMultiplier: 1.5
}
// Delays: 0.5s, 0.75s, 1.125s, 1.687s, 2.53s
```

### Production Recommended
```typescript
{
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000
}
// Delays: 1s, 2s, 4s (capped at 10s)
```

## Testing

See `api-retry.example.ts` for comprehensive usage examples and test scenarios.

## Acceptance Criteria Checklist

- [x] All API errors caught and handled
- [x] Retry logic with exponential backoff (1s, 2s, 4s)
- [x] Max 3 retries (configurable)
- [x] Different handling per error type
- [x] Don't retry on auth errors (401/403)
- [x] User-friendly error messages via `getErrorRecovery()`
- [x] Errors logged for debugging via `logError()`
- [x] Recovery path for each error type defined
- [x] Network timeout handling
- [x] Rate limiting (429) handling
- [x] Invalid API key handling
- [x] Malformed response handling
- [x] Server errors (5xx) handling

## Integration

Import and use in your services:

```typescript
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
  ServerError
} from './services/api-retry';
```

## License

Part of the main project.
