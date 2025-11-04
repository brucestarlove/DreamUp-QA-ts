# CUA Optimization Guide

## Agent Instance Reuse

✅ **Already Optimized:** The CUA agent is created once per test session and reused for all actions. This is handled automatically - the `CUAManager` class initializes the agent once and reuses it.

## Determining `cuaMaxSteps` Per Game

### Understanding CUA Steps

CUA agents need multiple steps to complete a click action:
1. **Step 1**: Take screenshot to see current state
2. **Step 2**: Click the target element
3. **Step 3**: Take screenshot to confirm click worked

**Minimum:** 2-3 steps (some agents can skip confirmation)

### Recommended Settings

| Game Type | cuaMaxSteps | Rationale |
|-----------|-------------|-----------|
| **Simple puzzle games** (Tic Tac Toe, Connect 4) | 3 | Standard: screenshot → click → confirm |
| **Canvas games** (HTML5 games, Flash-like) | 3-5 | May need extra steps to locate elements visually |
| **Complex games** (RPGs, platformers) | 5-10 | Multiple screens/UI layers, navigation needed |
| **Menu/button interactions** | 2-3 | Simple UI elements, fast confirmation |

### When to Increase `cuaMaxSteps`

Increase if:
- ✅ Agent fails to click (needs more exploration)
- ✅ Game has multiple UI layers (menus, overlays)
- ✅ Agent needs to navigate before clicking
- ✅ Complex visual elements require multiple attempts

### When to Decrease `cuaMaxSteps`

Decrease if:
- ✅ Agent is looping unnecessarily
- ✅ Simple single-click actions
- ✅ Cost optimization needed (fewer steps = lower cost)

### Configuration Examples

**Simple game (Tic Tac Toe):**
```json
{
  "useCUA": false,
  "cuaMaxSteps": 3,
  "sequence": [
    { "action": "click", "target": "center square", "useCUA": true }
  ]
}
```

**Complex game:**
```json
{
  "useCUA": false,
  "cuaMaxSteps": 5,
  "sequence": [
    { "action": "click", "target": "start menu button", "useCUA": true },
    { "action": "click", "target": "navigate to level select", "useCUA": true }
  ]
}
```

## Cost Optimization

**CUA costs more than DOM-based actions:**
- Each step = 1 screenshot + LLM call
- 3 steps ≈ 3x the cost of a single DOM action

**Best Practice:**
- Use per-action `useCUA: true` only for inaccessible elements
- Use DOM-based for menus, buttons, dialogs (accessible)
- Track usage in output.json to monitor costs

## Per-Action CUA Override

Use per-action flags to optimize:

```json
{
  "useCUA": false,  // Default: DOM-based
  "sequence": [
    { "action": "click", "target": "start button" },  // DOM (accessible)
    { "action": "click", "target": "game cell", "useCUA": true },  // CUA (inaccessible)
    { "action": "click", "target": "settings menu" }  // DOM (accessible)
  ]
}
```

This minimizes CUA usage and costs while ensuring inaccessible elements work.

## Total Timeout

**Default:** 45 seconds (45000ms)

This limits total test execution time. Adjust based on:
- Game complexity
- Number of actions
- Expected CUA step count

**Formula:** `totalTimeout ≥ (actionCount × avgActionTime) + buffer`

For 10 actions with 3-step CUA clicks:
- 10 × 5s = 50s minimum
- Set `total: 60000` (60s) for safety

