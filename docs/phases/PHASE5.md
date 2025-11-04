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
- [ ] Integrate Vercel AI SDK:
  - Install `vercel/ai` and `@ai-sdk/openai` (or other providers)
  - Configure API keys securely
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
