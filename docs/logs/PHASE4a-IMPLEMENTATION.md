# Phase 4a Implementation Plan: OpenAI Computer Use Agent (CUA)

**Goal:** Enable visual-based interaction for games where DOM/accessibility tree is insufficient (canvas games, puzzle games, etc.)

**Model:** OpenAI `openai/computer-use-preview` (default)

---

## Overview

This phase implements Computer Use Agent (CUA) support using OpenAI's computer-use model. CUA uses screenshot-based visual interaction instead of DOM-based interaction, making it ideal for:
- Canvas-based games
- Games with inaccessible DOM structures (like Tic Tac Toe)
- Games where clickable elements aren't exposed to the accessibility tree

---

## Implementation Tasks

### Task 1: Extend Config Schema (`src/config.ts`)

**Goal:** Add CUA configuration options to the config schema

**Changes:**
1. Add to `ConfigSchema`:
   ```typescript
   useCUA: z.boolean().default(false),
   cuaModel: z.string().optional(), // e.g., "openai/computer-use-preview"
   cuaMaxSteps: z.number().int().positive().max(20).default(3), // Max steps per CUA action
   ```

2. Add to `SequenceStepSchema` (for click actions):
   ```typescript
   // In click action schema:
   useCUA: z.boolean().optional(), // Per-action CUA override
   ```

3. Update `defaultConfig`:
   ```typescript
   useCUA: false,
   cuaModel: "openai/computer-use-preview",
   cuaMaxSteps: 3,
   ```

**Files Modified:**
- `src/config.ts`

**Validation:**
- Ensure backward compatibility (default `useCUA: false`)
- Validate `cuaModel` format matches expected pattern
- Test config loading with and without CUA flags

---

### Task 2: Create CUA Agent Manager (`src/cua.ts`)

**Goal:** Centralized CUA agent lifecycle management

**New File:** `src/cua.ts`

**Implementation:**
```typescript
import type { Stagehand } from '@browserbasehq/stagehand';
import { logger } from './utils/logger.js';
import type { Config } from './config.js';

export interface CUAOptions {
  model?: string;
  maxSteps?: number;
  systemPrompt?: string;
}

export class CUAManager {
  private agent: any = null; // Stagehand Agent type
  private stagehand: Stagehand;
  private config: CUAOptions;

  constructor(stagehand: Stagehand, config: CUAOptions) {
    this.stagehand = stagehand;
    this.config = config;
  }

  /**
   * Initialize CUA agent if not already initialized
   */
  async initialize(): Promise<void> {
    if (this.agent) {
      return; // Already initialized
    }

    const model = this.config.model || "openai/computer-use-preview";
    const systemPrompt = this.config.systemPrompt || 
      "You are testing a browser game. Interact with game elements precisely based on visual cues. Click on the exact visual elements described.";

    logger.info(`Initializing CUA agent with model: ${model}`);
    
    this.agent = this.stagehand.agent({
      cua: true,
      model: model,
      systemPrompt: systemPrompt,
    });

    logger.info('CUA agent initialized successfully');
  }

  /**
   * Execute a CUA action
   */
  async execute(instruction: string, maxSteps?: number): Promise<any> {
    await this.initialize(); // Ensure agent is initialized
    
    const steps = maxSteps || this.config.maxSteps || 3;
    logger.debug(`CUA executing: "${instruction}" (maxSteps: ${steps})`);
    
    try {
      const result = await this.agent.execute({
        instruction: instruction,
        maxSteps: steps,
      });
      
      logger.debug(`CUA execution completed: ${result.message || 'success'}`);
      return result;
    } catch (error) {
      logger.error(`CUA execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean {
    return this.agent !== null;
  }
}
```

**Files Created:**
- `src/cua.ts`

**Validation:**
- Test agent initialization with OpenAI API key
- Verify error handling for missing API keys
- Test agent reuse (should not reinitialize if already created)

---

### Task 3: Integrate CUA into Interaction Engine (`src/interaction.ts`)

**Goal:** Modify `executeAction` to support CUA mode for click actions

**Changes:**

1. **Update `executeAction` signature:**
   ```typescript
   export async function executeAction(
     stagehand: Stagehand,
     step: SequenceStep,
     actionIndex: number,
     config: Config,
     captureManager?: CaptureManager,
     cuaManager?: CUAManager, // NEW
   ): Promise<ActionResult>
   ```

2. **Modify click action handler:**
   ```typescript
   case 'click': {
     // Check if CUA should be used (global flag or per-action override)
     const useCUA = step.useCUA ?? config.useCUA ?? false;
     
     if (useCUA && cuaManager) {
       // Use CUA for visual-based clicking
       const instruction = `click on ${step.target}`;
       const maxSteps = config.cuaMaxSteps ?? 3;
       
       try {
         await cuaManager.execute(instruction, maxSteps);
         const executionTime = Date.now() - actionStartTime;
         return {
           success: true,
           actionIndex,
           executionTime,
           timestamp: getTimestamp(),
         };
       } catch (error) {
         const errorMessage = error instanceof Error ? error.message : String(error);
         throw new Error(`CUA click failed: ${errorMessage}`);
       }
     } else {
       // Existing DOM-based click logic (observe → act pattern)
       // ... keep existing code ...
     }
   }
   ```

3. **Update `executeSequence` signature:**
   ```typescript
   export async function executeSequence(
     stagehand: Stagehand,
     config: Config,
     startTime: number,
     captureManager?: CaptureManager,
     onActionComplete?: (result: ActionResult) => void,
     cuaManager?: CUAManager, // NEW
   ): Promise<ActionResult[]>
   ```

4. **Pass CUA manager to `executeAction`:**
   ```typescript
   const result = await executeAction(
     stagehand, 
     step, 
     i, 
     config, 
     captureManager,
     cuaManager // NEW
   );
   ```

**Files Modified:**
- `src/interaction.ts`

**Validation:**
- Test click action with `useCUA: true` in config
- Test click action with `useCUA: false` (should use DOM-based)
- Test per-action override: `{ "action": "click", "target": "X", "useCUA": true }`
- Ensure wait/screenshot/press actions still work (not affected by CUA)

---

### Task 4: Initialize CUA in CLI (`src/cli.ts`)

**Goal:** Create and pass CUA manager when CUA is enabled

**Changes:**

1. **Import CUA manager:**
   ```typescript
   import { CUAManager } from './cua.js';
   ```

2. **Create CUA manager after session initialization:**
   ```typescript
   // After session initialization
   const session = await sessionManager.loadGame(gameUrl, config);
   spinner.succeed('Browser session initialized');

   // Initialize CUA manager if enabled
   let cuaManager: CUAManager | undefined;
   if (config.useCUA) {
     spinner.start('Initializing Computer Use Agent...');
     try {
       cuaManager = new CUAManager(session.stagehand, {
         model: config.cuaModel || "openai/computer-use-preview",
         maxSteps: config.cuaMaxSteps || 3,
       });
       await cuaManager.initialize();
       spinner.succeed('Computer Use Agent initialized');
     } catch (error) {
       spinner.fail('Failed to initialize Computer Use Agent');
       logger.error('CUA initialization error:', error);
       // Continue without CUA (graceful degradation)
       cuaManager = undefined;
     }
   }
   ```

3. **Pass CUA manager to `executeSequence`:**
   ```typescript
   const actionResults = await executeSequence(
     session.stagehand, 
     config, 
     startTime, 
     captureManager,
     (result) => { /* ... */ },
     cuaManager // NEW
   );
   ```

**Files Modified:**
- `src/cli.ts`

**Validation:**
- Test CLI with `useCUA: true` in config
- Test CLI with `useCUA: false` (should work normally)
- Verify error handling if OpenAI API key is missing
- Test graceful degradation (continue without CUA if init fails)

---

### Task 5: Update Example Config (`configs/playtictactoe.json`)

**Goal:** Enable CUA for Tic Tac Toe game

**Changes:**
```json
{
  "useCUA": true,
  "cuaModel": "openai/computer-use-preview",
  "cuaMaxSteps": 3,
  "url": "https://playtictactoe.org/",
  "sequence": [
    { "wait": 1000 },
    { "action": "click", "target": "click the center square div in the game board" },
    { "wait": 1000 },
    { "action": "click", "target": "click on one of the nine square divs in the game board which does not have an X or O" },
    { "wait": 1000 },
    { "action": "screenshot" },
    { "action": "click", "target": "click on one of the nine square divs in the game board which does not have an X or O" },
    { "wait": 1000 },
    { "action": "screenshot" },
    { "action": "click", "target": "click on one of the nine square divs in the game board which does not have an X or O" },
    { "wait": 1000 },
    { "action": "screenshot" }
  ],
  "timeouts": {
    "load": 30000,
    "action": 15000,
    "total": 60000
  },
  "domOptimization": {
    "hideSelectors": [
      "#siteMenu",
      ".intro",
      ".ympb_target_group"
    ]
  }
}
```

**Files Modified:**
- `configs/playtictactoe.json`

**Validation:**
- Test with updated config
- Verify CUA clicks correct game cells visually
- Check that X's appear on the board (not just O's)

---

### Task 6: Environment Variable Documentation

**Goal:** Document required environment variables

**Changes:**

1. **Update `.env.example` (if exists) or create:**
   ```bash
   # OpenAI API Key (required for CUA)
   OPENAI_API_KEY=your_openai_api_key_here

   # BrowserBase (existing)
   BROWSERBASE_API_KEY=your_browserbase_api_key
   BROWSERBASE_PROJECT_ID=your_project_id
   ```

2. **Update README.md** (if exists) with:
   - CUA setup instructions
   - OpenAI API key requirement
   - Cost considerations

**Files Modified/Created:**
- `.env.example` (create if doesn't exist)
- `README.md` (update if exists)

---

## Testing Checklist

### Unit Tests
- [ ] Config schema validates `useCUA` flag
- [ ] Config schema validates `cuaModel` format
- [ ] `CUAManager` initializes correctly
- [ ] `CUAManager` handles missing API key gracefully
- [ ] `executeAction` uses CUA when `useCUA: true`
- [ ] `executeAction` uses DOM-based when `useCUA: false`
- [ ] Per-action `useCUA` override works

### Integration Tests
- [ ] Full test run with `useCUA: true` on Tic Tac Toe
- [ ] Verify X's appear on board (not just O's)
- [ ] Verify screenshots still capture correctly
- [ ] Verify action timings are tracked
- [ ] Verify error handling works (missing API key, network errors)

### Edge Cases
- [ ] CUA fails gracefully (falls back to error reporting)
- [ ] Mix of CUA and non-CUA actions in same sequence
- [ ] CUA with `maxSteps: 1` (should still work)
- [ ] CUA with invalid model name (error handling)

---

## Success Criteria

1. ✅ Tic Tac Toe game can be played successfully (X's appear on board)
2. ✅ CUA mode is optional and backward compatible
3. ✅ Per-action CUA override works
4. ✅ Screenshots and evidence capture still work
5. ✅ Error handling is robust (missing API keys, network failures)
6. ✅ Action timings are tracked correctly
7. ✅ No regression in non-CUA functionality

---

## Implementation Order

1. **Task 1:** Config schema (foundation)
2. **Task 2:** CUA manager (core functionality)
3. **Task 3:** Integration (wire it up)
4. **Task 4:** CLI integration (make it usable)
5. **Task 5:** Example config (test it)
6. **Task 6:** Documentation (polish)

---

## Notes

- **API Key:** OpenAI API key must be set in `OPENAI_API_KEY` environment variable
- **Cost:** CUA models are more expensive than standard models, track usage
- **Performance:** CUA actions may take longer (screenshot processing)
- **Hybrid Mode:** Can mix CUA and non-CUA actions in same sequence
- **Backward Compatibility:** Default `useCUA: false` ensures existing configs work

---

## Future Enhancements (Out of Scope for Phase 4a)

- Support for other CUA models (Anthropic, Google) - can be added later
- Automatic fallback from DOM-based to CUA on failure
- CUA-specific prompt optimization per game type
- Cost tracking and reporting for CUA usage

