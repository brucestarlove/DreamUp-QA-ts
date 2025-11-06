## Phase 1: MVP Vertical Slice
**Goal:** End-to-end working pipeline from CLI to JSON output

### 1.1 Project Setup & Structure
- [x] Initialize Bun/TypeScript project with `package.json`, `tsconfig.json`
- [x] Install core dependencies:
  - `@browserbasehq/stagehand` (browser automation)
  - `commander` (CLI parsing)
  - `zod` (config validation)
  - `fs-extra` (file I/O)
  - `chalk`, `ora` (CLI UX)
- [x] Create project directory structure:
  ```
  src/
    ├─ cli.ts
    ├─ config.ts
    ├─ browser.ts
    ├─ interaction.ts
    ├─ capture.ts
    ├─ evaluation.ts
    ├─ reporter.ts
    └─ utils/
       ├─ logger.ts
       └─ time.ts
  ```

### 1.2 CLI Entry Point
- [x] Implement `cli.ts` with `commander`:
  - Command: `qa-agent test <game-url> [--config <file>]`
  - Options: `--config`, `--headed`, `--retries`, `--output-dir`, `--llm`, `--model`
- [x] Parse and validate command-line arguments
- [x] Create main entry point that orchestrates test execution

### 1.3 Configuration Parser
- [x] Define Zod schema for config validation:
  - `sequence`: Array of step objects (each with `action`, `target`, `key`, `wait`, etc.)
  - Action types: `click`, `press`, `screenshot`, `wait`
  - Support `action: "click"` with `target: "start button"` (natural language)
  - Support `action: "press"` with `key: "ArrowRight"` and `repeat: 5`
  - Support `wait: 2000` (milliseconds)
  - Support `action: "screenshot"` (no parameters)
  - Optional: `controls` mapping for high-level actions to keys/buttons
  - Optional: `timeouts` (load, action, total with defaults)
  - Optional: `retries` (default: 3)
  - Optional: `metadata` (game genre/notes)
- [x] Implement `config.ts` with validation and normalization
- [x] Load and parse config file with error handling
- [x] Provide default config if none provided
- [x] Example config structure:
  ```json
  {
    "sequence": [
      { "action": "click", "target": "start button" },
      { "action": "press", "key": "ArrowRight", "repeat": 5 },
      { "wait": 2000 },
      { "action": "screenshot" }
    ]
  }
  ```

### 1.4 Session Manager
- [x] Implement `session.ts` (or `browser.ts`):
  - Initialize Stagehand with `env: "BROWSERBASE"`
  - Set `cacheDir: "cache/qa-workflow-v1"` for deterministic caching
  - Create browser session (headless by default)
  - Navigate to game URL
  - Basic page load detection
  - Record baseline screenshot after load
  - Cleanup/teardown logic
- [x] Handle BrowserBase session initialization
- [x] Basic error handling for browser launch failures
- [x] Capture console logs and network errors during initialization

### 1.5 Interaction Engine (Basic)
- [x] Implement `interaction.ts`:
  - Execute `wait` actions (pause for duration)
  - Execute `click` actions using Stagehand `act()` API
  - Execute `keypress` actions (single key events)
  - Execute `screenshot` actions (trigger capture)
- [x] Map config actions to Stagehand API calls
- [x] Basic action execution loop

### 1.6 Capture Manager (Basic)
- [x] Implement `capture.ts`:
  - Take screenshots using Stagehand's screenshot API
  - Save screenshots to session directory
  - Basic console log collection (if available)
- [x] Create timestamped session directory structure
- [x] Save screenshots with labels and timestamps

### 1.7 Reporter (Basic)
- [x] Implement `reporter.ts`:
  - Generate basic JSON output schema:
    - `status`: "pass" or "fail" (overall outcome)
    - `playability_score`: placeholder (0.0 for now)
    - `issues`: array of strings (e.g., ["timeout", "freeze"])
    - `screenshots`: array of filenames (e.g., ["baseline.png", "end.png"])
    - `timestamp`: ISO-8601 completion timestamp
  - Write JSON to `results/<game-id>/output.json` (or `results/<session-id>/output.json`)
- [x] Create session directory structure

### 1.8 Integration Test
- [x] Test end-to-end flow with simple game URL
- [x] Verify CLI accepts arguments
- [x] Verify browser launches and loads page
- [x] Verify at least one action executes
- [x] Verify screenshot is captured
- [x] Verify JSON output is generated

**Deliverable:** Working CLI that can load a game, execute one action, capture a screenshot, and output JSON.
