/**
 * Action Registry
 * Central registry for all action handlers
 * Implements the Strategy pattern for action execution
 */

import { BaseAction } from './base-action.js';
import { WaitAction } from './wait-action.js';
import { ScreenshotAction } from './screenshot-action.js';
import { ObserveAction } from './observe-action.js';
import { ClickAction } from './click-action.js';
import { PressAction } from './press-action.js';
import { AxisAction } from './axis-action.js';
import { AgentAction } from './agent-action.js';
import { createLogger } from '../observability/structured-logger.js';

export class ActionRegistry {
  private actions = new Map<string, BaseAction>();
  private logger = createLogger({ service: 'ActionRegistry' });

  constructor() {
    this.registerDefaultActions();
  }

  /**
   * Register all default actions
   */
  private registerDefaultActions(): void {
    this.register(new WaitAction());
    this.register(new ScreenshotAction());
    this.register(new ObserveAction());
    this.register(new ClickAction());
    this.register(new PressAction());
    this.register(new AxisAction());
    this.register(new AgentAction());

    this.logger.info('Action registry initialized', {
      actions: Array.from(this.actions.keys()),
    });
  }

  /**
   * Register an action handler
   */
  register(action: BaseAction): void {
    const actionType = action.getActionType();
    this.actions.set(actionType, action);
    this.logger.debug('Registered action', { actionType });
  }

  /**
   * Get an action handler by type
   */
  get(actionType: string): BaseAction | undefined {
    return this.actions.get(actionType);
  }

  /**
   * Check if an action type is registered
   */
  has(actionType: string): boolean {
    return this.actions.has(actionType);
  }

  /**
   * Get all registered action types
   */
  getActionTypes(): string[] {
    return Array.from(this.actions.keys());
  }

  /**
   * Unregister an action handler (useful for testing)
   */
  unregister(actionType: string): boolean {
    return this.actions.delete(actionType);
  }

  /**
   * Clear all registered actions
   */
  clear(): void {
    this.actions.clear();
  }
}

/**
 * Create and return a default action registry
 */
export function createActionRegistry(): ActionRegistry {
  return new ActionRegistry();
}
