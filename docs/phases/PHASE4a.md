## Phase 4a: Computer Use Agent (CUA) for Canvas/Inaccessible Games
**Goal:** Enable visual-based interaction for games where DOM/accessibility tree is insufficient (canvas games, puzzle games, etc.)

**Context:** Phase 1-3 revealed that many games (like Tic Tac Toe) have inaccessible DOM structures where clickable elements aren't exposed to the accessibility tree. CUA mode uses screenshot-based interaction instead.

**Model:** OpenAI `openai/computer-use-preview` (default)

**Detailed Implementation Plan:** See [`PHASE4a-IMPLEMENTATION.md`](./PHASE4a-IMPLEMENTATION.md)

### 4a.1 CUA Integration
- [x] Add CUA support to config schema:
  - `"useCUA": boolean` flag in config (default: false)
  - `"cuaModel": string` (optional) - override default model
  - `"cuaMaxSteps": number` (optional) - max steps per CUA action (default: 3)
- [x] Create `CUAManager` class for agent lifecycle management
- [x] Implement CUA-based action execution:
  - Detect `useCUA: true` in config
  - Switch from `stagehand.act()` to `agent.execute()` for click actions
  - Use OpenAI computer-use model: `openai/computer-use-preview`

### 4a.2 CUA Execution Flow
- [x] Initialize CUA agent when `useCUA: true`:
  ```typescript
  const agent = stagehand.agent({
    cua: true,
    model: "openai/computer-use-preview",
    systemPrompt: "You are testing a browser game. Interact with game elements precisely based on visual cues."
  });
  ```
- [x] Convert click actions to CUA instructions:
  - Map `{ "action": "click", "target": "X" }` → `agent.execute("click on X", { maxSteps: 3 })`
  - Keep wait/screenshot/press actions as-is (handled outside CUA)
- [x] Handle CUA-specific timeouts and error reporting

### 4a.3 Hybrid Mode Support
- [x] Allow mixing CUA and non-CUA actions in same config:
  - Use CUA for game board interactions (inaccessible DOM)
  - Use standard `act()` for menus/dialogs (accessible DOM)
- [x] Add per-action CUA override in config:
  - `{ "action": "click", "target": "X", "useCUA": true }`

### 4a.4 Evidence Capture for CUA
- [x] Ensure screenshots still capture correctly with CUA
- [x] Track CUA-specific action timings
- [x] Log CUA model usage for cost tracking

**Deliverable:** CUA-enabled interaction for canvas/puzzle games, with seamless fallback to standard DOM-based actions.

**Success Criteria:**
- ✅ Tic Tac Toe game can be played successfully (X's appear on board)
- ✅ CUA mode is optional and backward compatible
- ✅ Per-action CUA override works
- ✅ Screenshots and evidence capture still work
