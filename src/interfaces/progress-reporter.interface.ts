/**
 * Progress Reporter Interface
 * Allows different implementations for CLI, API, and testing
 */

export interface IProgressReporter {
  /**
   * Start a new progress operation
   */
  start(message: string): void;

  /**
   * Mark current operation as successful
   */
  succeed(message: string): void;

  /**
   * Mark current operation as failed
   */
  fail(message: string): void;

  /**
   * Show a warning message
   */
  warn(message: string): void;

  /**
   * Show an info message
   */
  info(message: string): void;

  /**
   * Update the current progress message
   */
  update?(message: string): void;
}

/**
 * Silent reporter for testing or API usage
 */
export class SilentProgressReporter implements IProgressReporter {
  start(_message: string): void {
    // No-op
  }

  succeed(_message: string): void {
    // No-op
  }

  fail(_message: string): void {
    // No-op
  }

  warn(_message: string): void {
    // No-op
  }

  info(_message: string): void {
    // No-op
  }

  update(_message: string): void {
    // No-op
  }
}

/**
 * Console-based reporter for CLI usage
 */
export class ConsoleProgressReporter implements IProgressReporter {
  private currentMessage: string = '';

  start(message: string): void {
    this.currentMessage = message;
    console.log(`⏳ ${message}`);
  }

  succeed(message: string): void {
    console.log(`✅ ${message}`);
    this.currentMessage = '';
  }

  fail(message: string): void {
    console.log(`❌ ${message}`);
    this.currentMessage = '';
  }

  warn(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  update(message: string): void {
    this.currentMessage = message;
    console.log(`   ${message}`);
  }
}
