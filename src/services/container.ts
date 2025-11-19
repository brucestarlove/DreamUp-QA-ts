/**
 * Dependency Injection Container
 * Creates and wires up all service dependencies
 */

import type { Config } from '../config.js';
import type { ISessionManager } from '../interfaces/session-manager.interface.js';
import type { ICaptureManager } from '../interfaces/capture-manager.interface.js';
import type { ICUAManager } from '../interfaces/cua-manager.interface.js';
import type { IProgressReporter } from '../interfaces/progress-reporter.interface.js';
import { SessionManager } from '../session.js';
import { CaptureManager } from '../capture.js';
import { CUAManager } from '../cua.js';
import { TestOrchestrator } from './test-orchestrator.js';
import { createLogger } from '../observability/structured-logger.js';

export interface ServiceContainerOptions {
  config: Config;
  sessionDir: string;
  headless?: boolean;
  progressReporter: IProgressReporter;
}

export interface ServiceContainer {
  sessionManager: ISessionManager;
  captureManager: ICaptureManager;
  cuaManager?: ICUAManager;
  progressReporter: IProgressReporter;
}

/**
 * Create service container with all dependencies
 */
export async function createServiceContainer(
  options: ServiceContainerOptions
): Promise<ServiceContainer> {
  const logger = createLogger({ service: 'container' });
  const { config, sessionDir, headless = true, progressReporter } = options;

  logger.info('Creating service container', {
    sessionDir,
    headless,
    alwaysCUA: config.alwaysCUA,
  });

  // Create session manager
  const sessionManager = new SessionManager(headless);

  // Create capture manager
  const captureManager = new CaptureManager(sessionDir);

  // Determine if CUA should be initialized
  const hasCUAInClickActions = config.sequence.some(
    (step) => 'action' in step && step.action === 'click' && step.useCUA === true
  );
  const hasAgentActionsWithCUA = config.sequence.some(
    (step) => 'action' in step && step.action === 'agent' && step.useCUA === true
  );
  const shouldInitializeCUA = config.alwaysCUA || hasCUAInClickActions || hasAgentActionsWithCUA;

  let cuaManager: ICUAManager | undefined;

  if (shouldInitializeCUA) {
    progressReporter.start('Initializing Computer Use Agent...');
    try {
      // We need to initialize session first to get stagehand
      await sessionManager.initialize();
      const stagehand = (sessionManager as any).stagehand;

      if (!stagehand) {
        throw new Error('Failed to get Stagehand instance from session manager');
      }

      cuaManager = new CUAManager(stagehand, {
        model: config.cuaModel || 'openai/computer-use-preview',
        maxSteps: config.cuaMaxSteps || 3,
      });

      await cuaManager.initialize();
      progressReporter.succeed('Computer Use Agent initialized');

      const cuaReason = hasAgentActionsWithCUA
        ? 'agent actions'
        : config.alwaysCUA
          ? 'globally (alwaysCUA)'
          : hasCUAInClickActions
            ? 'per-action'
            : 'none';

      logger.info('CUA enabled', { reason: cuaReason });
    } catch (error) {
      progressReporter.fail('Failed to initialize Computer Use Agent');
      logger.error('CUA initialization error', error as Error);

      // Continue without CUA (graceful degradation)
      cuaManager = undefined;

      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OPENAI_API_KEY not set. CUA requires an OpenAI API key.');
      }
    }
  }

  return {
    sessionManager,
    captureManager,
    cuaManager,
    progressReporter,
  };
}

/**
 * Create test orchestrator with dependencies
 */
export async function createTestOrchestrator(
  options: ServiceContainerOptions
): Promise<TestOrchestrator> {
  const container = await createServiceContainer(options);

  return new TestOrchestrator(
    container.sessionManager,
    container.captureManager,
    container.progressReporter,
    container.cuaManager
  );
}
