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
