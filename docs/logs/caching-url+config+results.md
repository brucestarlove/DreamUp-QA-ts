Showing the caching implementation:


[3 tools called]

## How the Cache Works:

1. **Cache Key Generation** (lines 89-107):
   - Creates a unique filename by hashing three inputs:
     - Game URL → `urlHash`
     - Config sequence + metadata → `configHash`
     - Action results summary (success/failure per action) → `resultsHash`
   - Result: `{urlHash}-{configHash}-{resultsHash}.json`
   - Example: `a1b2c3d4-e5f6g7h8-i9j0k1l2.json`

2. **24-Hour Expiry** (line 73):
   - `CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000` (24 hours)
   - On cache read, checks if the file is older than 24 hours
   - If expired, treats it as a cache miss

3. **Cache Usage Flow** (lines 464-493):
   - Before calling the LLM:
     - Generates the cache key
     - Checks for a cached file
     - If found and not expired, uses the cached result
   - After calling the LLM:
     - Saves the result to the cache file

## Why This Matters:

- Same game URL + same config + same action results = same cache key
- Avoids redundant LLM API calls when re-running the same test
- Saves cost and time
- Cache expires after 24 hours to allow for game/config updates

## Example:

If you run the same test twice:
1. First run: Calls OpenAI API → saves to `cache/llm-evaluations/abc123-def456-ghi789.json`
2. Second run (within 24h): Finds cached file → uses it → no API call

The cache is stored in `cache/llm-evaluations/` and should be added to `.gitignore` (it's already there).
