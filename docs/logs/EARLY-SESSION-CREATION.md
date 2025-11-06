# Early Session Creation Implementation

## Problem
Test sessions didn't appear in the dashboard until the test completed and `output.json` was written. This meant:
- No visibility into running tests
- Screenshots couldn't be viewed in real-time
- Users couldn't tell if a test had started or not

## Solution
Create a minimal `output.json` at the **start** of each test, then update it when the test completes.

## Changes Made

### 1. CLI Changes (`src/cli.ts`)
- Added `writeInitialResult` import
- Call `writeInitialResult()` immediately after creating the session directory
- This creates a placeholder `output.json` with:
  - `url` (game URL)
  - `config_path` (if provided)
  - `timestamp` (start time)
  - Placeholder `status`, `playability_score`, empty `issues` and `screenshots`

```typescript
// Write initial output.json so the session appears in the dashboard immediately
writeInitialResult(gameUrl, sessionDir, options.config);
```

### 2. Reporter Changes (`src/reporter.ts`)
- Added new `writeInitialResult()` function
- Creates minimal JSON structure with just the essential fields
- Full result still written at completion via existing `writeResult()`

### 3. UI Changes

#### SessionCard (`src/components/sessions/SessionCard.tsx`)
- Detects running state: `!result || !result.test_duration`
- Shows "RUNNING" badge with spinner icon
- Displays placeholder text for in-progress tests

#### SessionDetail (`src/components/sessions/SessionDetail.tsx`)
- Shows dedicated "Test in Progress" view for incomplete tests
- Displays:
  - Animated "RUNNING" badge
  - Game URL and config
  - Start timestamp
  - Live screenshot grid (updates as screenshots are captured)
  - Spinner with "Waiting for test to complete..." message

### 4. Data Layer (`src/lib/data/sessions.ts`)
- Modified `readSessionResult()` to silently ignore `ENOENT` errors
- Missing `output.json` returns `null` (instead of logging errors)
- Comments clarify this is expected for running tests

## How It Works Now

### Test Lifecycle:
1. **Test starts** → CLI creates session directory
2. **Immediately** → `writeInitialResult()` creates minimal `output.json`
3. **SSE fires** → `session_updated` event
4. **Dashboard updates** → Session appears in sidebar with "RUNNING" badge
5. **Screenshots captured** → SSE fires `screenshot_added` events
6. **Dashboard updates** → Screenshots appear in real-time (if viewing that session)
7. **Test completes** → `writeResult()` overwrites `output.json` with full results
8. **SSE fires** → `session_updated` event
9. **Dashboard updates** → Session shows final status, scores, and metrics

### Detection Logic:
A test is considered "running" if:
- `!result` (no output.json yet) OR
- `!result.test_duration` (output.json exists but incomplete)

This covers both old sessions (pre-implementation) and new sessions (with placeholder).

## Benefits

✅ **Immediate visibility** - Sessions appear instantly when test starts
✅ **Real-time screenshots** - Watch screenshots appear as they're captured
✅ **Better UX** - Clear indication of test progress with spinner and status
✅ **No breaking changes** - Existing completed sessions work unchanged
✅ **Graceful handling** - Missing files don't spam error logs

## Testing

To test this feature:
1. Start the dashboard: `bun dev`
2. Open browser to dashboard
3. In another terminal: `bun start test <url> --config <config>`
4. Observe:
   - Session appears immediately in sidebar with "RUNNING" badge
   - Click session to see "Test in Progress" view
   - Screenshots appear in real-time as they're captured
   - When test completes, full metrics and results appear

## Files Modified
- `src/cli.ts` - Added initial result writing
- `src/reporter.ts` - Added `writeInitialResult()` function
- `src/lib/data/sessions.ts` - Graceful ENOENT handling
- `src/components/sessions/SessionCard.tsx` - Running state detection and UI
- `src/components/sessions/SessionDetail.tsx` - In-progress test view

