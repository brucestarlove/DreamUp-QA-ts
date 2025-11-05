/**
 * Controls Mapping Utility
 * Handles control schema parsing, action resolution, and key validation
 */

import { logger } from './logger.js';

/**
 * Control action types - high-level game actions
 */
export type ControlAction =
  | 'MoveUp'
  | 'MoveDown'
  | 'MoveLeft'
  | 'MoveRight'
  | 'MoveHorizontal' // 1D axis: left/right movement (can bind to both keys)
  | 'MoveVertical'   // 1D axis: up/down movement (can bind to both keys)
  | 'Move2D'         // 2D axis: diagonal movement (requires 2 simultaneous keys)
  | 'Jump'
  | 'Action'
  | 'Confirm'
  | 'Cancel'
  | 'Pause'
  | 'Start';

/**
 * Key aliases for browser key names
 * Maps common key names to their browser equivalents
 */
export const KEY_ALIASES: Record<string, string> = {
  // Arrow keys
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  
  // WASD keys
  w: 'KeyW',
  W: 'KeyW',
  a: 'KeyA',
  A: 'KeyA',
  s: 'KeyS',
  S: 'KeyS',
  d: 'KeyD',
  D: 'KeyD',
  
  // Common action keys
  space: 'Space',
  Space: 'Space',
  enter: 'Enter',
  Enter: 'Enter',
  escape: 'Escape',
  Escape: 'Escape',
  esc: 'Escape',
  Esc: 'Escape',
  
  // Letter keys (general support)
  // These follow the KeyX pattern for consistency with browser key codes
};

/**
 * Valid browser key names (non-exhaustive list of commonly used keys)
 * Stagehand/Playwright supports standard KeyboardEvent.key values
 */
export const VALID_KEY_NAMES = new Set([
  // Arrow keys
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  
  // WASD keys
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  
  // Special keys
  'Space',
  'Enter',
  'Escape',
  'Tab',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  
  // Letter keys (A-Z)
  ...Array.from({ length: 26 }, (_, i) => `Key${String.fromCharCode(65 + i)}`),
  
  // Number keys
  ...Array.from({ length: 10 }, (_, i) => `Digit${i}`),
  
  // Function keys
  ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`),
]);

/**
 * Control schema - maps high-level actions to keys
 * Example: { "MoveUp": ["ArrowUp", "KeyW"], "MoveDown": ["ArrowDown", "KeyS"] }
 */
export type ControlsSchema = Partial<Record<ControlAction, string[]>>;

/**
 * Resolve a key name to its canonical browser name
 * Handles aliases and validation
 */
export function resolveKeyName(key: string): string {
  // Check if it's an alias
  if (key in KEY_ALIASES) {
    return KEY_ALIASES[key];
  }
  
  // Return as-is if already valid
  if (VALID_KEY_NAMES.has(key)) {
    return key;
  }
  
  // Check if it's a single letter (convert to KeyX format)
  if (key.length === 1 && /[a-zA-Z]/.test(key)) {
    const keyCode = `Key${key.toUpperCase()}`;
    if (VALID_KEY_NAMES.has(keyCode)) {
      return keyCode;
    }
  }
  
  // Check if it's a single digit (convert to DigitX format)
  if (key.length === 1 && /[0-9]/.test(key)) {
    return `Digit${key}`;
  }
  
  // If not recognized, log warning and return as-is (may still work)
  logger.warn(`Unrecognized key name: "${key}" - using as-is (may not work)`);
  return key;
}

/**
 * Resolve an action reference to actual keys
 * Example: resolveAction("MoveUp", controls) -> ["ArrowUp", "KeyW"]
 */
export function resolveAction(
  action: string,
  controls?: ControlsSchema,
): string[] | null {
  if (!controls) {
    return null;
  }
  
  // Check if action is a known control action
  if (action in controls) {
    const keys = controls[action as ControlAction];
    if (keys && keys.length > 0) {
      // Resolve all key aliases
      return keys.map(resolveKeyName);
    }
  }
  
  return null;
}

/**
 * Validate controls schema
 * Checks for invalid key names and provides warnings
 */
export function validateControls(controls: ControlsSchema): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  for (const [action, keys] of Object.entries(controls)) {
    if (!keys || keys.length === 0) {
      warnings.push(`Action "${action}" has no keys mapped`);
      continue;
    }
    
    for (const key of keys) {
      const resolved = resolveKeyName(key);
      if (!VALID_KEY_NAMES.has(resolved)) {
        warnings.push(`Key "${key}" for action "${action}" may not be supported (resolved to "${resolved}")`);
      }
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Get the primary key for an action (first key in the mapping)
 */
export function getPrimaryKey(
  action: string,
  controls?: ControlsSchema,
): string | null {
  const keys = resolveAction(action, controls);
  return keys && keys.length > 0 ? keys[0] : null;
}

/**
 * Get all keys for an action
 */
export function getAllKeys(
  action: string,
  controls?: ControlsSchema,
): string[] {
  return resolveAction(action, controls) || [];
}

/**
 * Check if a key is mapped to an action
 */
export function isKeyMappedToAction(
  key: string,
  action: string,
  controls?: ControlsSchema,
): boolean {
  const keys = resolveAction(action, controls);
  if (!keys) return false;
  
  const resolvedKey = resolveKeyName(key);
  return keys.some(k => resolveKeyName(k) === resolvedKey);
}

