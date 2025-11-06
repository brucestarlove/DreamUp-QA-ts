/**
 * Test Fixtures - Mock Configurations
 * Provides test configs for unit testing
 */

import type { Config } from '../../src/config.js';

/**
 * Minimal valid config (just sequence)
 */
export const minimalValidConfig: Config = {
  sequence: [
    { action: 'screenshot' },
    { action: 'click', target: 'start button' },
    { wait: 1000 },
    { action: 'screenshot' },
  ],
  retries: 3,
  actionRetries: 2,
};

/**
 * Complete valid config with all options
 */
export const completeValidConfig: Config = {
  controls: {
    MoveUp: ['ArrowUp', 'KeyW'],
    MoveDown: ['ArrowDown', 'KeyS'],
    MoveLeft: ['ArrowLeft', 'KeyA'],
    MoveRight: ['ArrowRight', 'KeyD'],
    Jump: ['Space'],
  },
  sequence: [
    { action: 'screenshot' },
    { action: 'click', target: 'start button' },
    { wait: 1000 },
    { action: 'press', key: 'MoveRight', repeat: 5, delay: 100 },
    { action: 'screenshot' },
  ],
  timeouts: {
    load: 30000,
    action: 10000,
    total: 60000,
  },
  retries: 3,
  actionRetries: 2,
  domOptimization: {
    hideSelectors: ['div[class*="ad"]'],
    removeSelectors: ['div[id*="popup"]'],
  },
  metadata: {
    genre: 'platformer',
    notes: 'Test config',
  },
  alwaysCUA: false,
  cuaModel: 'openai/computer-use-preview',
  cuaMaxSteps: 3,
};

/**
 * Config with axis actions
 */
export const axisConfig: Config = {
  controls: {
    MoveUp: ['ArrowUp'],
    MoveDown: ['ArrowDown'],
    MoveLeft: ['ArrowLeft'],
    MoveRight: ['ArrowRight'],
  },
  sequence: [
    { action: 'axis', direction: 'horizontal', value: 1.0, duration: 1000 },
    { action: 'axis', direction: 'vertical', value: -1.0, duration: 500 },
    { action: 'axis', direction: '2d', value: 1.0, duration: 800 },
  ],
  retries: 3,
  actionRetries: 2,
};

/**
 * Config with agent action
 */
export const agentConfig: Config = {
  sequence: [
    { action: 'agent', instruction: 'play until win', maxSteps: 20, useCUA: true },
  ],
  retries: 3,
  actionRetries: 2,
  alwaysCUA: false,
};

/**
 * Config with CUA enabled globally
 */
export const cuaConfig: Config = {
  sequence: [
    { action: 'click', target: 'complex menu' },
    { action: 'click', target: 'start button' },
  ],
  retries: 3,
  actionRetries: 2,
  alwaysCUA: true,
  cuaModel: 'openai/computer-use-preview',
  cuaMaxSteps: 5,
};

/**
 * Config with maximum retries
 */
export const maxRetriesConfig: Config = {
  sequence: [{ action: 'click', target: 'start button' }],
  retries: 10,
  actionRetries: 5,
};

/**
 * Invalid configs (for validation testing)
 */
export const invalidConfigs = {
  missingSequence: {
    retries: 3,
  },
  emptySequence: {
    sequence: [],
    retries: 3,
  },
  invalidActionType: {
    sequence: [
      { action: 'invalid_action', target: 'test' },
    ],
    retries: 3,
  },
  negativeRetries: {
    sequence: [{ action: 'screenshot' }],
    retries: -1,
  },
  invalidTimeout: {
    sequence: [{ action: 'screenshot' }],
    timeouts: {
      load: -1000,
    },
    retries: 3,
  },
  invalidControls: {
    sequence: [{ action: 'press', key: 'MoveUp' }],
    controls: {
      MoveUp: [], // Empty array
    },
    retries: 3,
  },
};

