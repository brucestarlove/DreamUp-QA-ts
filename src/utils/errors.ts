/**
 * Error Taxonomy - Structured issue types and classification
 */

export type IssueType =
  | 'load_timeout'
  | 'action_timeout'
  | 'action_failed'
  | 'screenshot_failed'
  | 'log_failed'
  | 'browser_crash'
  | 'selector_not_found'
  | 'headless_incompatibility'
  | 'total_timeout';

export interface Issue {
  type: IssueType;
  description: string;
  timestamp: string;
  actionIndex?: number;
}

/**
 * Create a new issue
 */
export function createIssue(
  type: IssueType,
  description: string,
  actionIndex?: number,
): Issue {
  return {
    type,
    description,
    timestamp: new Date().toISOString(),
    actionIndex,
  };
}

/**
 * Classify an error and determine its issue type
 */
export function classifyError(error: Error | string, context?: { isLoad?: boolean; isAction?: boolean }): IssueType {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Timeout errors
  if (errorMessage.includes('timeout')) {
    if (context?.isLoad) {
      return 'load_timeout';
    }
    if (context?.isAction) {
      return 'action_timeout';
    }
    // Default to action timeout if context unclear
    return 'action_timeout';
  }

  // Browser/connection errors
  if (
    errorMessage.includes('browser crash') ||
    errorMessage.includes('cdp') ||
    errorMessage.includes('connection closed') ||
    errorMessage.includes('transport closed') ||
    errorMessage.includes('socket')
  ) {
    return 'browser_crash';
  }

  // Element/selector errors
  if (
    errorMessage.includes('selector') ||
    errorMessage.includes('element not found') ||
    errorMessage.includes('could not find') ||
    errorMessage.includes('not found')
  ) {
    return 'selector_not_found';
  }

  // Screenshot errors
  if (errorMessage.includes('screenshot')) {
    return 'screenshot_failed';
  }

  // Log errors
  if (errorMessage.includes('log') || errorMessage.includes('console')) {
    return 'log_failed';
  }

  // Default to action_failed for unknown errors
  return 'action_failed';
}

