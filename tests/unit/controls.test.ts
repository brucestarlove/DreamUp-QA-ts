/**
 * Unit Tests - Controls Utility
 * Tests key resolution, action mapping, and validation
 */

import { describe, test, expect } from 'bun:test';
import {
  resolveKeyName,
  resolveAction,
  validateControls,
  getPrimaryKey,
  getAllKeys,
  isKeyMappedToAction,
  KEY_ALIASES,
} from '../../src/utils/controls.js';
import type { ControlsSchema } from '../../src/utils/controls.js';

describe('Controls Utility', () => {
  describe('resolveKeyName', () => {
    test('resolves arrow key aliases', () => {
      expect(resolveKeyName('Up')).toBe('ArrowUp');
      expect(resolveKeyName('Down')).toBe('ArrowDown');
      expect(resolveKeyName('Left')).toBe('ArrowLeft');
      expect(resolveKeyName('Right')).toBe('ArrowRight');
    });

    test('resolves WASD aliases', () => {
      expect(resolveKeyName('W')).toBe('KeyW');
      expect(resolveKeyName('w')).toBe('KeyW');
      expect(resolveKeyName('A')).toBe('KeyA');
      expect(resolveKeyName('a')).toBe('KeyA');
      expect(resolveKeyName('S')).toBe('KeyS');
      expect(resolveKeyName('s')).toBe('KeyS');
      expect(resolveKeyName('D')).toBe('KeyD');
      expect(resolveKeyName('d')).toBe('KeyD');
    });

    test('resolves special key aliases', () => {
      expect(resolveKeyName('Space')).toBe('Space');
      expect(resolveKeyName('space')).toBe('Space');
      expect(resolveKeyName('Enter')).toBe('Enter');
      expect(resolveKeyName('enter')).toBe('Enter');
      expect(resolveKeyName('Escape')).toBe('Escape');
      expect(resolveKeyName('Esc')).toBe('Escape');
      expect(resolveKeyName('esc')).toBe('Escape');
    });

    test('resolves single letter keys', () => {
      expect(resolveKeyName('Q')).toBe('KeyQ');
      expect(resolveKeyName('q')).toBe('KeyQ');
      expect(resolveKeyName('Z')).toBe('KeyZ');
      expect(resolveKeyName('z')).toBe('KeyZ');
    });

    test('resolves single digit keys', () => {
      expect(resolveKeyName('0')).toBe('Digit0');
      expect(resolveKeyName('5')).toBe('Digit5');
      expect(resolveKeyName('9')).toBe('Digit9');
    });

    test('returns valid key names as-is', () => {
      expect(resolveKeyName('ArrowUp')).toBe('ArrowUp');
      expect(resolveKeyName('KeyW')).toBe('KeyW');
      expect(resolveKeyName('Space')).toBe('Space');
    });

    test('handles unknown keys with warning', () => {
      const result = resolveKeyName('UnknownKey123');
      expect(result).toBe('UnknownKey123'); // Returns as-is but logs warning
    });
  });

  describe('resolveAction', () => {
    const testControls: ControlsSchema = {
      MoveUp: ['ArrowUp', 'KeyW'],
      MoveDown: ['ArrowDown', 'KeyS'],
      MoveLeft: ['ArrowLeft', 'KeyA'],
      MoveRight: ['ArrowRight', 'KeyD'],
      Jump: ['Space', 'KeyW'],
    };

    test('resolves action to keys', () => {
      const keys = resolveAction('MoveUp', testControls);
      expect(keys).toEqual(['ArrowUp', 'KeyW']);
    });

    test('resolves action with aliases', () => {
      const keys = resolveAction('MoveRight', testControls);
      expect(keys).toEqual(['ArrowRight', 'KeyD']);
    });

    test('resolves action with multiple keys', () => {
      const keys = resolveAction('Jump', testControls);
      expect(keys).toEqual(['Space', 'KeyW']);
    });

    test('returns null for unmapped action', () => {
      const keys = resolveAction('UnknownAction', testControls);
      expect(keys).toBeNull();
    });

    test('returns null when no controls provided', () => {
      const keys = resolveAction('MoveUp', undefined);
      expect(keys).toBeNull();
    });

    test('handles controls with aliased keys', () => {
      const controls: ControlsSchema = {
        MoveUp: ['Up', 'W'], // Uses aliases
      };
      const keys = resolveAction('MoveUp', controls);
      expect(keys).toEqual(['ArrowUp', 'KeyW']); // Resolved aliases
    });
  });

  describe('validateControls', () => {
    test('validates correct controls', () => {
      const controls: ControlsSchema = {
        MoveUp: ['ArrowUp', 'KeyW'],
        MoveDown: ['ArrowDown', 'KeyS'],
      };
      const result = validateControls(controls);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    test('warns about empty key arrays', () => {
      const controls: ControlsSchema = {
        MoveUp: [],
        MoveDown: ['ArrowDown'],
      };
      const result = validateControls(controls);
      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes('no keys'))).toBe(true);
    });

    test('warns about potentially invalid keys', () => {
      const controls: ControlsSchema = {
        MoveUp: ['InvalidKey123'],
      };
      const result = validateControls(controls);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('validates controls with aliases', () => {
      const controls: ControlsSchema = {
        MoveUp: ['Up', 'W'], // Aliases that resolve correctly
      };
      const result = validateControls(controls);
      expect(result.valid).toBe(true);
    });
  });

  describe('getPrimaryKey', () => {
    const testControls: ControlsSchema = {
      MoveUp: ['ArrowUp', 'KeyW'],
      MoveDown: ['ArrowDown'],
    };

    test('returns first key for action', () => {
      const key = getPrimaryKey('MoveUp', testControls);
      expect(key).toBe('ArrowUp');
    });

    test('returns first key when only one key', () => {
      const key = getPrimaryKey('MoveDown', testControls);
      expect(key).toBe('ArrowDown');
    });

    test('returns null for unmapped action', () => {
      const key = getPrimaryKey('UnknownAction', testControls);
      expect(key).toBeNull();
    });

    test('returns null when no controls', () => {
      const key = getPrimaryKey('MoveUp', undefined);
      expect(key).toBeNull();
    });
  });

  describe('getAllKeys', () => {
    const testControls: ControlsSchema = {
      MoveUp: ['ArrowUp', 'KeyW'],
    };

    test('returns all keys for action', () => {
      const keys = getAllKeys('MoveUp', testControls);
      expect(keys).toEqual(['ArrowUp', 'KeyW']);
    });

    test('returns empty array for unmapped action', () => {
      const keys = getAllKeys('UnknownAction', testControls);
      expect(keys).toEqual([]);
    });
  });

  describe('isKeyMappedToAction', () => {
    const testControls: ControlsSchema = {
      MoveUp: ['ArrowUp', 'KeyW'],
      Jump: ['Space'],
    };

    test('returns true for mapped key', () => {
      expect(isKeyMappedToAction('ArrowUp', 'MoveUp', testControls)).toBe(true);
      expect(isKeyMappedToAction('KeyW', 'MoveUp', testControls)).toBe(true);
    });

    test('returns false for unmapped key', () => {
      expect(isKeyMappedToAction('ArrowDown', 'MoveUp', testControls)).toBe(false);
    });

    test('handles aliased keys', () => {
      expect(isKeyMappedToAction('Up', 'MoveUp', testControls)).toBe(true);
      expect(isKeyMappedToAction('W', 'MoveUp', testControls)).toBe(true);
    });

    test('returns false for unmapped action', () => {
      expect(isKeyMappedToAction('ArrowUp', 'UnknownAction', testControls)).toBe(false);
    });
  });
});

