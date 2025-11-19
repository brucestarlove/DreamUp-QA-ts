/**
 * Type Guards for Runtime Type Checking
 * Replaces 'as any' casts with safe type checking
 */

import type { Page } from 'playwright';

/**
 * Check if object is a Playwright Page
 */
export function isPlaywrightPage(page: unknown): page is Page {
  return (
    typeof page === 'object' &&
    page !== null &&
    'screenshot' in page &&
    'goto' in page &&
    'evaluate' in page
  );
}

/**
 * Check if page has event listener support
 */
export function hasEventListeners(
  page: unknown
): page is Page & {
  on: (event: string, handler: (...args: any[]) => void) => void;
} {
  return (
    isPlaywrightPage(page) &&
    'on' in page &&
    typeof (page as any).on === 'function'
  );
}

/**
 * Check if object has screenshot capability
 */
export function hasScreenshotCapability(
  page: unknown
): page is { screenshot: (options?: any) => Promise<Buffer> } {
  return (
    typeof page === 'object' &&
    page !== null &&
    'screenshot' in page &&
    typeof (page as any).screenshot === 'function'
  );
}

/**
 * Check if value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if error is retryable based on message
 */
export function isRetryableErrorType(error: unknown): boolean {
  if (!isError(error)) {
    return false;
  }

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

/**
 * Assert that page is available (throws if not)
 */
export function assertPageAvailable(
  page: unknown
): asserts page is Page {
  if (!isPlaywrightPage(page)) {
    throw new Error('Page is not available or invalid');
  }
}

/**
 * Safely get error message
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Safely get error stack
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}
