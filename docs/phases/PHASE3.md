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
