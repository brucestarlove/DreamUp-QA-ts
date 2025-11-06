## Phase 2: Resilience Layer
**Goal:** Robust error handling, timeouts, retries, and graceful degradation

### 2.1 Timeout Management
- [x] Implement global timeout enforcement (default: 1 minute, for now)
- [x] Implement per-action timeout (default: 10 seconds)
- [x] Implement page load timeout (default: 30 seconds)
- [x] Add timeout tracking and early termination
- [x] Record `timeout` issues in output

### 2.2 Retry Logic
- [x] Implement page load retry mechanism (default: 3 retries)
- [x] Add exponential backoff for retries
- [x] Track retry attempts and record in issues
- [x] Implement action-level retry with configurable attempts
- [x] Record `load_timeout` issues after max retries

### 2.3 Error Taxonomy
- [x] Define issue types:
  - `load_timeout`: Page failed to load within timeout
  - `action_timeout`: Action exceeded timeout
  - `action_failed`: Action execution failed (missing element, etc.)
  - `screenshot_failed`: Screenshot capture failed
  - `log_failed`: Log collection failed
  - `browser_crash`: Browser session crashed
  - `selector_not_found`: Element selector not found
- [x] Implement error classification and recording
- [x] Ensure issues are recorded without crashing

### 2.4 Graceful Degradation
- [x] Handle screenshot failures gracefully (skip, record issue)
- [x] Handle log collection failures gracefully (skip, record issue)
- [x] Continue execution after non-critical failures
- [x] Ensure JSON output is always generated, even on failures

### 2.5 Headless Fallback
- [x] Detect headless mode failures (timeout, blank screen)
- [x] Implement automatic fallback to headed browser
- [x] Record `headless_incompatibility` issue when fallback occurs
- [x] Test fallback mechanism

### 2.6 Action Safety
- [x] Enforce maximum number of actions (default: 100 steps for now, prevent infinite loops)
- [x] Clamp keypress repeat counts (prevent runaway loops)
- [x] Validate action inputs before execution
- [x] Record issues for invalid actions without crashing
- [x] Track step count and enforce max steps limit

### 2.7 Browser Session Management
- [x] Implement robust browser cleanup on success/failure
- [x] Handle browser crash recovery (re-init session)
- [x] Track browser session state
- [x] Ensure resources are released

**Deliverable:** Robust system that handles failures gracefully, enforces timeouts, and always produces a report.
