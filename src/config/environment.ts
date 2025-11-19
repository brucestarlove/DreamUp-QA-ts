/**
 * Environment Configuration
 * Manages environment-specific settings
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createLogger } from '../observability/structured-logger.js';

const logger = createLogger({ service: 'environment' });

export interface EnvironmentConfig {
  browserbase: {
    apiKey: string;
    projectId: string;
    endpoint?: string;
  };
  openai: {
    apiKey: string;
    organization?: string;
  };
  timeouts: {
    load: number;
    action: number;
    total: number;
  };
  features: {
    enableLLM: boolean;
    enableCUA: boolean;
    enableCaching: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableFileLogging: boolean;
  };
}

/**
 * Load environment configuration
 */
export async function loadEnvironmentConfig(
  env: string = process.env.NODE_ENV || 'development'
): Promise<EnvironmentConfig> {
  const configPath = join(process.cwd(), 'config', `${env}.json`);

  logger.debug('Loading environment config', { env, configPath });

  // Try to load from file first
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      logger.info('Environment config loaded from file', { env, configPath });
      return config;
    } catch (error) {
      logger.warn('Failed to load environment config from file', {
        env,
        configPath,
        error: (error as Error).message,
      });
    }
  }

  // Fall back to environment variables
  logger.info('Loading environment config from environment variables', { env });

  return {
    browserbase: {
      apiKey: process.env.BROWSERBASE_API_KEY || '',
      projectId: process.env.BROWSERBASE_PROJECT_ID || '',
      endpoint: process.env.BROWSERBASE_ENDPOINT,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORGANIZATION,
    },
    timeouts: {
      load: parseInt(process.env.LOAD_TIMEOUT || '30000'),
      action: parseInt(process.env.ACTION_TIMEOUT || '10000'),
      total: parseInt(process.env.TOTAL_TIMEOUT || '60000'),
    },
    features: {
      enableLLM: process.env.ENABLE_LLM === 'true',
      enableCUA: process.env.ENABLE_CUA === 'true',
      enableCaching: process.env.ENABLE_CACHING !== 'false',
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    },
  };
}

/**
 * Validate environment configuration
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): string[] {
  const errors: string[] = [];

  if (!config.browserbase.apiKey) {
    errors.push('BROWSERBASE_API_KEY is required');
  }

  if (!config.browserbase.projectId) {
    errors.push('BROWSERBASE_PROJECT_ID is required');
  }

  if (config.features.enableCUA && !config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required when CUA is enabled');
  }

  if (config.features.enableLLM && !config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required when LLM evaluation is enabled');
  }

  return errors;
}
