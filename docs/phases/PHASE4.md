## Phase 4a: Computer Use Agent (CUA) for Canvas/Inaccessible Games
**Goal:** Enable visual-based interaction for games where DOM/accessibility tree is insufficient (canvas games, puzzle games, etc.)

**Context:** Phase 1-3 revealed that many games (like Tic Tac Toe) have inaccessible DOM structures where clickable elements aren't exposed to the accessibility tree. CUA mode uses screenshot-based interaction instead.

**Model:** OpenAI `openai/computer-use-preview` (default)

**Detailed Implementation Plan:** See [`PHASE4a-IMPLEMENTATION.md`](./PHASE4a-IMPLEMENTATION.md)

### 4a.1 CUA Integration
- [ ] Add CUA support to config schema:
  - `"useCUA": boolean` flag in config (default: false)
  - `"cuaModel": string` (optional) - override default model
  - `"cuaMaxSteps": number` (optional) - max steps per CUA action (default: 3)
- [ ] Create `CUAManager` class for agent lifecycle management
- [ ] Implement CUA-based action execution:
  - Detect `useCUA: true` in config
  - Switch from `stagehand.act()` to `agent.execute()` for click actions
  - Use OpenAI computer-use model: `openai/computer-use-preview`

### 4a.2 CUA Execution Flow
- [ ] Initialize CUA agent when `useCUA: true`:
  ```typescript
  const agent = stagehand.agent({
    cua: true,
    model: "openai/computer-use-preview",
    systemPrompt: "You are testing a browser game. Interact with game elements precisely based on visual cues."
  });
  ```
- [ ] Convert click actions to CUA instructions:
  - Map `{ "action": "click", "target": "X" }` → `agent.execute("click on X", { maxSteps: 3 })`
  - Keep wait/screenshot/press actions as-is (handled outside CUA)
- [ ] Handle CUA-specific timeouts and error reporting

### 4a.3 Hybrid Mode Support
- [ ] Allow mixing CUA and non-CUA actions in same config:
  - Use CUA for game board interactions (inaccessible DOM)
  - Use standard `act()` for menus/dialogs (accessible DOM)
- [ ] Add per-action CUA override in config:
  - `{ "action": "click", "target": "X", "useCUA": true }`

### 4a.4 Evidence Capture for CUA
- [ ] Ensure screenshots still capture correctly with CUA
- [ ] Track CUA-specific action timings
- [ ] Log CUA model usage for cost tracking

**Deliverable:** CUA-enabled interaction for canvas/puzzle games, with seamless fallback to standard DOM-based actions.

**Success Criteria:**
- ✅ Tic Tac Toe game can be played successfully (X's appear on board)
- ✅ CUA mode is optional and backward compatible
- ✅ Per-action CUA override works
- ✅ Screenshots and evidence capture still work

---

## Phase 4b: Advanced Controls & Axes (Complex Games)
**Goal:** Full action support for platformers, action games with complex control schemes

### 4b.1 Controls Mapping
- [ ] Implement controls schema parsing:
  - Map high-level actions (Jump, MoveHorizontal, Move) to keys
  - Support multiple key bindings per action
  - Support axis inputs (1D and 2D)
- [ ] Resolve action references in config to actual keys
- [ ] Validate control mappings

### 4b.2 Advanced Action Types
- [ ] Implement axis input simulation:
  - Simulate continuous movement with key alternation/holding
  - Support 1D axes (horizontal/vertical movement)
  - Support 2D axes (diagonal movement)
  - Clamp axis input duration to prevent loops
- [ ] Implement repeated keypress support
- [ ] Implement key hold/release simulation

### 4b.3 Action Execution Refinement
- [ ] Improve natural language prompts:
  - Use action verbs (click, press, type)
  - Reference element functions/roles, not visual traits
  - Be explicit with scope (e.g., "in the menu panel")
- [ ] Support per-action timeouts and model overrides
- [ ] Track action success/failure states

**Deliverable:** Full interaction engine supporting axes, controls mapping, and complex game mechanics.
