/**
 * Base Config Loader Interface
 * Defines the contract for all config loaders
 */

export interface RawConfig {
  [key: string]: any;
}

export interface ConfigLoader {
  /**
   * Check if this loader supports the given file
   */
  supports(path: string): boolean;

  /**
   * Load and parse the config file
   */
  load(path: string): Promise<RawConfig>;
}
