/**
 * API Retry and Error Handling Module
 * Provides robust error handling and retry logic for API failures
 * @module api-retry
 */

/**
 * Custom error types for different API failure scenarios
 */

export class NetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class AuthError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly response?: string
  ) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

export class ServerError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: string
  ) {
    super(message);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Retry options configuration
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if an error should be retried (default: shouldRetry) */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback function called before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: defaultShouldRetry,
  onRetry: defaultOnRetry,
};

/**
 * Determines if an error should trigger a retry
 * @param error - The error that occurred
 * @param attempt - Current attempt number
 * @returns True if the operation should be retried
 */
function defaultShouldRetry(error: Error, attempt: number): boolean {
  // Don't retry authentication errors
  if (error instanceof AuthError) {
    return false;
  }

  // Don't retry parse errors (malformed response)
  if (error instanceof ParseError) {
    return false;
  }

  // Retry network errors
  if (error instanceof NetworkError) {
    return true;
  }

  // Retry rate limit errors
  if (error instanceof RateLimitError) {
    return true;
  }

  // Retry server errors (5xx)
  if (error instanceof ServerError) {
    return true;
  }

  // For unknown errors, retry cautiously
  return false;
}

/**
 * Default callback for retry attempts
 * @param error - The error that triggered the retry
 * @param attempt - Current attempt number
 * @param delay - Delay before next retry in milliseconds
 */
function defaultOnRetry(error: Error, attempt: number, delay: number): void {
  console.warn(
    `[Retry] Attempt ${attempt} failed with ${error.name}: ${error.message}. Retrying in ${delay}ms...`
  );
}

/**
 * Calculates the delay for the next retry using exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleeps for a specified duration
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic
 * @param fn - The async function to execute with retry logic
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the final error
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) {
 *       throw new ServerError('API request failed', response.status);
 *     }
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
    shouldRetry: options?.shouldRetry || DEFAULT_RETRY_OPTIONS.shouldRetry,
    onRetry: options?.onRetry || DEFAULT_RETRY_OPTIONS.onRetry,
  };

  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        console.error(
          `[Retry] All ${opts.maxRetries} retry attempts exhausted. Final error:`,
          lastError
        );
        throw lastError;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError, attempt)) {
        console.error(
          `[Retry] Error not retryable: ${lastError.name} - ${lastError.message}`
        );
        throw lastError;
      }

      // Calculate delay for rate limit errors
      let delay: number;
      if (lastError instanceof RateLimitError && lastError.retryAfter) {
        delay = lastError.retryAfter * 1000; // Convert seconds to milliseconds
      } else {
        delay = calculateDelay(attempt, opts);
      }

      // Call the retry callback
      opts.onRetry(lastError, attempt + 1, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Helper function to classify HTTP errors into appropriate error types
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param response - Optional response body
 * @returns Appropriate error instance
 */
export function classifyHttpError(
  statusCode: number,
  message: string,
  response?: string
): Error {
  // Authentication errors (401, 403)
  if (statusCode === 401 || statusCode === 403) {
    return new AuthError(
      message || 'Authentication failed. Please check your API key.',
      statusCode
    );
  }

  // Rate limiting (429)
  if (statusCode === 429) {
    // Try to extract retry-after header value if available in message
    const retryAfterMatch = message.match(/retry after (\d+)/i);
    const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : undefined;

    return new RateLimitError(
      message || 'Rate limit exceeded. Please try again later.',
      retryAfter
    );
  }

  // Server errors (5xx)
  if (statusCode >= 500) {
    return new ServerError(
      message || 'Server error occurred. The service may be temporarily unavailable.',
      statusCode,
      response
    );
  }

  // Client errors (4xx, excluding auth and rate limit)
  if (statusCode >= 400) {
    return new ParseError(
      message || 'Bad request. The request may be malformed.',
      response
    );
  }

  // Unknown error
  return new Error(message || 'Unknown error occurred');
}

/**
 * Helper function to handle network timeouts
 * @param promise - Promise to wrap with timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Custom error message
 * @returns Promise that rejects with NetworkError on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new NetworkError(
          errorMessage || `Request timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

/**
 * Recovery strategies for different error types
 */
export const RecoveryStrategies = {
  /**
   * Recovery strategy for NetworkError
   * @returns User-friendly message and suggested action
   */
  network: (): { message: string; action: string } => ({
    message: 'Network connection issue detected.',
    action: 'Please check your internet connection and try again.',
  }),

  /**
   * Recovery strategy for RateLimitError
   * @param retryAfter - Optional seconds to wait before retry
   * @returns User-friendly message and suggested action
   */
  rateLimit: (retryAfter?: number): { message: string; action: string } => ({
    message: 'API rate limit exceeded.',
    action: retryAfter
      ? `Please wait ${retryAfter} seconds before trying again.`
      : 'Please wait a moment and try again.',
  }),

  /**
   * Recovery strategy for AuthError
   * @returns User-friendly message and suggested action
   */
  auth: (): { message: string; action: string } => ({
    message: 'Authentication failed.',
    action: 'Please verify your API key is correct and has the necessary permissions.',
  }),

  /**
   * Recovery strategy for ParseError
   * @returns User-friendly message and suggested action
   */
  parse: (): { message: string; action: string } => ({
    message: 'Failed to process the API response.',
    action: 'The response format may have changed. Please contact support if this persists.',
  }),

  /**
   * Recovery strategy for ServerError
   * @returns User-friendly message and suggested action
   */
  server: (): { message: string; action: string } => ({
    message: 'The API service is experiencing issues.',
    action: 'Please try again in a few minutes. If the problem persists, check the service status.',
  }),
};

/**
 * Gets a user-friendly error message and recovery action for any error
 * @param error - The error to get recovery information for
 * @returns Object containing user-friendly message and suggested action
 */
export function getErrorRecovery(error: Error): { message: string; action: string } {
  if (error instanceof NetworkError) {
    return RecoveryStrategies.network();
  }

  if (error instanceof RateLimitError) {
    return RecoveryStrategies.rateLimit(error.retryAfter);
  }

  if (error instanceof AuthError) {
    return RecoveryStrategies.auth();
  }

  if (error instanceof ParseError) {
    return RecoveryStrategies.parse();
  }

  if (error instanceof ServerError) {
    return RecoveryStrategies.server();
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred.',
    action: 'Please try again. If the problem persists, contact support.',
  };
}

/**
 * Logs error details for debugging
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  };

  // Log specific error properties
  if (error instanceof NetworkError && error.originalError) {
    errorDetails['originalError'] = error.originalError.message;
  }

  if (error instanceof RateLimitError && error.retryAfter) {
    errorDetails['retryAfter'] = error.retryAfter;
  }

  if (error instanceof AuthError && error.statusCode) {
    errorDetails['statusCode'] = error.statusCode;
  }

  if (error instanceof ParseError && error.response) {
    errorDetails['response'] = error.response.substring(0, 200); // Limit response length
  }

  if (error instanceof ServerError) {
    if (error.statusCode) errorDetails['statusCode'] = error.statusCode;
    if (error.response) errorDetails['response'] = error.response.substring(0, 200);
  }

  console.error('[API Error]', JSON.stringify(errorDetails, null, 2));
}
