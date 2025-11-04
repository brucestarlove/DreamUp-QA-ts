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
  "sequence": [
    { "action": "click", "target": "start button" },
    { "action": "press", "key": "ArrowRight", "repeat": 5 },
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

### Action Types

- `click`: Click an element using natural language
  ```json
  { "action": "click", "target": "start button" }
  ```

- `press`: Press a key (optionally repeated)
  ```json
  { "action": "press", "key": "ArrowRight", "repeat": 5 }
  ```

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

## Development

```bash
# Run in development mode with watch
bun run dev

# Run tests
bun test
```

## License

MIT

