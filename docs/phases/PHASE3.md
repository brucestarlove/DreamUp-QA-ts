## Phase 3: Evidence Layer
**Goal:** Comprehensive evidence capture (screenshots, logs, timings)

### 3.1 Screenshot Strategy
- [x] Implement screenshot capture at key moments:
  - Initial load / ready state (after page load)
  - Post-action snapshots (after first interaction, mid-game)
  - Game Over / Victory / End state (detected via extract)
  - Error or timeout states
- [x] Automate screenshot triggers based on stage/action index
- [x] Ensure 3-5 screenshots per run
- [x] Label screenshots with descriptive names and timestamps
- [x] Verify UI layer is visible in captures

### 3.2 Console Log Collection
- [x] Implement console log capture via Stagehand/BrowserBase
- [x] Collect console.error, console.warn, console.log messages
- [x] Capture JavaScript errors and stack traces
- [x] Store logs in session directory as `console.log` or JSON
- [x] Include log excerpts in output JSON (optional field)
- [x] Handle log collection failures gracefully

### 3.3 Timing & Metrics
- [x] Track action execution times
- [x] Track total test duration
- [x] Record timestamps for each action
- [x] Include timing data in output JSON
- [x] Use Stagehand metrics API for token/cost tracking (if available)

### 3.4 Session Directory Structure
- [x] Create structured session directory:
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
- [x] Generate unique session/game IDs (timestamp-based or game URL hash)
- [x] Ensure directory creation is atomic
- [x] Support future live session view via BrowserBase session URLs

### 3.5 Evidence Metadata
- [x] Include screenshot metadata in output:
  - filename, path, timestamp, step index, label
- [x] Include log metadata in output
- [x] Link screenshots to actions in output

**Deliverable:** Comprehensive evidence capture with 3-5 screenshots, full logs, and structured metadata.
