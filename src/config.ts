/**
 * Configuration parser and validator using Zod
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import { logger } from './utils/logger.js';

// Schema for individual sequence steps
const SequenceStepSchema = z.union([
  // Click action: { action: "click", target: "start button", useCUA?: boolean }
  z.object({
    action: z.literal('click'),
    target: z.string(),
    useCUA: z.boolean().optional(), // Per-action CUA override
  }),
  // Press action: { action: "press", key: "ArrowRight", repeat?: 5, duration?: 500, alternateKeys?: ["Left", "Right"], delay?: 100 }
  z.object({
    action: z.literal('press'),
    key: z.string().optional(), // Optional if alternateKeys is provided
    repeat: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(), // Key hold duration in ms (for continuous press)
    alternateKeys: z.array(z.string()).optional(), // Keys to alternate between (e.g., ["Left", "Right"])
    delay: z.number().int().nonnegative().optional(), // Delay between presses in ms (default: 50ms)
  }).refine(
    (data) => data.key || (data.alternateKeys && data.alternateKeys.length > 0),
    { message: 'Either "key" or "alternateKeys" must be provided' }
  ),
  // Screenshot action: { action: "screenshot" }
  z.object({
    action: z.literal('screenshot'),
  }),
  // Observe action: { action: "observe", target: "find the game board squares" }
  // Used for debugging - tests if elements are visible to the accessibility tree
  z.object({
    action: z.literal('observe'),
    target: z.string(), // What to observe for
  }),
  // Agent action: { action: "agent", instruction: "play until win", maxSteps?: 30, useCUA?: false }
  z.object({
    action: z.literal('agent'),
    instruction: z.string(),
    maxSteps: z.number().int().positive().max(100).optional(), // Max steps for agent execution
    useCUA: z.boolean().optional(), // Whether to use Computer Use Agent (defaults to false - must be explicitly enabled)
  }),
  // Wait: { wait: 2000 }
  z.object({
    wait: z.number().int().positive(),
  }),
]);

// Timeouts configuration
const TimeoutsSchema = z.object({
  load: z.number().int().positive().default(30000), // 30 seconds
  action: z.number().int().positive().default(10000), // 10 seconds
  total: z.number().int().positive().default(60000), // 1 minute (as per user's change)
});

// Controls mapping schema - maps high-level actions to keys
// Example: { "MoveUp": ["ArrowUp", "KeyW"], "MoveDown": ["ArrowDown", "KeyS"] }
const ControlsSchema = z.record(z.array(z.string())).optional();

// DOM optimization configuration (optional)
const DomOptimizationSchema = z
  .object({
    hideSelectors: z.array(z.string()).optional(), // Additional CSS selectors to hide
    removeSelectors: z.array(z.string()).optional(), // Selectors to remove (not just hide)
  })
  .optional();

// Main config schema
export const ConfigSchema = z.object({
  sequence: z.array(SequenceStepSchema).min(1),
  controls: ControlsSchema,
  timeouts: TimeoutsSchema.optional(),
  retries: z.number().int().min(0).max(10).default(3),
  actionRetries: z.number().int().min(0).max(5).default(2), // Retries per action
  domOptimization: DomOptimizationSchema,
  metadata: z
    .object({
      genre: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  // CUA (Computer Use Agent) configuration
  alwaysCUA: z.boolean().default(false), // If true, all actions use CUA by default (unless overridden per-action)
  cuaModel: z.string().optional(), // e.g., "openai/computer-use-preview"
  cuaMaxSteps: z.number().int().positive().max(20).default(3), // Max steps per CUA action
});

export type Config = z.infer<typeof ConfigSchema>;
export type SequenceStep = z.infer<typeof SequenceStepSchema>;

// Default config
const defaultConfig: Config = {
  sequence: [
    { action: 'screenshot' }, // Baseline screenshot
  ],
  retries: 3,
  actionRetries: 2,
  timeouts: {
    load: 30000,
    action: 10000,
    total: 45000, // 45 seconds for total QA testing time
  },
  alwaysCUA: false,
  cuaModel: 'openai/computer-use-preview',
  cuaMaxSteps: 3,
};

/**
 * Load and validate configuration from file
 */
export function loadConfig(configPath?: string): Config {
  if (!configPath) {
    logger.info('No config file provided, using default config');
    return defaultConfig;
  }

  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    const rawConfig = JSON.parse(fileContent);
    const validatedConfig = ConfigSchema.parse(rawConfig);

    // Merge with defaults for optional fields
    const mergedTimeouts = validatedConfig.timeouts
      ? {
          ...defaultConfig.timeouts,
          ...validatedConfig.timeouts,
        }
      : defaultConfig.timeouts;

    return {
      ...defaultConfig,
      ...validatedConfig,
      timeouts: mergedTimeouts,
      // Ensure CUA defaults are applied if not specified
      alwaysCUA: validatedConfig.alwaysCUA ?? defaultConfig.alwaysCUA,
      cuaModel: validatedConfig.cuaModel ?? defaultConfig.cuaModel,
      cuaMaxSteps: validatedConfig.cuaMaxSteps ?? defaultConfig.cuaMaxSteps,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Config validation failed:', error.errors);
      throw new Error(`Invalid config file: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
