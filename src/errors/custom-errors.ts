/**
 * Custom Error Classes
 * Provides structured error hierarchy for better error handling
 */

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Base QA Test Error
 */
export class QATestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ErrorContext
  ) {
    super(message);
    this.name = 'QATestError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Session-related errors
 */
export class SessionInitializationError extends QATestError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'SESSION_INIT_ERROR', context);
    this.name = 'SessionInitializationError';
  }
}

export class SessionLoadError extends QATestError {
  constructor(
    message: string,
    public readonly url: string,
    context?: ErrorContext
  ) {
    super(message, 'SESSION_LOAD_ERROR', { ...context, url });
    this.name = 'SessionLoadError';
  }
}

export class SessionTimeoutError extends QATestError {
  constructor(message: string, public readonly timeoutMs: number, context?: ErrorContext) {
    super(message, 'SESSION_TIMEOUT', { ...context, timeoutMs });
    this.name = 'SessionTimeoutError';
  }
}

export class BrowserCrashError extends QATestError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'BROWSER_CRASH', context);
    this.name = 'BrowserCrashError';
  }
}

/**
 * Action execution errors
 */
export class ActionExecutionError extends QATestError {
  constructor(
    message: string,
    public readonly actionIndex: number,
    public readonly actionType: string,
    context?: ErrorContext
  ) {
    super(message, 'ACTION_EXECUTION_ERROR', { ...context, actionIndex, actionType });
    this.name = 'ActionExecutionError';
  }
}

export class ActionTimeoutError extends QATestError {
  constructor(
    message: string,
    public readonly actionIndex: number,
    public readonly actionType: string,
    public readonly timeoutMs: number,
    context?: ErrorContext
  ) {
    super(message, 'ACTION_TIMEOUT', { ...context, actionIndex, actionType, timeoutMs });
    this.name = 'ActionTimeoutError';
  }
}

export class ActionValidationError extends QATestError {
  constructor(
    message: string,
    public readonly actionIndex: number,
    public readonly validationErrors: string[],
    context?: ErrorContext
  ) {
    super(message, 'ACTION_VALIDATION_ERROR', { ...context, actionIndex, validationErrors });
    this.name = 'ActionValidationError';
  }
}

export class ElementNotFoundError extends QATestError {
  constructor(
    message: string,
    public readonly selector: string,
    context?: ErrorContext
  ) {
    super(message, 'ELEMENT_NOT_FOUND', { ...context, selector });
    this.name = 'ElementNotFoundError';
  }
}

/**
 * Configuration errors
 */
export class ConfigLoadError extends QATestError {
  constructor(
    message: string,
    public readonly configPath: string,
    context?: ErrorContext
  ) {
    super(message, 'CONFIG_LOAD_ERROR', { ...context, configPath });
    this.name = 'ConfigLoadError';
  }
}

export class ConfigValidationError extends QATestError {
  constructor(
    message: string,
    public readonly validationErrors: string[],
    context?: ErrorContext
  ) {
    super(message, 'CONFIG_VALIDATION_ERROR', { ...context, validationErrors });
    this.name = 'ConfigValidationError';
  }
}

/**
 * Evaluation errors
 */
export class EvaluationError extends QATestError {
  constructor(
    message: string,
    public readonly evaluationType: 'heuristic' | 'llm',
    context?: ErrorContext
  ) {
    super(message, 'EVALUATION_ERROR', { ...context, evaluationType });
    this.name = 'EvaluationError';
  }
}

export class LLMEvaluationError extends QATestError {
  constructor(
    message: string,
    public readonly model: string,
    context?: ErrorContext
  ) {
    super(message, 'LLM_EVALUATION_ERROR', { ...context, model });
    this.name = 'LLMEvaluationError';
  }
}

/**
 * CUA (Computer Use Agent) errors
 */
export class CUAInitializationError extends QATestError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'CUA_INIT_ERROR', context);
    this.name = 'CUAInitializationError';
  }
}

export class CUAExecutionError extends QATestError {
  constructor(
    message: string,
    public readonly instruction: string,
    context?: ErrorContext
  ) {
    super(message, 'CUA_EXECUTION_ERROR', { ...context, instruction });
    this.name = 'CUAExecutionError';
  }
}

/**
 * Capture errors
 */
export class ScreenshotError extends QATestError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'SCREENSHOT_ERROR', context);
    this.name = 'ScreenshotError';
  }
}

export class LogCaptureError extends QATestError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'LOG_CAPTURE_ERROR', context);
    this.name = 'LogCaptureError';
  }
}

/**
 * Type guard to check if error is a QATestError
 */
export function isQATestError(error: unknown): error is QATestError {
  return error instanceof QATestError;
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableQAError(error: unknown): boolean {
  if (!isQATestError(error)) {
    return false;
  }

  const retryableCodes = [
    'SESSION_TIMEOUT',
    'ACTION_TIMEOUT',
    'SESSION_LOAD_ERROR',
  ];

  return retryableCodes.includes(error.code);
}
