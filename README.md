# QA Agent for Browser-Generated Web Games

Agent-driven browser game QA system built with Stagehand v3, BrowserBase, and TypeScript.

## Overview

This tool autonomously tests browser-based games by:
- Launching headless browser sessions via BrowserBase
- Simulating gameplay interactions
- Capturing screenshots and logs
- Evaluating playability
- Outputting structured JSON reports

## Installation

```bash
bun install
```

## Usage

```bash
bun run src/cli.ts test <game-url> [options]
```

### Options

- `-c, --config <file>` - Path to config file
- `--headed` - Run in visible browser mode
- `--retries <number>` - Number of retries for page load (default: 3)
- `-o, --output-dir <dir>` - Output directory for results (default: results)
- `--llm` - Enable LLM-based evaluation (future)
- `--model <model>` - Override LLM model (future)

### Example

```bash
bun run src/cli.ts test https://example.com/game --config ./configs/example.json
```

## Configuration

Create a JSON config file with the following structure:

```json
{
  "controls": {
    "MoveUp": ["ArrowUp", "KeyW"],
    "MoveDown": ["ArrowDown", "KeyS"],
    "MoveRight": ["ArrowRight", "KeyD"],
    "Jump": ["Space"]
  },
  "sequence": [
    { "action": "click", "target": "start button" },
    { "action": "press", "key": "MoveRight", "repeat": 5, "delay": 100 },
    { "wait": 2000 },
    { "action": "screenshot" }
  ],
  "timeouts": {
    "load": 30000,
    "action": 10000,
    "total": 60000
  },
  "retries": 3,
  "domOptimization": {
    "hideSelectors": ["div[class*='sidebar']", "nav"],
    "removeSelectors": ["div[id*='popup']"]
  }
}
```

### Controls Mapping (Optional)

Map high-level game actions to keyboard keys. This allows you to use action names (like `"MoveRight"`) in sequences instead of raw key names, and supports multiple key bindings per action.

```json
{
  "controls": {
    "MoveUp": ["ArrowUp", "KeyW"],
    "MoveDown": ["ArrowDown", "KeyS"],
    "MoveLeft": ["ArrowLeft", "KeyA"],
    "MoveRight": ["ArrowRight", "KeyD"],
    "Jump": ["Space", "KeyW"],
    "Action": ["Enter"],
    "Pause": ["Escape"]
  }
}
```

**Supported Action Types:**
- `MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight` - Directional movement
- `Jump`, `Action`, `Confirm`, `Cancel` - Common game actions
- `Pause`, `Start` - Menu controls

**Key Aliases:**
The system automatically resolves common key aliases:
- `Up` → `ArrowUp`, `Down` → `ArrowDown`, `Left` → `ArrowLeft`, `Right` → `ArrowRight`
- `W` → `KeyW`, `A` → `KeyA`, `S` → `KeyS`, `D` → `KeyD`
- `Space` → `Space`, `Enter` → `Enter`, `Esc` → `Escape`

### Action Types

- `click`: Click an element using natural language (game-agnostic)
  ```json
  { "action": "click", "target": "start button" }
  ```
  
  The system tries multiple phrasings automatically:
  - "start button" → also tries "play button", "begin button", etc.
  - "restart button" → also tries "play again button", "retry button", etc.

- `press`: Press a key with advanced options
  
  **Basic press:**
  ```json
  { "action": "press", "key": "ArrowRight", "repeat": 5 }
  ```
  
  **With action reference (from controls mapping):**
  ```json
  { "action": "press", "key": "MoveRight", "repeat": 5 }
  ```
  
  **With custom delay between presses:**
  ```json
  { "action": "press", "key": "ArrowRight", "repeat": 5, "delay": 200 }
  ```
  
  **Key hold (simulated with rapid presses):**
  ```json
  { "action": "press", "key": "Space", "duration": 1000 }
  ```
  
  **Key alternation (e.g., for PONG paddle movement):**
  ```json
  { "action": "press", "alternateKeys": ["MoveUp", "MoveDown"], "repeat": 10, "delay": 300 }
  ```
  
  **Options:**
  - `key` - Key name or action reference (e.g., "ArrowRight" or "MoveRight")
  - `repeat` - Number of times to press (default: 1)
  - `delay` - Delay between presses in milliseconds (default: 50ms)
  - `duration` - Hold key for duration (simulated with rapid presses)
  - `alternateKeys` - Array of keys to alternate between

- `screenshot`: Take a screenshot
  ```json
  { "action": "screenshot" }
  ```

- `axis`: Simulate continuous axis input (1D or 2D)
  
  **Horizontal axis (move right):**
  ```json
  { "action": "axis", "direction": "horizontal", "value": 1.0, "duration": 1000 }
  ```
  
  **Horizontal axis (move left):**
  ```json
  { "action": "axis", "direction": "horizontal", "value": -1.0, "duration": 1000 }
  ```
  
  **Vertical axis (move up):**
  ```json
  { "action": "axis", "direction": "vertical", "value": 1.0, "duration": 1000 }
  ```
  
  **2D diagonal movement:**
  ```json
  { "action": "axis", "direction": "2d", "value": 1.0, "duration": 800 }
  ```
  
  **With explicit keys:**
  ```json
  { "action": "axis", "direction": "horizontal", "keys": ["ArrowRight"], "duration": 1000 }
  ```
  
  **Options:**
  - `direction` - Axis direction: "horizontal", "vertical", or "2d"
  - `value` - Axis value from -1.0 to 1.0 (default: 1.0)
    - Horizontal: 1.0 = right, -1.0 = left
    - Vertical: 1.0 = up, -1.0 = down
    - 2D: 1.0 = up-right diagonal, -1.0 = down-left diagonal
  - `duration` - Duration in milliseconds (max: 10000ms)
  - `keys` - Optional: explicit keys to use (otherwise derived from controls)
  - `timeout` - Optional: per-action timeout override

- `wait`: Wait for specified milliseconds
  ```json
  { "wait": 2000 }
  ```

### Per-Action Overrides

All action types support optional per-action configuration overrides:

- **Timeout Override:** Override the default action timeout for specific actions
  ```json
  { "action": "click", "target": "start button", "timeout": 15000 }
  ```

- **Model Override (click actions):** Use a different AI model for specific actions
  ```json
  { "action": "click", "target": "complex menu", "model": "openai/gpt-4o" }
  ```

These overrides are useful for actions that need more time (complex UI) or better accuracy (difficult element detection).

### DOM Optimization

Optionally hide or remove non-game elements to improve action reliability:

- `hideSelectors`: Array of CSS selectors to hide (preserves layout)
- `removeSelectors`: Array of CSS selectors to remove completely

Default behavior: Common ad elements are automatically hidden. Add custom selectors for game-specific elements.

```json
{
  "domOptimization": {
    "hideSelectors": ["div[class*='sidebar']", "nav", "header"],
    "removeSelectors": ["div[id*='popup']"]
  }
}
```

## Output

Results are written to `results/<session-id>/output.json`:

```json
{
  "status": "pass",
  "playability_score": 0.92,
  "issues": [],
  "screenshots": ["baseline.png", "end.png"],
  "timestamp": "2025-01-15T12:00:00Z",
  "test_duration": 45
}
```

## Environment Variables

- `BROWSERBASE_API_KEY` - BrowserBase API key (required)
- `BROWSERBASE_PROJECT_ID` - BrowserBase project ID (required)
- `OPENAI_API_KEY` - OpenAI API key (required for Stagehand LLM operations)

## Example Game Configs

The project includes pre-built configs for common game types:

### Snake (`configs/snake.json`)
- Supports Arrow keys and WASD
- Tests directional movement in all four directions
- Includes timing delays between moves

### Pong (`configs/pong.json`)
- Supports Up/Down controls for paddle
- Tests vertical movement and key alternation
- Demonstrates alternating key presses for realistic paddle movement

### Platformer (`configs/platformer.json`)
- Advanced platformer config with axis actions
- Demonstrates continuous horizontal movement
- Shows 2D diagonal movement (up-right)
- Combines axis actions with jump mechanics

### Example (`configs/example.json`)
- General-purpose platformer config
- Showcases controls mapping with Jump action
- Good starting point for custom configs

**Usage:**
```bash
# Test Snake game
bun run src/cli.ts test https://example.com/snake --config ./configs/snake.json

# Test Platformer with axis controls
bun run src/cli.ts test https://example.com/platformer --config ./configs/platformer.json
```

## Development

```bash
# Run in development mode with watch
bun run dev

# Run tests
bun test
```

## License

MIT

