# 🌌 **PRD: Agent-Driven Browser Game QA Pipeline (TypeScript + Bun)**

## 1. Overview

**Goal:**
Build an **agent-driven browser game QA system** that autonomously tests and evaluates browser-based games using **BrowserBase** (for managed browser sessions) and **Stagehand** (for declarative interactions), with optional **LLM-assisted evaluation** through the **Vercel AI SDK**.

The system should:

* Launch a browser session (headless or headed)
* Simulate configured user interactions (clicks, waits, keypresses)
* Capture screenshots and console logs
* Evaluate playability heuristically and via LLMs
* Output structured JSON results for dashboards or pipelines

**CLI Command:**

```bash
qa-agent test <game-url> [--config <file>]
```

---

## 2. Core Objectives

1. **Automate testing** for HTML5/browser games.
2. **Support config-based actions** for deterministic playback.
3. **Handle failures gracefully:** timeouts, retries, freezes, LLM failures, etc.
4. **Produce structured results** for dashboards and regression testing.
5. **Enable cost control** (API caching, model selection).
6. **Future extensibility** — LLM planning, web dashboard, and CI integration.

---

## 3. System Architecture

```
CLI → TestRunner → BrowserManager (BrowserBase + Stagehand)
        ↓
    InteractionEngine
        ↓
    CaptureManager (screenshots, logs)
        ↓
    EvaluationEngine (heuristics + LLM via Vercel AI)
        ↓
    JSON Reporter
```

### Core Modules

| Module                    | Purpose                                             | Technologies                                          |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| **CLI Layer**             | Command execution, arg parsing                      | `commander`, `bun`                                    |
| **Config Parser**         | Validate and normalize test configs                 | `zod`                                                 |
| **BrowserManager**        | Handle BrowserBase sessions, lifecycle, retries     | `@browserbasehq/stagehand`                            |
| **InteractionEngine**     | Execute actions (click, wait, keypress, screenshot) | `Stagehand` API                                       |
| **CaptureManager**        | Capture evidence and logs                           | `Stagehand` screenshot API                            |
| **EvaluationEngine**      | Analyze screenshots/logs for playability            | `vercel/ai`, `@ai-sdk/openai`, or fallback heuristics |
| **ResultSerializer**      | Write structured JSON + timestamped session folder  | Node `fs`                                             |
| **CacheManager (future)** | Cache LLM responses for cost reduction              | local JSON or Redis                                   |

---

## 4. CLI Design

### Command

```bash
qa-agent test <game-url> [--config <path>]
```

### Options

| Flag           | Description                                  |
| -------------- | -------------------------------------------- |
| `--config`     | JSON config file with actions/timeouts       |
| `--headed`     | Run visible browser (default: headless)      |
| `--retries`    | Override default retries (default: 3)        |
| `--output-dir` | Output directory for results                 |
| `--llm`        | Enable AI-based evaluation                   |
| `--model`      | Optional model override (e.g. `gpt-4o-mini`) |

---

## 5. Config Schema (Zod)

```ts
{
  "actions": [
    {"type": "wait", "duration": 2},
    {"type": "click", "selector": "button.start"},
    {"type": "keypress", "key": "ArrowRight", "repeat": 5},
    {"type": "screenshot", "label": "gameplay"}
  ],
  "timeouts": {
    "load": 30,
    "action": 10,
    "total": 300
  },
  "retries": 3
}
```

Supported actions:

* `wait`: pause for N seconds
* `click`: click selector
* `keypress`: simulate key presses
* `screenshot`: capture snapshot

---

## 6. Output Schema

```json
{
  "status": "success",
  "playability_score": 0.92,
  "issues": [
    {"type": "load_timeout", "description": "Game took too long to load."}
  ],
  "screenshots": [
    {"label": "start", "path": "results/session123/start.png"},
    {"label": "gameplay", "path": "results/session123/gameplay.png"}
  ],
  "timestamp": "2025-11-03T17:25:00Z"
}
```

---

## 7. Error Handling & Safety Systems

| Failure Mode                 | Mitigation                               |
| ---------------------------- | ---------------------------------------- |
| **Page load timeout**        | Retry up to 3x; mark issue if persistent |
| **Selector not found**       | Log & continue; no crash                 |
| **Browser crash**            | Re-init session; record failure          |
| **Infinite loops**           | Enforce max actions, total timeout       |
| **Screenshot failure**       | Skip gracefully, record issue            |
| **LLM API failure**          | Fallback to heuristics                   |
| **Stagehand error**          | Auto-retry with exponential backoff      |
| **Headless incompatibility** | Fallback to headed browser               |
| **Excess API cost**          | Use cache + tiered model (mini → large)  |

---

## 8. Evaluation Strategy

### 8.1 Heuristic Evaluation

Metrics derived from Stagehand + logs:

* Successful load (DOM & canvas visible)
* Responsiveness (no JS errors)
* Stability (no navigation crash)
* Completion check (presence of “Game Over” or score UI)

`playability_score = 1 - (#issues / max(actions, 1))`

### 8.2 LLM Evaluation (Optional)

Using **Vercel AI SDK**:

* Input: summarized logs, screenshots (base64), DOM snapshot
* Output: `{playability_score, issues[], confidence}`
* Fallback: heuristic if model unavailable

**Prompt Template Example:**

```
System: You are a QA expert analyzing browser game test sessions.
User: Analyze these screenshots and logs for playability issues.
Data: <screenshots + console log excerpts>
```

---

## 9. Project Layout

```
qa-agent/
├─ bun.lockb
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ cli.ts
│  ├─ config.ts
│  ├─ browser.ts
│  ├─ interaction.ts
│  ├─ capture.ts
│  ├─ evaluation.ts
│  ├─ reporter.ts
│  ├─ utils/
│  │  ├─ logger.ts
│  │  └─ time.ts
├─ results/
│  └─ session_<timestamp>/
└─ configs/
   └─ example.tictactoe.json
```

---

## 10. Key Dependencies

| Package                    | Purpose                         |
| -------------------------- | ------------------------------- |
| `@browserbasehq/stagehand` | Browser automation and sessions |
| `commander`                | CLI parsing                     |
| `zod`                      | Config validation               |
| `vercel/ai`                | AI-based evaluation             |
| `chalk` / `ora`            | CLI UX                          |
| `bun`                      | Runtime and task runner         |
| `fs-extra`                 | File I/O utilities              |

Install example:

```bash
bun add @browserbasehq/stagehand commander zod fs-extra chalk ora
bun add -d typescript @types/node
```

---

## 11. Development Phases

| Phase                     | Focus                                                   | Deliverables        |
| ------------------------- | ------------------------------------------------------- | ------------------- |
| **1. MVP Vertical Slice** | CLI → BrowserBase → actions → screenshots → JSON output | ✅                   |
| **2. Resilience Layer**   | Retry logic, timeouts, error taxonomy                   | Robust core         |
| **3. Evidence Layer**     | Screenshots, console logs, timings                      | Observability       |
| **4. AI Evaluation**      | Integrate Vercel AI SDK                                 | Intelligent scoring |
| **5. Dashboard & CI**     | Results web viewer, Dockerfile                          | Visualization       |
| **6. Agentic Expansion**  | LLM chooses next actions                                | Adaptive QA         |

---

## 12. Example CLI Flow

```bash
# Run a simple tic-tac-toe test
qa-agent test https://itch.io/tic-tac-toe --config ./configs/example.tictactoe.json

# Output
✅ SUCCESS | Score: 0.92 | Issues: 1 | Duration: 2m15s
→ results/session_20251103_1725/output.json
```

---

## 13. Future Extensions

* **Video capture** using BrowserBase replay API
* **Visual diff** between versions (detect regressions)
* **Web dashboard** to visualize sessions, issues, scores
* **Agent loop** for dynamic exploration (adaptive play)
* **CI/CD integration** via GitHub Actions or Vercel Cron Jobs

---

Would you like me to produce the **Phase 1 breakdown** (TypeScript version) next — i.e. file-by-file tasks to get a working vertical slice: CLI → Stagehand session → run actions → capture screenshot → output JSON?
