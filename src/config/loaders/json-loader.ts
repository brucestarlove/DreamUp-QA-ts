/**
 * JSON Config Loader
 * Loads configuration from JSON files
 */

import { readFile } from 'fs/promises';
import type { ConfigLoader, RawConfig } from './base-loader.js';
import { ConfigLoadError } from '../../errors/custom-errors.js';

export class JSONConfigLoader implements ConfigLoader {
  supports(path: string): boolean {
    return path.endsWith('.json');
  }

  async load(path: string): Promise<RawConfig> {
    try {
      const content = await readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new ConfigLoadError(
        `Failed to load JSON config: ${(error as Error).message}`,
        path,
        { originalError: error }
      );
    }
  }
}
