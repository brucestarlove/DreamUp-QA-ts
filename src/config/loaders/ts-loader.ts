/**
 * TypeScript/JavaScript Config Loader
 * Loads configuration from .ts or .js files
 */

import { pathToFileURL } from 'url';
import type { ConfigLoader, RawConfig } from './base-loader.js';
import { ConfigLoadError } from '../../errors/custom-errors.js';

export class TSConfigLoader implements ConfigLoader {
  supports(path: string): boolean {
    return path.endsWith('.ts') || path.endsWith('.js') || path.endsWith('.mjs');
  }

  async load(path: string): Promise<RawConfig> {
    try {
      // Convert path to file URL for dynamic import
      const fileUrl = pathToFileURL(path).href;
      const module = await import(fileUrl);

      // Support both default export and named export
      const config = module.default || module.config;

      if (!config) {
        throw new Error('Config file must export a default object or named "config" export');
      }

      return config;
    } catch (error) {
      throw new ConfigLoadError(
        `Failed to load TypeScript/JavaScript config: ${(error as Error).message}`,
        path,
        { originalError: error }
      );
    }
  }
}
