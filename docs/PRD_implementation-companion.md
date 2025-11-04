# Stagehand features we should use (and how)

## 1) Act (natural-language actions) — core driver

* **What:** Execute a single UI action with NL prompts (“click the start button”, “press the right arrow”, “type ‘abc’ in name field”). In v3, `act` is called on the **Stagehand instance** (not `page`), accepts a string, and supports per-call model/timeouts. Automatic iframe handling. 
* **How we’ll use it:**

  * Map the control schema you receive (e.g., *Jump*, *MoveHorizontal*, *Move2D*) to **deterministic prompts** like:

    * “click the **Start** button” (menus)
    * “press the **ArrowRight** key 5 times” (movement)
    * “type **w** to jump” (if the game binds keys)
  * For reliability/cost: first try **observe→act** (below) to avoid an LLM round trip; if that fails, fall back to **free-form `act`**. 

**Example**

```ts
await stagehand.act("click the start button", { timeout: 10_000 });
await stagehand.act("press the ArrowRight key"); // key actions via NL
```

(Act on stagehand; simplified v3 signature; timeouts and model overrides supported.) 

---

## 2) Observe (plan once, run deterministically)

* **What:** Discover actionable elements & suggested methods (click/fill) and return a **selector + method** bundle you can reuse **without** extra LLM calls. Automatic iframe support in v3.  
* **How we’ll use it:**

  1. **Plan**: `observe("find the start/play button")`
  2. **Cache** the returned `action` (selector+method)
  3. **Execute** `stagehand.act(action)` (no new LLM call)
  4. On failure, **self-heal**: re-observe or fall back to NL `act`.
* **Why:** Much more **deterministic** (selectors + methods) and **cheaper** across retries/runs. 

**Example**

```ts
const [startBtn] = await stagehand.observe("find the start/play button");
await stagehand.act(startBtn); // no new LLM call
```

(Observe→Act pattern; supports scoping with `selector` in v3 when needed.) 

---

## 3) Extract (LLM + Zod) — structured checks & heuristics

* **What:** Extract typed data using a Zod schema or simple instructions; in v3 it’s called on `stagehand` and supports scoping to a selector to **reduce tokens/cost**.  
* **How we’ll use it:**

  * Pull **HUD text** (score, “Game Over”, “Paused”), and **state flags** (“Play button visible?”) for playability evaluation.
  * Use **scoped extraction** (after an `observe` finds the HUD container) to cut DOM size. 
* **Bonus:** Schema design best-practices (descriptive fields, correct types) improve accuracy. 

**Example**

```ts
const HudSchema = z.object({ gameOver: z.boolean(), score: z.number().optional() });
const hud = await stagehand.extract("read HUD state", HudSchema, { selector: "#hud" });
```

---

## 4) Agent (multi-step automation) — future “plays a level” mode

* **What:** An autonomous workflow runner; in v3 you configure `model`, optional `executionModel` (cheaper model for tool steps), `systemPrompt`, and `maxSteps`. You can also run agents on a **specific page** and enable **CUA** (computer-use agent) when appropriate. 
* **How we’ll use it (later phase):**

  * Give the agent high-level instructions (“load, start a game, reach level 2, take a screenshot on win”). Limit with `maxSteps`, and set `executionModel` to keep costs down. 
* **Now:** We’ll stick to **config-driven** steps; agents are reserved for stretch “agentic play.”

### 🧩 **Key Moments to Screenshot**

#### 1. **Initial Load / Ready State**

* After the game finishes loading or displays the start/menu screen.
* Confirms that assets load properly and UI elements are visible.
* Useful for catching blank-screen or “stuck loading” bugs.

```ts
await page.screenshot({ path: "start_screen.png", fullPage: true });
```

---

#### 2. **Post-Action Snapshots**

* Immediately after major input events:

  * First successful interaction (e.g. “Start Game” button)
  * First gameplay movement or input response
  * After completing a specific “mission” or user task
* Confirms input responsiveness and progression.

```ts
await page.screenshot({ path: "first_action.png" });
```

---

#### 3. **Game Over / Victory / End State**

* When the HUD or UI displays “Game Over”, “You Win”, “Level Complete”, etc.
* Crucial for verifying end conditions, scoring systems, and stable shutdown.

```ts
await page.screenshot({ path: "game_over.png" });
```

---

#### 4. **Error or Timeout**

* On any detected issue: crash, freeze, console error, or timeout.
* Captures the context of the failure for debugging.

```ts
await page.screenshot({ path: "error_state.png" });
```

---

#### 5. **Optional – Dynamic Checkpoints**

*(1–2 optional depending on game type)*

* Mid-game (e.g., after 50% of scripted actions) to confirm stability.
* At pause/menu overlays, to verify scene stack behavior.

---

### 📊 **Recommended Screenshot Budget**

| Type         | Count | Purpose                         |
| ------------ | ----- | ------------------------------- |
| Initial load | 1     | Verify game loads & displays UI |
| Mid-action   | 1–2   | Confirm input responsiveness    |
| End/Result   | 1     | Verify win/loss conditions      |
| On error     | 1     | Debugging evidence              |

→ **Total:** *~3–5 per test run*, usually < 2 MB combined (PNG compressed).

---

### 🧠 **Automation Rule**

Implement a small helper that decides when to capture:

```ts
if (stage === "load" || stage === "error" || stage === "end" || stageIndex % 5 === 0)
  await takeScreenshot(stage);
```

This keeps your QA evidence **meaningful**, **compact**, and **consistent across runs**, while still giving the LLM evaluator enough visual context to judge playability.


---

## 5) Caching & deterministic runs

* **What:** v3 replaces `enableCaching` with `cacheDir`. We can pre-warm & commit cache for CI, implement **versioned caches**, and clear old ones for consistency. Also: **observe-result caching** (selector+method) avoids repeated LLM calls; **self-healing** falls back to fresh calls if a cached action breaks.  
* **How we’ll use it:**

  * Set `cacheDir: "cache/qa-workflow-v1"`.
  * **Commit** a stable cache for CI (or version bump to invalidate). 
  * Add a tiny `actWithCache(prompt, { selfHeal: true })` helper. 

**Example**

```ts
const stagehand = new Stagehand({ env: "BROWSERBASE", cacheDir: "cache/qa-workflow-v1" });
```

(Deterministic CI via cached/committed artifacts; versioned cleanup.) 

---

## 6) Computer-Use Agents (CUA) & execution model tuning (FUTURE STRETCH GOAL)

* **What:** Turn on `cua: true` for models that support full computer-use; pick a **cheaper/faster `executionModel`** for tool steps (act/observe/extract) while keeping a stronger reasoning model for planning. 
* **How we’ll use it:**

  * Only when we graduate to **agentic play**; for QA MVP we stick to deterministic steps but *do* use `executionModel` in agents to control cost/latency. 

---

## 7) MCP integrations (for enrichment when needed, FUTURE STRETCH GOAL)

* **What:** Stagehand supports **MCP** to connect external tools (e.g., Exa search). Useful for discovery or fetching reference rules before acting. 
* **How we’ll use it (optional):**

  * For research-style prep (e.g., “open the provided example game list, then choose one”), not necessary for the core QA loop.

---

## 8) Observability: metrics, history, live view

* **What:** v3 **Metrics** and **History** are **async** getters; Browserbase exposes Session URLs for live/debug viewing. Use these for **token/cost accounting** and per-step introspection. 
* **How we’ll use it:**

  * Record `totalPromptTokens`/`totalCompletionTokens` per run for cost dashboards.
  * Persist a compact “action history” alongside screenshots/logs in the session folder.

---

## 9) Optimizing DOM processing (cost, speed, accuracy)

* **Scope extraction with selectors** (after `observe`) to cut token load during `extract`. 10x reductions are common when you avoid full-page trees. 
* **Prefer observe→act** over free-form `act` whenever possible to run **without LLM calls**. 
* **Automatic iframes** in v3 means fewer knobs and fewer retries across iframe-heavy games. 
* (If a page is extremely noisy) we can **hide/remove non-essential DOM** before extraction (e.g., ads), but the big win is still **scoping** via selector from `observe`. 

---

## 10) Prompting best practices for robustness

* **Refer to element **types/roles/functions**, not visual traits. E.g., “click the **Start** button in the HUD overlay” instead of “click the **green** button on the top right.” (Stagehand docs emphasize action verbs + descriptive language.) 
* **Use crisp verbs**: *click*, *press*, *type*, *focus*, *open*, *close*, *submit*. 
* **Be explicit with scope**: “in the **menu panel**,” “inside the **dialog**,” or “within `#hud`.” Combine with `observe`→`selector` scoping for extraction. 
* **Break up multi-step intents** into single actions (the docs caution against “do three things at once” prompts). 
* **Use variables** safely for secrets (passwords) in `act` so sensitive data isn’t sent to the LLM. 

---

# How this maps to your QA pipeline

1. **Load & baseline**

   * Start Stagehand (BROWSERBASE env), go to game URL, take baseline screenshot. (From DreamUp brief.) 
2. **Plan controls via schema**

   * Convert provided **Actions/Axes** into deterministic prompts (clicks/keypresses). Prefer **observe→act** & cache. 
3. **Execute test script**

   * Enforce per-action/total timeouts, retries (up to 3). Record issues (load timeout, element missing, action timeout). (From DreamUp brief.) 
4. **Evidence capture**

   * Save 3–5 screenshots, console logs, any errors. (From DreamUp brief.) 
5. **Evaluate**

   * Use `extract` (scoped) to detect HUD states (e.g., *Game Over*, score). Send screenshots/log excerpts to LLM evaluator and fall back to heuristics. (From DreamUp brief + Extract.)  
6. **Report**

   * Output `{status, playability_score, issues[], screenshots[], timestamp}` and persist metrics/costs. (From DreamUp brief + Metrics API.)  

---

# Guardrails & fallbacks we’ll implement

* **Observe→Act cached**; on failure **self-heal** with fresh NL `act`. 
* **Max steps** & **total timeout** to prevent loops; retry failed loads up to 3×. (From DreamUp brief.) 
* **Headless→headed fallback** if a DOM game misbehaves in headless (from brief). 
* **LLM evaluator fallback** to heuristics if the model call fails. 
* **Versioned cacheDir** + cleanup policy for deterministic CI and predictable cost. 
