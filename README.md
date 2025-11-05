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

- `wait`: Wait for specified milliseconds
  ```json
  { "wait": 2000 }
  ```

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

### Example (`configs/example.json`)
- General-purpose platformer config
- Showcases controls mapping with Jump action
- Good starting point for custom configs

**Usage:**
```bash
bun run src/cli.ts test https://example.com/snake --config ./configs/snake.json
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

