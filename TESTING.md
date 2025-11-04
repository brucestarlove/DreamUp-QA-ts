# Phase 1 Testing Guide

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables Set**:
   ```bash
   export BROWSERBASE_API_KEY="your-api-key"
   export BROWSERBASE_PROJECT_ID="your-project-id"
   export OPENAI_API_KEY="your-openai-key"  # Required for Stagehand LLM operations
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
```

### Test 4: Test with Headed Browser (for debugging)
```bash
bun run src/cli.ts test https://example.com --config ./configs/example.json --headed
```

## Expected Output

✅ **Success indicators:**
- CLI accepts arguments without errors
- Browser session initializes
- At least one action executes
- Screenshots are captured in `results/<session-id>/screenshots/`
- JSON output is generated at `results/<session-id>/output.json`

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
- [ ] Console shows test summary with status, score, issues, duration

## Common Issues

**Issue**: "Session initialization failed"
- **Solution**: Check `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set

**Issue**: "Failed to load game URL"
- **Solution**: Verify the URL is accessible and try with `--headed` flag

**Issue**: "Action failed: element not found"
- **Solution**: This is expected for Phase 1 - actions may fail if elements don't exist. Check the `issues` array in output.json

## Next Steps

Once Phase 1 tests pass, you're ready for:
- Phase 2: Resilience Layer (retries, better error handling)
- Phase 3: Evidence Layer (console logs, better screenshots)

