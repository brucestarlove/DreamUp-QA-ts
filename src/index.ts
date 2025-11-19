/**
 * DreamUp QA TypeScript SDK
 * Main entry point for the QA testing framework
 */

// Core managers and functionality
export * from './core/index.js';

// Actions
export * from './actions/index.js';

// Configuration
export { loadConfig, type Config } from './config.js';
export * from './config/async-loader.js';
export * from './config/environment.js';
export * from './config/validator.js';

// Services
export { TestOrchestrator, type TestExecutionOptions, type TestExecutionResult } from './services/test-orchestrator.js';
export { createServiceContainer, type ServiceContainer, type ServiceContainerOptions } from './services/container.js';
export { SessionPool, createSessionPool, type SessionPoolOptions, type SessionPoolStats } from './services/session-pool.js';

// Errors
export * from './errors/custom-errors.js';
export { ErrorHandler, createErrorHandler, type HandledError, type ErrorHandlerOptions } from './errors/error-handler.js';

// Interfaces
export type { ISessionManager } from './interfaces/session-manager.interface.js';
export type { ICaptureManager } from './interfaces/capture-manager.interface.js';
export type { ICUAManager } from './interfaces/cua-manager.interface.js';
export type { IProgressReporter } from './interfaces/progress-reporter.interface.js';

// Capture (optimized)
export * from './capture/index.js';

// Mocks (for testing)
export * from './mocks/index.js';

// Utilities
export * from './utils/index.js';

// Observability
export { StructuredLogger, createLogger, type LogLevel } from './observability/structured-logger.js';

// Types
export type { TestResult } from './lib/types/test-result.js';
