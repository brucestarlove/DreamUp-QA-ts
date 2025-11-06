## Phase 4b: Advanced Controls & Game Support
**Goal:** Support SNAKE and PONG games, then extend to complex games with axes and advanced control schemes

### Phase 4b.1: SNAKE & PONG Support (Immediate)
**Goal:** Full support for SNAKE and PONG games with simple directional controls

#### 4b.1.1 Controls Mapping
- [x] Implement controls schema parsing:
  - Map high-level actions (MoveUp, MoveDown, MoveLeft, MoveRight) to keys
  - Support multiple key bindings per action (e.g., ArrowUp and W both map to MoveUp)
  - Resolve action references in config to actual keys (e.g., "MoveRight" → "ArrowRight")
  - Validate control mappings
- [x] Support key aliases (ArrowUp/Up, ArrowDown/Down, etc.)
- [x] Add controls schema to config (optional, backward compatible)

#### 4b.1.2 Key Press Improvements
- [x] Enhance `press` action to support:
  - Key hold duration (continuous press simulation)
  - Key alternation (e.g., alternating Left/Right for continuous horizontal movement)
  - Configurable delay between repeated presses
- [x] Support common key names: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, KeyW, KeyS, KeyA, KeyD
- [x] Validate key names against Stagehand's supported keys

#### 4b.1.3 Agnostic Button Clicks
- [x] Improve click prompts to be game-agnostic:
  - Use functional descriptions: "start button", "play button", "begin button"
  - Support multiple phrasings for same button (START GAME, START MATCH, PLAY, etc.)
  - Make prompts element-agnostic (not game-specific)

#### 4b.1.4 Game-Specific Configs
- [x] Create `configs/snake.json` with:
  - Controls mapping for Arrow keys and WASD
  - Sequence to start game and play
  - Screenshot points (start, mid-game, game over)
- [x] Create `configs/pong.json` with:
  - Controls for Player 2 (Up/Down arrow keys)
  - Sequence to start match and play
  - Screenshot points (start, mid-match, match over)

**Deliverable:** Working configs for SNAKE and PONG games with full control support.

---

### Phase 4b.2: Advanced Controls & Axes (Future - Complex Games)
**Goal:** Full action support for platformers, action games with complex control schemes

#### 4b.2.1 Advanced Controls Mapping
- [x] Extend controls schema to support:
  - Jump actions (space, up, etc.)
  - MoveHorizontal (1D axis: left/right)
  - Move2D (2D axis: diagonal movement)
  - Custom action bindings per game

#### 4b.2.2 Axis Input Simulation
- [x] Implement axis input simulation:
  - Simulate continuous movement with key alternation/holding
  - Support 1D axes (horizontal/vertical movement)
  - Support 2D axes (diagonal movement via simultaneous key presses)
  - Clamp axis input duration to prevent infinite loops
- [x] Add axis action type: `{ action: "axis", direction: "horizontal", value: 1.0, duration: 500 }`

#### 4b.2.3 Action Execution Refinement
- [x] Improve natural language prompts:
  - Use action verbs (click, press, type)
  - Reference element functions/roles, not visual traits
  - Be explicit with scope (e.g., "in the menu panel")
- [x] Support per-action timeouts and model overrides
- [x] Track action success/failure states

**Deliverable:** Full interaction engine supporting axes, controls mapping, and complex game mechanics.
