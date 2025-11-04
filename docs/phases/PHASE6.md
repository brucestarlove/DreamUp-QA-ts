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
