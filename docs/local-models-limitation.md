# Local Models Limitation

## Summary

Stagehand does not support local models (via Ollama) for the default model configuration used by `act()` and `observe()` operations.

## Why

Stagehand validates model names against a hardcoded whitelist of supported cloud models, even when using a custom `baseURL`. This validation occurs before any API calls, so routing to Ollama via `baseURL` cannot bypass it.

## Supported Models

Stagehand only accepts models from its whitelist:
- OpenAI: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, etc.
- Anthropic: `claude-3-5-sonnet-latest`, `claude-3-7-sonnet-latest`, etc.
- Google: `gemini-2.0-flash`, `gemini-2.5-flash`, etc.
- Other providers: See Stagehand docs for complete list

## Workarounds

1. **Use cloud models** - The default approach. Use `"openai/gpt-4o-mini"` or similar in `stagehandModel` config.

2. **Custom LLM client** - Use Stagehand's `llmClient` option with Vercel AI SDK to bypass validation. This requires:
   - Installing `@ai-sdk/openai` or similar
   - Creating a custom client wrapper
   - More complex implementation

## Current Status

The `stagehandModel` config field exists and supports Ollama syntax (`ollama/...`), but Stagehand will reject it during initialization. The code is left in place for potential future use if Stagehand adds local model support.

## References

- Stagehand docs: https://docs.stagehand.dev/v3/configuration/models
- Error message lists all supported models at runtime

