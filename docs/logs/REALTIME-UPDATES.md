# Real-Time Updates Implementation

The dashboard uses **Server-Sent Events (SSE)** with file system watching to provide real-time updates when new test sessions are created or updated.

## Architecture

### Server-Side (SSE Endpoint)
- **Location**: `app/api/sessions/watch/route.ts`
- **Technology**: Chokidar file watcher + Next.js ReadableStream
- **Watches**: 
  - New session directories (`session_*`)
  - `output.json` creation/updates
  - Screenshot additions (`.png` files in `screenshots/`)

### Client-Side (React Hook)
- **Location**: `src/hooks/useSessionWatch.ts`
- **Features**:
  - Automatic reconnection with exponential backoff
  - Connection status tracking
  - Event callbacks for updates
  - Graceful error handling

### Event Types

1. **`connected`** - SSE connection established
2. **`session_created`** - New session directory detected
3. **`session_updated`** - `output.json` created or modified
4. **`screenshot_added`** - New screenshot file added
5. **`error`** - File watcher error occurred

## Usage

### Basic Hook Usage

```typescript
import { useSessionWatch } from '@/hooks/useSessionWatch'

const { isConnected, latestEvent } = useSessionWatch({
  onUpdate: (event) => {
    console.log('Update:', event)
    // Refetch data, update UI, etc.
  },
  onConnected: () => {
    console.log('Connected!')
  },
  enabled: true
})
```

### Connection Status Component

The `ConnectionStatus` component displays:
- Live connection indicator (green "Live" badge)
- Reconnection attempts counter
- Real-time event notifications (sessions, screenshots)

## Performance Considerations

- **File Watcher Stability**: Uses `awaitWriteFinish` with 500ms stability threshold to avoid premature triggers
- **Debouncing**: Multiple rapid updates are handled gracefully
- **Connection Management**: Automatic cleanup on unmount
- **Reconnection**: Exponential backoff (max 30 seconds)

## Fallback Options

If SSE is unavailable or fails:
1. Automatic reconnection attempts
2. Manual refresh button available
3. Can implement polling fallback if needed

## Testing

To test real-time updates:

1. Start the dashboard: `bun dev`
2. In another terminal, run a test: `bun start test <url> --config <config>`
3. Watch the dashboard update automatically as:
   - Session directory is created
   - Screenshots are added
   - `output.json` is written/updated

## Troubleshooting

**SSE Not Connecting:**
- Check browser console for errors
- Verify `/api/sessions/watch` endpoint is accessible
- Check server logs for file watcher errors

**Updates Not Appearing:**
- Verify file watcher has permissions to read `results/` directory
- Check that `chokidar` is properly installed
- Ensure `results/` directory exists

**High CPU Usage:**
- File watcher may be watching too many files
- Consider adjusting `depth` or adding ignore patterns in the watcher config

