# Test Spawn Logs

This directory contains logs from the dashboard's test execution spawning.

## Log Files

**Pattern**: `spawn-<timestamp>.log`

Each file logs a single test execution spawned from the dashboard's "Run Test" button.

## Log Format

```
[timestamp] Spawning: bun run src/cli.ts test <url> [options]
[timestamp] CWD: /path/to/project
[timestamp] Game URL: https://...
[STDOUT] <cli output>
[STDERR] <cli errors>
[timestamp] Process exited with code <code>, signal <signal>
```

## Viewing Logs

**Latest log**:
```bash
ls -t logs/spawn-*.log | head -1 | xargs cat
```

**Follow live**:
```bash
tail -f logs/spawn-$(date +%Y-%m-%d)*.log
```

**All logs from today**:
```bash
cat logs/spawn-$(date +%Y-%m-%d)*.log
```

## Cleanup

These logs are automatically ignored by git (`.gitignore`).

To clean old logs:
```bash
# Delete logs older than 7 days
find logs/ -name "spawn-*.log" -mtime +7 -delete
```

## Troubleshooting

If a test doesn't appear to run:

1. Check the latest log file for spawn errors
2. Look for `[STDERR]` entries indicating CLI errors
3. Check the exit code (should be 0 for success)
4. Verify environment variables are set (check Next.js console)

See `docs/logs/RUN-TEST-BUTTON-FIX.md` for detailed debugging guide.

