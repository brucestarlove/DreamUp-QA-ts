/**
 * Capture Module
 * Exports capture managers and screenshot optimization utilities
 */

export { OptimizedCaptureManager } from './optimized-capture-manager.js';
export { ScreenshotOptimizer, createScreenshotOptimizer } from './screenshot-optimizer.js';
export type {
  OptimizedScreenshot,
  OptimizationOptions,
} from './screenshot-optimizer.js';
export type {
  ScreenshotMetadata,
  CaptureResult,
  OptimizedCaptureOptions,
} from './optimized-capture-manager.js';
