# Testing Guide

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables Set**:
   ```bash
   export BROWSERBASE_API_KEY="your-api-key"
   export BROWSERBASE_PROJECT_ID="your-project-id"
   export OPENAI_API_KEY="your-openai-key"  # Required for Stagehand LLM operations and LLM evaluation
   ```

2. **Dependencies Installed**:
   ```bash
   bun install
   ```

## Quick Test

### Test 1: Basic CLI Help
```bash
bun run src/cli.ts --help
bun run src/cli.ts test --help
```

### Test 2: Simple Game Test (with default config)
```bash
# Test with a simple HTML5 game (no config needed - uses defaults)
bun run src/cli.ts test https://example.com

# Or with a real game URL
bun run src/cli.ts test https://itch.io/game-url
```

### Test 3: Test with Config File
```bash
# Use the example config
bun run src/cli.ts test https://example.com --config ./configs/example.json

# Use game-specific configs
bun run src/cli.ts test https://example.com/snake --config ./configs/snake.json
bun run src/cli.ts test https://example.com/pong --config ./configs/pong.json
```

### Test 4: Test with Headed Browser (for debugging)
```bash
bun run src/cli.ts test https://example.com --config ./configs/example.json --headed
```

### Test 5: Test with LLM Evaluation
```bash
# Enable LLM-based evaluation (uses OpenAI to analyze screenshots and logs)
bun run src/cli.ts test https://example.com --config ./configs/example.json --llm

# Use a specific LLM model for evaluation
bun run src/cli.ts test https://example.com --config ./configs/example.json --llm --model gpt-4o

# Use a cheaper model for evaluation (default: gpt-4o-mini)
bun run src/cli.ts test https://example.com --config ./configs/example.json --llm --model gpt-4o-mini
```

### Test 6: Test with Custom Output Directory
```bash
# Save results to a custom directory
bun run src/cli.ts test https://example.com --config ./configs/example.json --output-dir ./my-results
```

### Test 7: Test with Agent Actions (via Config)
```bash
# Use a config with agent actions (autonomous gameplay)
# Example: configs/playtictactoe-agent.json
bun run src/cli.ts test https://example.com/tictactoe --config ./configs/playtictactoe-agent.json

# Agent actions use Computer Use Agent (CUA) for visual-based interactions
# Requires OPENAI_API_KEY and CUA model support
```

## CLI Options

Full list of available options:

- `-c, --config <file>` - Path to config file (JSON)
- `--headed` - Run in visible browser mode (for debugging)
- `--retries <number>` - Number of retries for page load (default: 3)
- `-o, --output-dir <dir>` - Output directory for results (default: `results`)
- `--llm` - Enable LLM-based evaluation (analyzes screenshots with OpenAI)
- `--model <model>` - Override LLM model for evaluation (e.g., `gpt-4o`, `gpt-4o-mini`)

## Expected Output

✅ **Success indicators:**
- CLI accepts arguments without errors
- Browser session initializes
- At least one action executes
- Screenshots are captured in `results/<session-id>/screenshots/`
- JSON output is generated at `results/<session-id>/output.json`
- Console logs are saved to `results/<session-id>/logs/console.log`

## Verification Checklist

After running a test, verify:

- [ ] `results/<session-id>/output.json` exists
- [ ] `results/<session-id>/screenshots/` contains at least 2 images (baseline + end)
- [ ] JSON output contains:
  - `status`: "pass" or "fail"
  - `playability_score`: number (0-1)
  - `issues`: array
  - `screenshots`: array of filenames
  - `timestamp`: ISO-8601 string
  - `test_duration`: number (seconds)
  - `evaluation`: object (if `--llm` was used)
    - `heuristic_score`: number
    - `llm_score`: number (if LLM evaluation enabled)
    - `llm_confidence`: number (if LLM evaluation enabled)
    - `final_score`: number
  - `llm_usage`: object (if CUA or LLM evaluation was used)
    - `totalCalls`: number
    - `totalTokens`: number
    - `estimatedCost`: number (USD)
  - `action_methods`: object (CUA vs DOM breakdown)
    - `cua`: number of CUA actions
    - `dom`: number of DOM-based actions
    - `none`: number of non-interactive actions
  - `agent_responses`: array (if agent actions were used)
- [ ] Console shows test summary with status, score, issues, duration
- [ ] If `--llm` was used, evaluation breakdown is shown
- [ ] If CUA was used, action method breakdown is shown

## Agent Actions & CUA (Computer Use Agent)

### Agent Actions

Agent actions enable autonomous multi-step gameplay. They're configured in JSON config files, not via CLI flags.

**Example config with agent action:**
```json
{
  "sequence": [
    { "action": "agent", "instruction": "play until win", "maxSteps": 20, "useCUA": true }
  ]
}
```

**CUA (Computer Use Agent):**
- Visual-based interactions using computer vision models
- Automatically enabled for agent actions with `useCUA: true`
- Can be enabled globally with `alwaysCUA: true` in config
- Can be enabled per-click action with `useCUA: true` on click actions
- Requires `OPENAI_API_KEY` and compatible CUA model

**CUA Usage:**
- Automatically initialized when needed
- Usage metrics tracked in output JSON
- Cost estimates included in results

## Unit & Integration Tests

The project includes comprehensive test suites:

### Run All Tests
```bash
bun test
```

### Run Unit Tests Only (Fast, no API keys needed)
```bash
bun test:unit
```

### Run Integration Tests Only (Requires API keys)
```bash
bun test:integration
```

### Watch Mode (Auto-rerun on file changes)
```bash
bun test:watch
```

**Test Coverage:**
- Unit tests: Config parser, controls, errors, retry logic, evaluation, reporter
- Integration tests: Full pipeline, error scenarios, screenshot capture, console logs

**Integration Test Requirements:**
- Requires `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, and `OPENAI_API_KEY`
- Tests are automatically skipped if API keys are missing

## Common Issues

**Issue**: "Session initialization failed"
- **Solution**: Check `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set

**Issue**: "Failed to load game URL"
- **Solution**: Verify the URL is accessible and try with `--headed` flag

**Issue**: "Action failed: element not found"
- **Solution**: This may occur if elements don't exist. Check the `issues` array in output.json. Consider:
  - Using `--headed` to see what's happening
  - Adding DOM optimization in config to hide distractions
  - Using CUA for complex visual elements (set `useCUA: true` on click actions)

**Issue**: "CUA initialization failed"
- **Solution**: Ensure `OPENAI_API_KEY` is set. CUA requires OpenAI API access.

**Issue**: "LLM evaluation failed"
- **Solution**: Ensure `OPENAI_API_KEY` is set and valid. Check API quota/billing.

**Issue**: "Test takes too long"
- **Solution**: 
  - Reduce `maxSteps` in agent actions
  - Lower `timeouts.total` in config
  - Use `--headed` only for debugging (adds overhead)

**Issue**: "High cost per test"
- **Solution**:
  - Use `--llm` only when needed (adds LLM evaluation cost)
  - Use CUA sparingly (more expensive than DOM-based actions)
  - Monitor `llm_usage.estimatedCost` in output JSON
  - Use `gpt-4o-mini` for evaluation (default, cheaper)

## Understanding Output JSON

### Key Fields

**`status`**: `"pass"` or `"fail"` - Overall test result

**`playability_score`**: 0.0 to 1.0 - Composite score combining:
- Action success rate
- Console errors/warnings
- Browser stability
- Game completion state
- LLM evaluation (if enabled)

**`evaluation`**: Detailed scoring breakdown (if `--llm` used):
- `heuristic_score`: Rule-based score (0-1)
- `llm_score`: LLM-based score (0-1)
- `llm_confidence`: LLM confidence (0-1)
- `final_score`: Weighted combination

**`action_methods`**: Breakdown of interaction methods:
- `cua`: Visual-based (Computer Use Agent)
- `dom`: DOM-based (accessibility tree)
- `none`: Non-interactive (wait, screenshot)

**`llm_usage`**: Token usage and cost tracking:
- `totalCalls`: Number of LLM API calls
- `totalTokens`: Total tokens consumed
- `estimatedCost`: Estimated cost in USD

**`agent_responses`**: Agent action results (if agent actions used):
- `message`: Agent's completion message
- `stepsExecuted`: Number of steps taken
- `success`: Whether agent reported success

## Next Steps

Once basic tests pass, you can:
- Enable LLM evaluation for deeper analysis (`--llm`)
- Use agent actions for autonomous gameplay (configure in JSON)
- Enable CUA for visual-based interactions (complex UIs)
- Review test coverage and metrics in output JSON
- Customize configs for different game types

