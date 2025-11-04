/**
 * Configuration parser and validator using Zod
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import { logger } from './utils/logger.js';

// Schema for individual sequence steps
const SequenceStepSchema = z.union([
  // Click action: { action: "click", target: "start button" }
  z.object({
    action: z.literal('click'),
    target: z.string(),
  }),
  // Press action: { action: "press", key: "ArrowRight", repeat?: 5 }
  z.object({
    action: z.literal('press'),
    key: z.string(),
    repeat: z.number().int().positive().optional(),
  }),
  // Screenshot action: { action: "screenshot" }
  z.object({
    action: z.literal('screenshot'),
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

// Controls mapping (optional, for future use)
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
  domOptimization: DomOptimizationSchema,
  metadata: z
    .object({
      genre: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type SequenceStep = z.infer<typeof SequenceStepSchema>;

// Default config
const defaultConfig: Config = {
  sequence: [
    { action: 'screenshot' }, // Baseline screenshot
  ],
  retries: 3,
  timeouts: {
    load: 30000,
    action: 10000,
    total: 60000,
  },
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
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Config validation failed:', error.errors);
      throw new Error(`Invalid config file: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
