/**
 * Async Config Loader
 * Loads configuration asynchronously with support for multiple formats
 */

import type { Config } from '../config.js';
import { ConfigSchema } from '../config.js';
import type { ConfigLoader } from './loaders/base-loader.js';
import { JSONConfigLoader } from './loaders/json-loader.js';
import { TSConfigLoader } from './loaders/ts-loader.js';
import { loadEnvironmentConfig, validateEnvironmentConfig } from './environment.js';
import { createConfigValidator } from './validator.js';
import { ConfigLoadError, ConfigValidationError } from '../errors/custom-errors.js';
import { createLogger } from '../observability/structured-logger.js';
import { z } from 'zod';

const logger = createLogger({ service: 'ConfigLoader' });

export interface FullConfig extends Config {
  environment?: {
    browserbase: { apiKey: string; projectId: string; endpoint?: string };
    openai: { apiKey: string; organization?: string };
    features: { enableLLM: boolean; enableCUA: boolean; enableCaching: boolean };
    logging: { level: string; enableFileLogging: boolean };
  };
}

// Default config
const defaultConfig: Config = {
  sequence: [{ action: 'screenshot' }],
  retries: 3,
  actionRetries: 2,
  timeouts: {
    load: 30000,
    action: 10000,
    total: 45000,
  },
  alwaysCUA: false,
  cuaModel: 'openai/computer-use-preview',
  cuaMaxSteps: 3,
};

/**
 * Load configuration asynchronously
 */
export async function loadConfigAsync(
  configPath?: string,
  envName?: string
): Promise<FullConfig> {
  logger.info('Loading configuration', { configPath, envName });

  // Load environment configuration
  const envConfig = await loadEnvironmentConfig(envName);

  // Validate environment configuration
  const envErrors = validateEnvironmentConfig(envConfig);
  if (envErrors.length > 0) {
    logger.warn('Environment configuration validation warnings', { errors: envErrors });
  }

  // If no config path provided, return default with env
  if (!configPath) {
    logger.info('No config file provided, using default config');
    return {
      ...defaultConfig,
      environment: envConfig,
    };
  }

  // Determine loader based on file extension
  const loaders: ConfigLoader[] = [
    new JSONConfigLoader(),
    new TSConfigLoader(),
  ];

  const loader = loaders.find((l) => l.supports(configPath));

  if (!loader) {
    throw new ConfigLoadError(
      `Unsupported config file format. Supported formats: .json, .ts, .js`,
      configPath
    );
  }

  try {
    // Load raw config
    const rawConfig = await loader.load(configPath);

    // Validate with Zod schema
    const validatedConfig = ConfigSchema.parse(rawConfig);

    // Merge with defaults
    const mergedTimeouts = validatedConfig.timeouts
      ? {
          ...defaultConfig.timeouts,
          ...validatedConfig.timeouts,
        }
      : defaultConfig.timeouts;

    const config: Config = {
      ...defaultConfig,
      ...validatedConfig,
      timeouts: mergedTimeouts,
      alwaysCUA: validatedConfig.alwaysCUA ?? defaultConfig.alwaysCUA,
      cuaModel: validatedConfig.cuaModel ?? defaultConfig.cuaModel,
      cuaMaxSteps: validatedConfig.cuaMaxSteps ?? defaultConfig.cuaMaxSteps,
    };

    // Validate configuration
    const validator = createConfigValidator();
    const validation = await validator.validate(config);

    if (!validation.valid) {
      const errors = validation.issues
        .filter((i) => i.level === 'error')
        .map((i) => i.message);

      throw new ConfigValidationError(
        'Config validation failed',
        errors,
        { configPath }
      );
    }

    // Log warnings
    const warnings = validation.issues.filter((i) => i.level === 'warning');
    if (warnings.length > 0) {
      logger.warn('Config validation warnings', {
        warnings: warnings.map((w) => w.message),
      });
    }

    logger.info('Configuration loaded successfully', {
      configPath,
      sequenceLength: config.sequence.length,
    });

    return {
      ...config,
      environment: envConfig,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => e.message);
      throw new ConfigValidationError(
        'Invalid config file',
        errors,
        { configPath }
      );
    }

    throw error;
  }
}

/**
 * Backward compatibility: synchronous wrapper
 * @deprecated Use loadConfigAsync instead
 */
export function loadConfig(configPath?: string): Config {
  // For backward compatibility, return a promise that can be awaited
  // This is a temporary solution - callers should be updated to use async
  const config = loadConfigAsync(configPath);

  // Hack: return the promise disguised as Config
  // This works because the promise is awaited at the call site
  return config as any;
}
