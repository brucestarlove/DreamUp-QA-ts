/**
 * Ora Progress Reporter
 * CLI progress reporter using ora spinners
 */

import ora, { Ora } from 'ora';
import type { IProgressReporter } from './progress-reporter.interface.js';

export class OraProgressReporter implements IProgressReporter {
  private spinner: Ora;

  constructor() {
    this.spinner = ora();
  }

  start(message: string): void {
    this.spinner.start(message);
  }

  succeed(message: string): void {
    this.spinner.succeed(message);
  }

  fail(message: string): void {
    this.spinner.fail(message);
  }

  warn(message: string): void {
    this.spinner.warn(message);
  }

  info(message: string): void {
    this.spinner.info(message);
  }

  update(message: string): void {
    this.spinner.text = message;
  }
}
