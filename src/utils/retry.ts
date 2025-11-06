/**
 * Retry utilities with exponential backoff
 */

import { sleep } from './time.js';
import { logger } from './logger.js';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs = 30000, shouldRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      logger.debug(`Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms: ${lastError.message}`);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable (timeout, network, or connection errors)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('socket') ||
    message.includes('cdp') ||
    message.includes('transport closed')
  );
}

