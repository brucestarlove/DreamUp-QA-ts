## Phase 4: Enhanced Interaction Engine
**Goal:** Full action support including axes, controls mapping, and observe→act pattern

### 4.1 Controls Mapping
- [ ] Implement controls schema parsing:
  - Map high-level actions (Jump, MoveHorizontal, Move) to keys
  - Support multiple key bindings per action
  - Support axis inputs (1D and 2D)
- [ ] Resolve action references in config to actual keys
- [ ] Validate control mappings

### 4.2 Advanced Action Types
- [ ] Implement axis input simulation:
  - Simulate continuous movement with key alternation/holding
  - Support 1D axes (horizontal/vertical movement)
  - Support 2D axes (diagonal movement)
  - Clamp axis input duration to prevent loops
- [ ] Implement repeated keypress support
- [ ] Implement key hold/release simulation

### 4.3 Observe→Act Pattern (Core Pattern)
- [ ] Implement observe→act for deterministic actions:
  - Call `stagehand.observe()` to find elements (e.g., "find the start/play button")
  - Cache returned action (selector + method) to avoid repeated LLM calls
  - Execute cached action with `stagehand.act()` (no new LLM call)
- [ ] Use observe→act for button clicks, menu interactions
- [ ] Fall back to free-form `act()` if observe fails
- [ ] Implement self-healing: re-observe on failure (max 3 retries)
- [ ] Convert control schema into deterministic prompts for observe→act
- [ ] Leverage `cacheDir: "cache/qa-workflow-v1"` for repeatability

### 4.4 Action Execution Refinement
- [ ] Improve natural language prompts:
  - Use action verbs (click, press, type)
  - Reference element functions/roles, not visual traits
  - Be explicit with scope (e.g., "in the menu panel")
- [ ] Support per-action timeouts and model overrides
- [ ] Track action success/failure states

**Deliverable:** Full interaction engine supporting all action types, controls mapping, and optimized observe→act pattern.
