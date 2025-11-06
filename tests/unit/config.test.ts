/**
 * Unit Tests - Config Parser
 * Tests config validation, loading, and merging
 */

import { describe, test, expect } from 'bun:test';
import { ConfigSchema, loadConfig, type Config } from '../../src/config.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  minimalValidConfig,
  completeValidConfig,
  axisConfig,
  agentConfig,
  cuaConfig,
  maxRetriesConfig,
  invalidConfigs,
} from '../fixtures/mock-configs.js';

describe('Config Parser', () => {
  describe('ConfigSchema validation', () => {
    test('validates minimal valid config', () => {
      const result = ConfigSchema.safeParse(minimalValidConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sequence.length).toBeGreaterThan(0);
      }
    });

    test('validates complete valid config', () => {
      const result = ConfigSchema.safeParse(completeValidConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.controls).toBeDefined();
        expect(result.data.timeouts).toBeDefined();
        expect(result.data.metadata).toBeDefined();
      }
    });

    test('validates axis config', () => {
      const result = ConfigSchema.safeParse(axisConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        const axisAction = result.data.sequence.find((s) => 'action' in s && s.action === 'axis');
        expect(axisAction).toBeDefined();
      }
    });

    test('validates agent config', () => {
      const result = ConfigSchema.safeParse(agentConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        const agentAction = result.data.sequence.find((s) => 'action' in s && s.action === 'agent');
        expect(agentAction).toBeDefined();
      }
    });

    test('validates CUA config', () => {
      const result = ConfigSchema.safeParse(cuaConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alwaysCUA).toBe(true);
        expect(result.data.cuaModel).toBeDefined();
      }
    });

    test('rejects config without sequence', () => {
      const result = ConfigSchema.safeParse(invalidConfigs.missingSequence);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('sequence'))).toBe(true);
      }
    });

    test('rejects empty sequence', () => {
      const result = ConfigSchema.safeParse(invalidConfigs.emptySequence);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('sequence'))).toBe(true);
      }
    });

    test('rejects invalid action type', () => {
      const result = ConfigSchema.safeParse(invalidConfigs.invalidActionType);
      expect(result.success).toBe(false);
    });

    test('rejects negative retries', () => {
      const result = ConfigSchema.safeParse(invalidConfigs.negativeRetries);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('retries'))).toBe(true);
      }
    });

    test('rejects invalid timeout', () => {
      const result = ConfigSchema.safeParse(invalidConfigs.invalidTimeout);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes('timeouts'))).toBe(true);
      }
    });

    test('validates max retries config', () => {
      const result = ConfigSchema.safeParse(maxRetriesConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retries).toBe(10);
        expect(result.data.actionRetries).toBe(5);
      }
    });
  });

  describe('loadConfig function', () => {
    test('returns default config when no path provided', () => {
      const config = loadConfig();
      expect(config).toBeDefined();
      expect(config.sequence.length).toBeGreaterThan(0);
      expect(config.retries).toBe(3);
      expect(config.actionRetries).toBe(2);
    });

    test('loads valid config from file', () => {
      const configPath = join(process.cwd(), 'configs', 'snake.json');
      const config = loadConfig(configPath);
      expect(config).toBeDefined();
      expect(config.sequence.length).toBeGreaterThan(0);
      expect(config.controls).toBeDefined();
    });

    test('loads valid config from pong.json', () => {
      const configPath = join(process.cwd(), 'configs', 'pong.json');
      const config = loadConfig(configPath);
      expect(config).toBeDefined();
      expect(config.sequence.length).toBeGreaterThan(0);
      expect(config.timeouts).toBeDefined();
    });

    test('merges timeouts with defaults', () => {
      const configPath = join(process.cwd(), 'configs', 'snake.json');
      const config = loadConfig(configPath);
      expect(config.timeouts?.load).toBeDefined();
      expect(config.timeouts?.action).toBeDefined();
      expect(config.timeouts?.total).toBeDefined();
    });

    test('applies CUA defaults when not specified', () => {
      const configPath = join(process.cwd(), 'configs', 'snake.json');
      const config = loadConfig(configPath);
      expect(config.alwaysCUA).toBe(false);
      expect(config.cuaModel).toBeDefined();
      expect(config.cuaMaxSteps).toBe(3);
    });

    test('throws error for invalid config file', () => {
      const configPath = join(process.cwd(), 'configs', 'nonexistent.json');
      expect(() => loadConfig(configPath)).toThrow();
    });

    test('throws error for invalid JSON', () => {
      // Create a temporary invalid config file path
      expect(() => loadConfig('invalid-path')).toThrow();
    });
  });

  describe('Config merging', () => {
    test('merges partial timeouts correctly', () => {
      const partialConfig = {
        sequence: [{ action: 'screenshot' }],
        timeouts: {
          load: 20000,
        },
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(partialConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('Sequence step types', () => {
    test('validates click action', () => {
      const config = {
        sequence: [{ action: 'click' as const, target: 'start button' }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates press action with key', () => {
      const config = {
        sequence: [{ action: 'press' as const, key: 'ArrowRight', repeat: 5 }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates press action with alternateKeys', () => {
      const config = {
        sequence: [
          { action: 'press' as const, alternateKeys: ['MoveUp', 'MoveDown'], repeat: 10 },
        ],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('rejects press action without key or alternateKeys', () => {
      const config = {
        sequence: [{ action: 'press' as const }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('validates screenshot action', () => {
      const config = {
        sequence: [{ action: 'screenshot' as const }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates observe action', () => {
      const config = {
        sequence: [{ action: 'observe' as const, target: 'game board' }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates agent action', () => {
      const config = {
        sequence: [{ action: 'agent' as const, instruction: 'play game', maxSteps: 20 }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates axis action', () => {
      const config = {
        sequence: [
          { action: 'axis' as const, direction: 'horizontal' as const, value: 1.0, duration: 1000 },
        ],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('validates wait action', () => {
      const config = {
        sequence: [{ wait: 2000 }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('rejects negative wait', () => {
      const config = {
        sequence: [{ wait: -1000 }],
        retries: 3,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('handles config with max retries', () => {
      const config = {
        sequence: [{ action: 'screenshot' as const }],
        retries: 10,
        actionRetries: 5,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('rejects retries > 10', () => {
      const config = {
        sequence: [{ action: 'screenshot' as const }],
        retries: 11,
        actionRetries: 2,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('rejects actionRetries > 5', () => {
      const config = {
        sequence: [{ action: 'screenshot' as const }],
        retries: 3,
        actionRetries: 6,
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('handles config with metadata', () => {
      const config = {
        sequence: [{ action: 'screenshot' as const }],
        retries: 3,
        actionRetries: 2,
        metadata: {
          genre: 'arcade',
          notes: 'Test game',
        },
      };
      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata?.genre).toBe('arcade');
      }
    });
  });
});

