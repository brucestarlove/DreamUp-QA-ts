/**
 * Structured Logger
 * Provides structured logging with context and metadata
 * Built-in implementation without external dependencies
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  service: string;
  version?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  version?: string;
  enableFileLogging?: boolean;
  logDir?: string;
  enableConsole?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger {
  private config: Required<LoggerConfig>;
  private logBuffer: LogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level,
      service: config.service,
      version: config.version || process.env.npm_package_version || '0.0.0',
      enableFileLogging: config.enableFileLogging ?? true,
      logDir: config.logDir || 'logs',
      enableConsole: config.enableConsole ?? true,
    };

    if (this.config.enableFileLogging) {
      this.initializeLogDirectory();
      this.startFlushInterval();
    }
  }

  private initializeLogDirectory(): void {
    try {
      if (!existsSync(this.config.logDir)) {
        mkdirSync(this.config.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private startFlushInterval(): void {
    // Flush logs every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 5000);
  }

  private flushLogs(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      const logPath = join(this.config.logDir, 'combined.log');
      const errorLogPath = join(this.config.logDir, 'error.log');

      const entries = this.logBuffer.splice(0);

      // Write all entries to combined log
      const combinedContent = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
      writeFileSync(logPath, combinedContent, { flag: 'a' });

      // Write errors to error log
      const errorEntries = entries.filter((e) => e.level === 'error');
      if (errorEntries.length > 0) {
        const errorContent = errorEntries.map((e) => JSON.stringify(e)).join('\n') + '\n';
        writeFileSync(errorLogPath, errorContent, { flag: 'a' });
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatConsoleOutput(entry: LogEntry): string {
    const timestamp = chalk.gray(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const message = entry.message;

    let output = `${timestamp} ${level} ${message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += chalk.gray(` ${JSON.stringify(entry.context)}`);
    }

    if (entry.error) {
      output += '\n' + chalk.red(entry.error.message);
      if (entry.error.stack) {
        output += '\n' + chalk.gray(entry.error.stack);
      }
    }

    return output;
  }

  private formatLevel(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return chalk.blue('[DEBUG]');
      case 'info':
        return chalk.green('[INFO] ');
      case 'warn':
        return chalk.yellow('[WARN] ');
      case 'error':
        return chalk.red('[ERROR]');
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.config.service,
      version: this.config.version,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // Console output
    if (this.config.enableConsole) {
      console.log(this.formatConsoleOutput(entry));
    }

    // Buffer for file logging
    if (this.config.enableFileLogging) {
      this.logBuffer.push(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, errorOrContext?: Error | Record<string, any>, context?: Record<string, any>): void {
    if (errorOrContext instanceof Error) {
      this.log('error', message, context, errorOrContext);
    } else {
      this.log('error', message, errorOrContext);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): StructuredLogger {
    const childLogger = new StructuredLogger(this.config);
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, additionalContext?: Record<string, any>, error?: Error) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }

  /**
   * Flush remaining logs and cleanup
   */
  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs();
  }
}

// Create default logger instance
export const createLogger = (config: Partial<LoggerConfig> = {}): StructuredLogger => {
  return new StructuredLogger({
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    service: 'qa-agent',
    version: process.env.npm_package_version,
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    ...config,
  });
};

// Export singleton instance for backward compatibility
export const structuredLogger = createLogger();
