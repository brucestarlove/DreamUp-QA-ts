/**
 * Error Handler Service
 * Centralized error handling with recovery strategies
 */

import {
  QATestError,
  SessionInitializationError,
  SessionLoadError,
  SessionTimeoutError,
  BrowserCrashError,
  ActionExecutionError,
  ActionTimeoutError,
  ConfigLoadError,
  EvaluationError,
  isQATestError,
  isRetryableQAError,
  type ErrorContext,
} from './custom-errors.js';
import { createIssue, type Issue, type IssueType } from '../utils/errors.js';
import { createLogger } from '../observability/structured-logger.js';

const logger = createLogger({ service: 'ErrorHandler' });

export interface HandledError {
  shouldRetry: boolean;
  fallback?: () => Promise<any>;
  issue: Issue;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandlerOptions {
  operation?: string;
  recoverable?: boolean;
  maxRetries?: number;
}

/**
 * Error Handler Service
 */
export class ErrorHandler {
  /**
   * Handle an error and return recovery information
   */
  handle(error: unknown, options: ErrorHandlerOptions = {}): HandledError {
    const { operation = 'unknown', recoverable = true } = options;

    logger.debug('Handling error', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      operation,
      recoverable,
    });

    // Handle QA Test Errors
    if (isQATestError(error)) {
      return this.handleQATestError(error, options);
    }

    // Handle standard errors
    if (error instanceof Error) {
      return this.handleStandardError(error, options);
    }

    // Handle unknown errors
    return this.handleUnknownError(error, options);
  }

  /**
   * Handle QA Test Errors
   */
  private handleQATestError(error: QATestError, options: ErrorHandlerOptions): HandledError {
    logger.error('QA Test Error occurred', error, {
      code: error.code,
      context: error.context,
    });

    switch (true) {
      case error instanceof SessionInitializationError:
        return this.handleSessionInitError(error);

      case error instanceof SessionLoadError:
        return this.handleSessionLoadError(error);

      case error instanceof SessionTimeoutError:
        return this.handleSessionTimeoutError(error);

      case error instanceof BrowserCrashError:
        return this.handleBrowserCrashError(error);

      case error instanceof ActionExecutionError:
        return this.handleActionExecutionError(error);

      case error instanceof ActionTimeoutError:
        return this.handleActionTimeoutError(error);

      case error instanceof ConfigLoadError:
        return this.handleConfigLoadError(error);

      case error instanceof EvaluationError:
        return this.handleEvaluationError(error);

      default:
        return {
          shouldRetry: isRetryableQAError(error),
          issue: createIssue('action_failed' as IssueType, error.message),
          severity: 'medium',
        };
    }
  }

  /**
   * Handle session initialization errors
   */
  private handleSessionInitError(error: SessionInitializationError): HandledError {
    return {
      shouldRetry: false, // Session init errors are usually not retryable
      issue: createIssue('browser_crash', `Session initialization failed: ${error.message}`),
      severity: 'critical',
    };
  }

  /**
   * Handle session load errors
   */
  private handleSessionLoadError(error: SessionLoadError): HandledError {
    return {
      shouldRetry: true,
      issue: createIssue('load_timeout', `Failed to load ${error.url}: ${error.message}`),
      severity: 'high',
    };
  }

  /**
   * Handle session timeout errors
   */
  private handleSessionTimeoutError(error: SessionTimeoutError): HandledError {
    return {
      shouldRetry: true,
      issue: createIssue('load_timeout', `Session timed out after ${error.timeoutMs}ms: ${error.message}`),
      severity: 'high',
    };
  }

  /**
   * Handle browser crash errors
   */
  private handleBrowserCrashError(error: BrowserCrashError): HandledError {
    return {
      shouldRetry: false,
      issue: createIssue('browser_crash', `Browser crashed: ${error.message}`),
      severity: 'critical',
    };
  }

  /**
   * Handle action execution errors
   */
  private handleActionExecutionError(error: ActionExecutionError): HandledError {
    return {
      shouldRetry: true,
      issue: createIssue(
        'action_failed',
        `Action ${error.actionIndex + 1} (${error.actionType}) failed: ${error.message}`,
        error.actionIndex
      ),
      severity: 'medium',
    };
  }

  /**
   * Handle action timeout errors
   */
  private handleActionTimeoutError(error: ActionTimeoutError): HandledError {
    return {
      shouldRetry: true,
      issue: createIssue(
        'action_timeout',
        `Action ${error.actionIndex + 1} (${error.actionType}) timed out after ${error.timeoutMs}ms`,
        error.actionIndex
      ),
      severity: 'medium',
    };
  }

  /**
   * Handle config load errors
   */
  private handleConfigLoadError(error: ConfigLoadError): HandledError {
    return {
      shouldRetry: false,
      issue: createIssue('action_failed', `Failed to load config from ${error.configPath}: ${error.message}`),
      severity: 'critical',
    };
  }

  /**
   * Handle evaluation errors
   */
  private handleEvaluationError(error: EvaluationError): HandledError {
    return {
      shouldRetry: false, // Evaluation errors are not critical
      issue: createIssue('action_failed', `Evaluation (${error.evaluationType}) failed: ${error.message}`),
      severity: 'low',
    };
  }

  /**
   * Handle standard JavaScript errors
   */
  private handleStandardError(error: Error, options: ErrorHandlerOptions): HandledError {
    const isTimeout = error.message.toLowerCase().includes('timeout');
    const isNetwork = error.message.toLowerCase().includes('network');
    const isConnection = error.message.toLowerCase().includes('connection');

    const shouldRetry = options.recoverable && (isTimeout || isNetwork || isConnection);
    const severity = isTimeout || isNetwork ? 'medium' : 'high';

    const issueType: IssueType = isTimeout
      ? 'action_timeout'
      : isConnection
        ? 'browser_crash'
        : 'action_failed';

    return {
      shouldRetry,
      issue: createIssue(issueType, error.message),
      severity,
    };
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(error: unknown, options: ErrorHandlerOptions): HandledError {
    const message = String(error);

    logger.warn('Unknown error type encountered', { error: message });

    return {
      shouldRetry: false,
      issue: createIssue('action_failed', `Unknown error: ${message}`),
      severity: 'high',
    };
  }
}

/**
 * Create a default error handler instance
 */
export function createErrorHandler(): ErrorHandler {
  return new ErrorHandler();
}
