# Run Test Button Investigation & Fix

**Date**: November 6, 2025  
**Issue**: "Run Test" button appears to not be running the CLI  
**Status**: ✅ RESOLVED

## Investigation Summary

The "Run Test" button **WAS** working and calling the CLI correctly, but there was **no visibility** into what was happening. The process was spawning with `stdio: 'ignore'`, making it impossible to debug failures.

## Architecture Flow

```
User clicks "Run Test" 
  ↓
TopBar.handleRunTest() 
  ↓
POST /api/test/run 
  ↓
spawn('bun', ['run', 'src/cli.ts', 'test', <gameUrl>, ...args])
  ↓
CLI executes test sequence
  ↓
Results written to results/<sessionId>/output.json
  ↓
Dashboard auto-refreshes and displays results
```

## What Was Fixed

### 1. **Added Comprehensive Logging**

**File**: `app/api/test/run/route.ts`

- Changed `stdio: 'ignore'` → `stdio: ['ignore', 'pipe', 'pipe']`
- Now captures `stdout` and `stderr` from the CLI process
- Creates log files in `logs/spawn-<timestamp>.log` for each test run
- Logs include:
  - Command executed
  - Working directory
  - Game URL
  - All CLI output (stdout/stderr)
  - Process exit codes
  - Spawn errors

**Example log file** (`logs/spawn-2025-11-06T12-34-56.log`):
```
[2025-11-06T12:34:56.123Z] Spawning: bun run src/cli.ts test https://example.com/game
[2025-11-06T12:34:56.124Z] CWD: /Users/bdr/Git/GAUNTLET/DreamUp-QA-ts
[2025-11-06T12:34:56.125Z] Game URL: https://example.com/game
[STDOUT] ✔ Configuration loaded
[STDOUT] ✔ Browser session initialized
...
[2025-11-06T12:36:45.789Z] Process exited with code 0, signal null
```

### 2. **Enhanced Console Output**

**File**: `src/components/layout/TopBar.tsx`

Added detailed console logging when test starts:
```javascript
console.log('✅ Test started successfully')
console.log('  Command:', data.command)
console.log('  PID:', data.pid)
console.log('  Log file:', data.logFile)
```

### 3. **Better Error Detection**

- Waits 100ms after spawn to catch immediate failures
- Checks if process was killed immediately
- Returns error with log file path if spawn fails
- Properly logs all errors to console

### 4. **Environment Variable Inheritance**

Changed:
```javascript
env: { ...process.env }
```

Ensures the CLI subprocess inherits all environment variables from the Next.js process (like `OPENAI_API_KEY`, etc.).

## How to Use

### Running a Test from the Dashboard

1. Click **"Configure Test"** button in TopBar
2. Fill in the form:
   - **Game URL**: Required (e.g., `https://example.com/game`)
   - **Config File**: Optional (e.g., `configs/platformer.json`)
   - **Model**: Choose LLM model
   - **Enable LLM**: Toggle for LLM-based evaluation
   - **Headed Mode**: Toggle to see browser (useful for debugging)
   - **Retries**: Number of retry attempts
3. Click **"Run Test"**
4. Check browser console (F12) for:
   ```
   ✅ Test started successfully
     Command: bun run src/cli.ts test https://example.com/game -c configs/platformer.json
     PID: 12345
     Log file: /Users/bdr/Git/GAUNTLET/DreamUp-QA-ts/logs/spawn-2025-11-06T12-34-56.log
   ```

### Debugging Test Execution

1. **Check the spawn logs**:
   ```bash
   ls -la logs/
   cat logs/spawn-<timestamp>.log
   ```

2. **Check the Next.js console** (where you ran `npm run dev`):
   - Look for `[API]`, `[CLI Output]`, `[CLI Error]` prefixed messages
   - These show real-time output from the CLI

3. **Check the session results**:
   ```bash
   ls -la results/
   cat results/session_<timestamp>/output.json
   ```

### Common Issues & Solutions

#### Issue: Process spawns but dies immediately

**Check**:
1. Log file in `logs/spawn-*.log`
2. Look for spawn errors or early exit codes

**Common causes**:
- Missing dependencies: `bun install`
- Invalid config file path
- Missing environment variables (`.env` file)
- Browser initialization failure

#### Issue: No output in log file

**Check**:
1. File permissions on `logs/` directory
2. Disk space
3. Next.js server logs for errors

#### Issue: CLI runs but no results appear

**Check**:
1. Results directory: `ls -la results/`
2. Session was created but test failed
3. SSE connection for real-time updates

#### Issue: "Game URL is required" error

**Solution**: Make sure you enter a URL in the form before clicking "Run Test"

## Testing the Fix

### Quick Test

1. Start the dashboard:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:3000`

3. Click "Configure Test"

4. Enter a test URL (e.g., one of your existing games)

5. Click "Run Test"

6. Open browser console (F12) and look for success message

7. Check the logs:
   ```bash
   tail -f logs/spawn-*.log
   ```

### Manual CLI Test (Baseline)

To verify the CLI works independently:

```bash
bun run src/cli.ts test https://example.com/game -c configs/platformer.json --headed
```

If this works but the dashboard spawn doesn't, check environment variables.

## Environment Variables

Make sure you have a `.env` file with required keys:

```bash
# Required for CUA (Computer Use Agent)
OPENAI_API_KEY=sk-...

# Optional: Browserbase (if using cloud browsers)
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
```

The spawn process now properly inherits these variables.

## Log Retention

**Note**: Log files in `logs/` directory will accumulate over time. Consider:

1. Periodic cleanup:
   ```bash
   # Delete logs older than 7 days
   find logs/ -name "spawn-*.log" -mtime +7 -delete
   ```

2. Log rotation (future enhancement)

3. Max file size limits (future enhancement)

## Files Modified

1. ✅ `app/api/test/run/route.ts` - Added logging, error handling, stdio capture
2. ✅ `src/components/layout/TopBar.tsx` - Enhanced console output
3. ✅ `.gitignore` - Added `logs/` directory

## Next Steps (Optional Enhancements)

1. **Real-time log streaming**: Stream logs to dashboard UI via WebSocket/SSE
2. **Process management**: Add ability to kill running tests from dashboard
3. **Test queue**: Queue multiple tests instead of running them concurrently
4. **Better feedback**: Show spinner/progress in UI while test is running
5. **Log viewer**: Build UI component to view spawn logs in dashboard

## Verification Checklist

- [x] API route spawns process correctly
- [x] Log files are created in `logs/` directory
- [x] Console shows CLI output in real-time
- [x] Error handling captures spawn failures
- [x] Environment variables are inherited
- [x] Success response includes PID and log file path
- [x] Browser console shows success message with details
- [x] `.gitignore` excludes log files from git

## Summary

The "Run Test" button was always calling the CLI correctly, but with zero visibility. Now:

✅ **Full logging** to `logs/spawn-*.log` files  
✅ **Console output** shows CLI execution in real-time  
✅ **Error detection** catches immediate spawn failures  
✅ **Debug info** returned in API response (PID, command, log file)  
✅ **Environment inheritance** ensures subprocess has all required variables  

**You can now see exactly what's happening when you click "Run Test"!**

