# Implementation Phases: QA Agent for Browser-Generated Web Games

This document outlines the implementation phases from MVP to completion, based on the PRD requirements. All phases focus on in-scope functionality only.

---

## Phase 1: MVP Vertical Slice
**Goal:** End-to-end working pipeline from CLI to JSON output

### 1.1 Project Setup & Structure
- [ ] Initialize Bun/TypeScript project with `package.json`, `tsconfig.json`
- [ ] Install core dependencies:
  - `@browserbasehq/stagehand` (browser automation)
  - `commander` (CLI parsing)
  - `zod` (config validation)
  - `fs-extra` (file I/O)
  - `chalk`, `ora` (CLI UX)
- [ ] Create project directory structure:
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
- [ ] Implement `cli.ts` with `commander`:
  - Command: `qa-agent test <game-url> [--config <file>]`
  - Options: `--config`, `--headed`, `--retries`, `--output-dir`, `--llm`, `--model`
- [ ] Parse and validate command-line arguments
- [ ] Create main entry point that orchestrates test execution

### 1.3 Configuration Parser
- [ ] Define Zod schema for config validation:
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
- [ ] Implement `config.ts` with validation and normalization
- [ ] Load and parse config file with error handling
- [ ] Provide default config if none provided
- [ ] Example config structure:
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
- [ ] Implement `session.ts` (or `browser.ts`):
  - Initialize Stagehand with `env: "BROWSERBASE"`
  - Set `cacheDir: "cache/qa-workflow-v1"` for deterministic caching
  - Create browser session (headless by default)
  - Navigate to game URL
  - Basic page load detection
  - Record baseline screenshot after load
  - Cleanup/teardown logic
- [ ] Handle BrowserBase session initialization
- [ ] Basic error handling for browser launch failures
- [ ] Capture console logs and network errors during initialization

### 1.5 Interaction Engine (Basic)
- [ ] Implement `interaction.ts`:
  - Execute `wait` actions (milliseconds from config)
  - Execute `click` actions using Stagehand `act()` API:
    - Use natural language targets from config (e.g., "click start button")
    - Prefer `observe()` → `act()` pattern for deterministic clicks
  - Execute `press` actions with key and optional repeat:
    - Support `key: "ArrowRight"` with `repeat: 5`
    - Map keys to keyboard events
  - Execute `screenshot` actions (trigger capture)
- [ ] Map config sequence to Stagehand API calls
- [ ] Basic action execution loop
- [ ] Handle both simple config format and future control schema

### 1.6 Capture Manager (Basic)
- [ ] Implement `capture.ts`:
  - Take screenshots using Stagehand's screenshot API
  - Save screenshots to session directory
  - Basic console log collection (if available)
- [ ] Create timestamped session directory structure
- [ ] Save screenshots with labels and timestamps

### 1.7 Reporter (Basic)
- [ ] Implement `reporter.ts`:
  - Generate basic JSON output schema:
    - `status`: "pass" or "fail" (overall outcome)
    - `playability_score`: placeholder (0.0 for now)
    - `issues`: array of strings (e.g., ["timeout", "freeze"])
    - `screenshots`: array of filenames (e.g., ["baseline.png", "end.png"])
    - `timestamp`: ISO-8601 completion timestamp
  - Write JSON to `results/<game-id>/output.json` (or `results/<session-id>/output.json`)
- [ ] Create session directory structure

### 1.8 Integration Test
- [ ] Test end-to-end flow with simple game URL
- [ ] Verify CLI accepts arguments
- [ ] Verify browser launches and loads page
- [ ] Verify at least one action executes
- [ ] Verify screenshot is captured
- [ ] Verify JSON output is generated

**Deliverable:** Working CLI that can load a game, execute one action, capture a screenshot, and output JSON.

---

## Phase 2: Resilience Layer
**Goal:** Robust error handling, timeouts, retries, and graceful degradation

### 2.1 Timeout Management
- [ ] Implement global timeout enforcement (default: 1 minute, for now)
- [ ] Implement per-action timeout (default: 10 seconds)
- [ ] Implement page load timeout (default: 30 seconds)
- [ ] Add timeout tracking and early termination
- [ ] Record `timeout` issues in output

### 2.2 Retry Logic
- [ ] Implement page load retry mechanism (default: 3 retries)
- [ ] Add exponential backoff for retries
- [ ] Track retry attempts and record in issues
- [ ] Implement action-level retry with configurable attempts
- [ ] Record `load_timeout` issues after max retries

### 2.3 Error Taxonomy
- [ ] Define issue types:
  - `load_timeout`: Page failed to load within timeout
  - `action_timeout`: Action exceeded timeout
  - `action_failed`: Action execution failed (missing element, etc.)
  - `screenshot_failed`: Screenshot capture failed
  - `log_failed`: Log collection failed
  - `browser_crash`: Browser session crashed
  - `selector_not_found`: Element selector not found
- [ ] Implement error classification and recording
- [ ] Ensure issues are recorded without crashing

### 2.4 Graceful Degradation
- [ ] Handle screenshot failures gracefully (skip, record issue)
- [ ] Handle log collection failures gracefully (skip, record issue)
- [ ] Continue execution after non-critical failures
- [ ] Ensure JSON output is always generated, even on failures

### 2.5 Headless Fallback
- [ ] Detect headless mode failures (timeout, blank screen)
- [ ] Implement automatic fallback to headed browser
- [ ] Record `headless_incompatibility` issue when fallback occurs
- [ ] Test fallback mechanism

### 2.6 Action Safety
- [ ] Enforce maximum number of actions (default: 100 steps for now, prevent infinite loops)
- [ ] Clamp keypress repeat counts (prevent runaway loops)
- [ ] Validate action inputs before execution
- [ ] Record issues for invalid actions without crashing
- [ ] Track step count and enforce max steps limit

### 2.7 Browser Session Management
- [ ] Implement robust browser cleanup on success/failure
- [ ] Handle browser crash recovery (re-init session)
- [ ] Track browser session state
- [ ] Ensure resources are released

**Deliverable:** Robust system that handles failures gracefully, enforces timeouts, and always produces a report.

---

## Phase 3: Evidence Layer
**Goal:** Comprehensive evidence capture (screenshots, logs, timings)

### 3.1 Screenshot Strategy
- [ ] Implement screenshot capture at key moments:
  - Initial load / ready state (after page load)
  - Post-action snapshots (after first interaction, mid-game)
  - Game Over / Victory / End state (detected via extract)
  - Error or timeout states
- [ ] Automate screenshot triggers based on stage/action index
- [ ] Ensure 3-5 screenshots per run
- [ ] Label screenshots with descriptive names and timestamps
- [ ] Verify UI layer is visible in captures

### 3.2 Console Log Collection
- [ ] Implement console log capture via Stagehand/BrowserBase
- [ ] Collect console.error, console.warn, console.log messages
- [ ] Capture JavaScript errors and stack traces
- [ ] Store logs in session directory as `console.log` or JSON
- [ ] Include log excerpts in output JSON (optional field)
- [ ] Handle log collection failures gracefully

### 3.3 Timing & Metrics
- [ ] Track action execution times
- [ ] Track total test duration
- [ ] Record timestamps for each action
- [ ] Include timing data in output JSON
- [ ] Use Stagehand metrics API for token/cost tracking (if available)

### 3.4 Session Directory Structure
- [ ] Create structured session directory:
  ```
  results/
    └─ <game-id>/  (or <session-id>/)
       ├─ output.json
       ├─ screenshots/
       │  ├─ baseline.png
       │  ├─ action_1.png
       │  └─ ...
       └─ logs/
          └─ console.log
  ```
- [ ] Generate unique session/game IDs (timestamp-based or game URL hash)
- [ ] Ensure directory creation is atomic
- [ ] Support future live session view via BrowserBase session URLs

### 3.5 Evidence Metadata
- [ ] Include screenshot metadata in output:
  - filename, path, timestamp, step index, label
- [ ] Include log metadata in output
- [ ] Link screenshots to actions in output

**Deliverable:** Comprehensive evidence capture with 3-5 screenshots, full logs, and structured metadata.

---

## Phase 4a: Computer Use Agent (CUA) for Canvas/Inaccessible Games
**Goal:** Enable visual-based interaction for games where DOM/accessibility tree is insufficient

**Context:** Phases 1-3 revealed that many games (like Tic Tac Toe) have inaccessible DOM structures where clickable elements aren't exposed to the accessibility tree. Computer Use Agent (CUA) mode uses screenshot-based visual interaction instead of DOM-based interaction, making it ideal for canvas games and games with poor accessibility markup.

### 4a.1 CUA Integration
- [ ] Add CUA support to config schema:
  - `"useCUA": boolean` flag in config (default: false)
  - `"cuaModel": string` (optional) - override default CUA model
- [ ] Implement CUA-based action execution:
  - Initialize `stagehand.agent({ cua: true })` when enabled
  - Switch from `stagehand.act()` to `agent.execute()` for click actions
  - Use computer-use models: `anthropic/claude-sonnet-4-20250514`, `google/gemini-2.5-computer-use-preview-10-2025`, or `openai/computer-use-preview`
- [ ] Convert action sequences to CUA instructions:
  - Map `{ "action": "click", "target": "X" }` → `agent.execute("click X", { maxSteps: 3 })`
  - Keep wait/screenshot actions as-is (handled outside CUA)

### 4a.2 Hybrid Mode Support
- [ ] Allow mixing CUA and non-CUA actions in same config
- [ ] Add per-action CUA override: `{ "action": "click", "target": "X", "useCUA": true }`
- [ ] Handle CUA-specific timeouts and error reporting

### 4a.3 Evidence Capture for CUA
- [ ] Ensure screenshots still capture correctly with CUA
- [ ] Track CUA-specific action timings
- [ ] Log CUA model usage for cost tracking

**Deliverable:** CUA-enabled interaction for canvas/puzzle games, with seamless fallback to standard DOM-based actions.

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
- [ ] Improve natural language prompts for standard act() calls
- [ ] Support per-action timeouts and model overrides
- [ ] Track action success/failure states

**Deliverable:** Full interaction engine supporting axes, controls mapping, and complex game mechanics.

---

## Phase 5: Evaluation Engine
**Goal:** Heuristic and LLM-based playability evaluation

### 5.1 Heuristic Evaluation
- [ ] Implement heuristic metrics:
  - Successful load (DOM & canvas visible)
  - Responsiveness (no JS errors)
  - Stability (no navigation crash)
  - Completion check (presence of "Game Over" or score UI)
- [ ] Calculate base playability score:
  - `playability_score = 1 - (#issues / max(actions, 1))`
  - Clamp score to [0, 1]
- [ ] Use Stagehand `extract()` to detect HUD states:
  - Extract "Game Over" text
  - Extract score values
  - Extract game state flags
- [ ] Scope extraction with selectors (after observe) to reduce tokens

### 5.2 LLM Evaluation Integration
- [ ] Design evaluation prompts:
  - System: "You are a QA expert analyzing browser game test sessions"
  - User: Targeted questions about load, controls, completion
  - Include context: action count, final screenshot, error messages
- [ ] Implement LLM evaluation function:
  - Send summarized logs, screenshots (base64), DOM snapshot
  - Request structured output: `{playability_score, issues[], confidence}`
  - Handle LLM API failures gracefully

### 5.3 Score Combination
- [ ] Combine heuristic and LLM scores:
  - Weight heuristic score (e.g., 0.6) and LLM confidence-weighted score (e.g., 0.4)
  - Or use LLM score as adjustment to heuristic
- [ ] Include LLM responses in output JSON (when enabled)
- [ ] Fall back to heuristic-only if LLM fails

### 5.4 Evaluation Prompts & Caching
- [ ] Design concise prompts to reduce token usage
- [ ] Implement basic LLM response caching:
  - Cache identical prompts/responses (same game + config)
  - Store cache in session directory or shared cache
  - Use cache key based on game URL + config hash
- [ ] Support `--llm` flag to enable/disable LLM evaluation
- [ ] Support `--model` flag to override model selection

### 5.5 Cost Management
- [ ] Track token usage per run via Stagehand metrics API:
  - Record `totalPromptTokens` and `totalCompletionTokens`
  - Calculate cost estimate per run
  - Target: <$0.03 per run average (per PRD success metrics)
- [ ] Log token costs to output JSON
- [ ] Use cheaper `executionModel` for non-reasoning actions (tool steps)
- [ ] Implement cost-aware model selection
- [ ] Persist cost metrics in session directory for dashboard visualization

**Deliverable:** Evaluation engine with heuristic scoring and optional LLM evaluation, with cost management and fallbacks.

---

## Phase 6: Output & Reporting
**Goal:** Complete JSON output schema and CLI UX

### 6.1 Complete Output Schema
- [ ] Implement full output JSON schema:
  - `status`: "pass" or "fail" (overall outcome)
  - `playability_score`: float (0-1)
  - `issues`: array of strings (e.g., ["timeout", "freeze"])
  - `screenshots`: array of filenames (e.g., ["baseline.png", "end.png"])
  - `timestamp`: ISO-8601 completion timestamp
  - Optional: `logs` (console log excerpts)
  - Optional: `llm_responses` (LLM evaluation results when enabled)
  - Optional: `test_duration` (execution time in seconds)
  - Optional: `cost_estimate` (token usage and cost metrics)
- [ ] Ensure all fields are properly populated
- [ ] Validate output schema matches PRD exactly

### 6.2 CLI UX Enhancement
- [ ] Implement colored output with `chalk`:
  - Success: green
  - Warnings: yellow
  - Errors: red
- [ ] Implement progress indicators with `ora`:
  - Show loading spinner during browser init
  - Show action progress during execution
- [ ] Display summary after test completion:
  - Status, score, issue count, duration
  - Path to output JSON
  - Path to session directory
- [ ] Format error messages clearly

### 6.3 Result Serialization
- [ ] Ensure JSON output is properly formatted (pretty-print)
- [ ] Handle large log files (truncate or summarize)
- [ ] Ensure output is always written, even on errors
- [ ] Validate JSON output structure

### 6.4 Session Management
- [ ] Generate unique session IDs consistently
- [ ] Handle concurrent test runs (unique session IDs)
- [ ] Optional: Cleanup old session directories (configurable retention)

**Deliverable:** Complete, well-formatted JSON output with polished CLI UX.

---

## Phase 7: Testing & Validation
**Goal:** Comprehensive testing and validation against success metrics

### 7.1 Unit Tests
- [ ] Write unit tests for config parser
- [ ] Write unit tests for action execution logic
- [ ] Write unit tests for evaluation scoring
- [ ] Write unit tests for error handling

### 7.2 Integration Tests
- [ ] Test full pipeline with various game URLs
- [ ] Test with different config files
- [ ] Test error scenarios (timeout, missing element, etc.)
- [ ] Test headless fallback mechanism
- [ ] Test LLM evaluation (with and without API key)

### 7.3 Success Metrics Validation (Per PRD)
- [ ] Validate successful test completion: ≥95% of runs complete successfully
- [ ] Validate false negatives (missed issues): <10% false negative rate
- [ ] Validate average test duration: <3 minutes per run
- [ ] Validate cost per run: <$0.03 average cost
- [ ] Validate deterministic replay consistency: ≥90% identical runs (same game+config)
- [ ] Validate evidence coverage: ≥3 screenshots, complete logs, ≤5% screenshot failures
- [ ] Validate error handling: ≤2% unexpected terminations
- [ ] Document test results and metrics

### 7.4 Edge Case Testing
- [ ] Test with games that fail to load
- [ ] Test with games that have no visible UI
- [ ] Test with games that crash mid-execution
- [ ] Test with invalid configs
- [ ] Test with missing config files
- [ ] Test with very long action sequences

### 7.5 Documentation
- [ ] Write README with usage examples
- [ ] Document config schema with examples
- [ ] Document output schema
- [ ] Document error codes and issues
- [ ] Create example config files for common game types

**Deliverable:** Fully tested system that meets all success metrics with comprehensive documentation.

---

## Phase 8: Polish & Completion
**Goal:** Final refinements, optimization, and production readiness

### 8.1 Performance Optimization
- [ ] Optimize screenshot capture (reduce unnecessary captures)
- [ ] Optimize DOM extraction (use scoped selectors)
- [ ] Optimize action execution (reduce LLM calls via observe→act)
- [ ] Profile and optimize slow operations

### 8.2 Code Quality
- [ ] Add comprehensive TypeScript types
- [ ] Add JSDoc comments to public APIs
- [ ] Ensure consistent error handling patterns
- [ ] Refactor duplicate code
- [ ] Run linter and fix issues

### 8.3 Security & Privacy
- [ ] Sanitize console logs (remove sensitive data)
- [ ] Secure API key handling (environment variables)
- [ ] Validate game URLs (prevent SSRF)
- [ ] Sandbox session directories

### 8.4 Observability & Metrics
- [ ] Add structured logging (log levels, structured output)
- [ ] Track and persist metrics per run:
  - `totalPromptTokens` and `totalCompletionTokens` (via Stagehand metrics)
  - Execution time, number of retries
  - Total cost estimate
  - Success rate
- [ ] Include BrowserBase session URLs in output (for live session debugging)
- [ ] Persist all artifacts (screenshots, logs, metrics) under `/results/<game-id>/`
- [ ] Add verbose mode for debugging
- [ ] Support future dashboard visualization of metrics

### 8.5 Final Validation
- [ ] Run full test suite
- [ ] Validate all PRD requirements are met
- [ ] Test with real game examples
- [ ] Verify all error paths are handled
- [ ] Verify output schema matches PRD exactly

**Deliverable:** Production-ready QA agent that meets all PRD requirements and success metrics.

---

## Phase Completion Criteria

### MVP Complete (End of Phase 1)
- ✅ CLI accepts game URL and config
- ✅ Browser launches and loads game
- ✅ At least one action executes
- ✅ Screenshot is captured
- ✅ JSON output is generated

### Resilient System (End of Phase 2)
- ✅ Timeouts enforced at all levels
- ✅ Retries implemented for page loads
- ✅ Graceful degradation for all failure modes
- ✅ Error taxonomy complete

### Evidence Complete (End of Phase 3)
- ✅ 3-5 screenshots per run
- ✅ Console logs captured
- ✅ Timings tracked
- ✅ Structured session directories

### Interaction Complete (End of Phase 4)
- ✅ All action types supported
- ✅ Controls mapping implemented
- ✅ Observe→act pattern optimized
- ✅ Axis inputs supported

### Evaluation Complete (End of Phase 5)
- ✅ Heuristic scoring implemented
- ✅ LLM evaluation integrated (optional)
- ✅ Score combination working
- ✅ Fallbacks implemented

### Reporting Complete (End of Phase 6)
- ✅ Full output schema implemented
- ✅ CLI UX polished
- ✅ All fields populated correctly

### Production Ready (End of Phase 8)
- ✅ All tests passing
- ✅ Success metrics validated
- ✅ Documentation complete
- ✅ Security hardened
- ✅ Performance optimized

---

## Dependencies Between Phases

- **Phase 1** is foundational and must be completed first
- **Phase 2** depends on Phase 1 (needs working pipeline to add resilience)
- **Phase 3** depends on Phase 1 (needs capture hooks)
- **Phase 4** depends on Phase 1 (enhances interaction engine)
- **Phase 5** depends on Phase 3 (needs evidence for evaluation)
- **Phase 6** depends on all previous phases (needs complete data)
- **Phase 7** depends on Phases 1-6 (tests complete system)
- **Phase 8** depends on all previous phases (polishes complete system)

**Recommended parallel work:** Phases 2, 3, and 4 can be developed in parallel after Phase 1, but Phase 5 should wait for Phase 3.

