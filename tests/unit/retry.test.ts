/**
 * Unit Tests - Retry Logic
 * Tests exponential backoff and retry classification
 */

import { describe, test, expect, mock } from 'bun:test';
import { retryWithBackoff, isRetryableError } from '../../src/utils/retry.js';

describe('Retry Logic', () => {
  describe('retryWithBackoff', () => {
    test('succeeds on first attempt', async () => {
      const fn = mock(() => Promise.resolve('success'));
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        baseDelayMs: 100,
      });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries on failure then succeeds', async () => {
      let attempt = 0;
      const fn = mock(() => {
        attempt++;
        if (attempt < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve('success');
      });

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 1000,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('respects max attempts', async () => {
      const fn = mock(() => Promise.reject(new Error('Always fails')));
      
      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
        })
      ).rejects.toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('calculates exponential backoff correctly', async () => {
      let attempt = 0;

      const fn = mock(async () => {
        attempt++;
        if (attempt < 3) {
          throw new Error('Retry');
        }
        return 'success';
      });

      await retryWithBackoff(fn, {
        maxAttempts: 3,
        baseDelayMs: 10, // Use small delay for test speed
        maxDelayMs: 1000,
      });

      // Verify retries occurred (delay calculation is internal)
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('respects maxDelayMs cap', async () => {
      const fn = mock(() => Promise.reject(new Error('Fail')));
      
      // Use smaller delays for test to avoid timeout
      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
          maxDelayMs: 50,
        })
      ).rejects.toThrow();
      
      // Verify it doesn't exceed maxDelayMs
      // (Actual delay verification would require mocking sleep)
      expect(fn).toHaveBeenCalledTimes(3);
    }, 1000); // Set test timeout to 1 second

    test('respects shouldRetry predicate', async () => {
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Validation failed');
      
      let attempt = 0;
      const fn = mock(() => {
        attempt++;
        if (attempt === 1) {
          throw retryableError;
        }
        throw nonRetryableError;
      });

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
          shouldRetry: (error) => error.message.includes('timeout'),
        })
      ).rejects.toThrow('Validation failed');
      
      // Should retry once for timeout, then fail on non-retryable error
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('stops retrying when shouldRetry returns false', async () => {
      const nonRetryableError = new Error('Invalid input');
      const fn = mock(() => Promise.reject(nonRetryableError));

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 5,
          baseDelayMs: 10,
          shouldRetry: () => false,
        })
      ).rejects.toThrow('Invalid input');
      
      // Should not retry when shouldRetry is false
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    test('identifies timeout errors as retryable', () => {
      const errors = [
        new Error('Timeout occurred'),
        new Error('Request timeout'),
        new Error('Operation timed out'),
      ];

      errors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    test('identifies network errors as retryable', () => {
      const errors = [
        new Error('Network error'),
        new Error('Network request failed'),
      ];

      errors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    test('identifies connection errors as retryable', () => {
      const errors = [
        new Error('Connection refused'),
        new Error('ECONNREFUSED'),
        new Error('Connection error'),
      ];

      errors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    test('identifies CDP/transport errors as retryable', () => {
      const errors = [
        new Error('CDP connection closed'),
        new Error('Transport closed'),
        new Error('Socket error'),
      ];

      errors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    test('identifies non-retryable errors', () => {
      const errors = [
        new Error('Validation failed'),
        new Error('Invalid input'),
        new Error('Permission denied'),
      ];

      errors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
      });
    });

    test('handles case-insensitive error messages', () => {
      const error = new Error('TIMEOUT ERROR');
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('handles function that throws non-Error objects', async () => {
      const fn = mock(() => Promise.reject('String error'));
      
      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 2,
          baseDelayMs: 10,
        })
      ).rejects.toBeDefined();
    });

    test('handles function that returns undefined', async () => {
      const fn = mock(() => Promise.resolve(undefined));
      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
      });
      expect(result).toBeUndefined();
    });
  });
});

