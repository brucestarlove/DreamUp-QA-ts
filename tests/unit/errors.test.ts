/**
 * Unit Tests - Error Classification
 * Tests error taxonomy and issue creation
 */

import { describe, test, expect } from 'bun:test';
import { classifyError, createIssue, type IssueType } from '../../src/utils/errors.js';

describe('Error Classification', () => {
  describe('classifyError', () => {
    test('classifies load timeout errors', () => {
      const error = new Error('Navigation timeout exceeded');
      const result = classifyError(error, { isLoad: true });
      expect(result).toBe('load_timeout');
    });

    test('classifies action timeout errors', () => {
      const error = new Error('Action timeout after 10s');
      const result = classifyError(error, { isAction: true });
      expect(result).toBe('action_timeout');
    });

    test('defaults timeout to action_timeout without context', () => {
      const error = new Error('Timeout occurred');
      const result = classifyError(error);
      expect(result).toBe('action_timeout');
    });

    test('classifies browser crash errors', () => {
      const errors = [
        new Error('Browser crash detected'),
        new Error('CDP connection closed'),
        new Error('Transport closed'),
        new Error('Socket error'),
        new Error('Connection closed unexpectedly'),
      ];

      errors.forEach((error) => {
        const result = classifyError(error);
        expect(result).toBe('browser_crash');
      });
    });

    test('classifies selector not found errors', () => {
      const errors = [
        new Error('Selector not found'),
        new Error('Element not found'),
        new Error('Could not find element'),
        new Error('Element with selector missing'),
      ];

      errors.forEach((error) => {
        const result = classifyError(error);
        expect(result).toBe('selector_not_found');
      });
    });

    test('classifies screenshot errors', () => {
      const error = new Error('Screenshot failed');
      const result = classifyError(error);
      expect(result).toBe('screenshot_failed');
    });

    test('classifies log errors', () => {
      const errors = [
        new Error('Failed to save log'),
        new Error('Console log error'),
      ];

      errors.forEach((error) => {
        const result = classifyError(error);
        expect(result).toBe('log_failed');
      });
    });

    test('defaults to action_failed for unknown errors', () => {
      const error = new Error('Some random error');
      const result = classifyError(error);
      expect(result).toBe('action_failed');
    });

    test('handles string errors', () => {
      const result = classifyError('Timeout occurred', { isLoad: true });
      expect(result).toBe('load_timeout');
    });

    test('handles case-insensitive error messages', () => {
      const error = new Error('TIMEOUT EXCEEDED');
      const result = classifyError(error, { isLoad: true });
      expect(result).toBe('load_timeout');
    });
  });

  describe('createIssue', () => {
    test('creates issue with required fields', () => {
      const issue = createIssue('action_failed', 'Test error');
      expect(issue.type).toBe('action_failed');
      expect(issue.description).toBe('Test error');
      expect(issue.timestamp).toBeDefined();
      expect(issue.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('creates issue with action index', () => {
      const issue = createIssue('action_timeout', 'Action timed out', 5);
      expect(issue.type).toBe('action_timeout');
      expect(issue.description).toBe('Action timed out');
      expect(issue.actionIndex).toBe(5);
    });

    test('generates ISO timestamp', () => {
      const issue = createIssue('action_failed', 'Test');
      const timestamp = new Date(issue.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    test('creates all issue types', () => {
      const issueTypes: IssueType[] = [
        'load_timeout',
        'action_timeout',
        'action_failed',
        'screenshot_failed',
        'log_failed',
        'browser_crash',
        'selector_not_found',
        'headless_incompatibility',
        'total_timeout',
      ];

      issueTypes.forEach((type) => {
        const issue = createIssue(type, `Test ${type}`);
        expect(issue.type).toBe(type);
      });
    });
  });

  describe('Error classification edge cases', () => {
    test('handles empty error message', () => {
      const error = new Error('');
      const result = classifyError(error);
      expect(result).toBe('action_failed');
    });

    test('handles error with multiple keywords (prioritizes first match)', () => {
      const error = new Error('Timeout occurred: selector not found');
      const result = classifyError(error);
      expect(result).toBe('action_timeout'); // First match wins
    });

    test('handles very long error messages', () => {
      const longMessage = 'Error: '.repeat(1000) + 'timeout';
      const error = new Error(longMessage);
      const result = classifyError(error, { isLoad: true });
      expect(result).toBe('load_timeout');
    });
  });
});

