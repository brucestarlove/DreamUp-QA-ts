/**
 * Time utility functions
 */

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current timestamp in ISO-8601 format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a session ID based on timestamp
 */
export function generateSessionId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `session_${timestamp}`;
}
