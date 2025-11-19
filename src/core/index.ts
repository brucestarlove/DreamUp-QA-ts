/**
 * Core Module
 * Exports core domain logic and managers
 */

// Re-export from root (maintain backward compatibility while showing logical grouping)
export { SessionManager } from '../session.js';
export { CaptureManager } from '../capture.js';
export { CUAManager } from '../cua.js';
export { Reporter } from '../reporter.js';
export { evaluateWithLLM } from '../evaluation.js';
export { executeSequence } from '../interaction.js';

// Export types
export type {
  SessionState,
  SessionResult,
} from '../interfaces/session-manager.interface.js';

export type {
  CaptureResult,
  ScreenshotMetadata,
} from '../interfaces/capture-manager.interface.js';

export type { CUAResult } from '../interfaces/cua-manager.interface.js';
