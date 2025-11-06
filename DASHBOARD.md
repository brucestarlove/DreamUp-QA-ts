# Game QA Dashboard

A Next.js 15+ dashboard with TailwindCSS 4.1 and Starscape UI theme for visualizing and managing browser game QA test results.

## Features

- **Session Management**: View all test sessions grouped by game URL
- **Detailed Metrics**: Playability scores, action success rates, LLM usage, and cost tracking
- **Screenshot Gallery**: View and zoom into screenshots from test runs
- **Issues Tracking**: Color-coded issue list with timestamps and action references
- **Test Execution UI**: User-friendly form to run new tests with all CLI options
- **Timeline Visualization**: Placeholder for future interactive timeline feature

## Getting Started

### Development Server

Run the dashboard in development mode:

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the dashboard for production:

```bash
npm run build
npm run dashboard
# or
bun run build
bun run dashboard
```

### Running the CLI

The original CLI tool is still available:

```bash
npm start -- test <game-url> --config <config-file>
# or
bun start test <game-url> --config <config-file>
```

## Project Structure

```
app/
  ├── api/              # API routes
  │   ├── sessions/     # Session management endpoints
  │   ├── test/         # Test execution endpoint (stub)
  │   └── configs/      # Config file listing
  ├── layout.tsx        # Root layout
  └── page.tsx          # Main dashboard page

src/
  ├── components/
  │   ├── layout/       # TopBar, Sidebar, DashboardLayout
  │   ├── sessions/     # Session detail components
  │   ├── test/         # Test execution components
  │   └── ui/           # shadcn/ui components
  ├── lib/
  │   ├── data/         # Data fetching utilities
  │   ├── types/        # TypeScript interfaces
  │   └── utils/        # Utility functions
  └── globals.css       # Starscape theme utilities

results/                # Test session results
configs/                # Test configuration files
```

## Architecture

### Layout

- **Top Bar** (~180px): Logo and test execution UI
- **Left Sidebar** (320px): Game list with collapsible session groups
- **Main Content**: Session detail view with tabs

### Data Flow

1. Page loads → Fetch sessions from `/api/sessions`
2. Sessions grouped by game URL
3. Select session → Display details in main content area
4. Test execution → POST to `/api/test/run` (currently stubbed)

### API Routes

- `GET /api/sessions` - List all sessions grouped by game
- `GET /api/sessions/[sessionId]` - Get single session details
- `DELETE /api/sessions/[sessionId]` - Delete a session
- `GET /api/sessions/[sessionId]/screenshots/[filename]` - Serve screenshot
- `GET /api/configs` - List available config files
- `POST /api/test/run` - Run test (stub, returns 501)

## Styling

The dashboard uses the Starscape design system with:

- **Colors**: Deep navy backgrounds, light blue accents
- **Gradients**: Deepspace, cyan-purple, green-emerald
- **Glass morphism**: Backdrop blur effects on cards
- **Shadows**: Elevated shadows for depth
- **Typography**: Starscape font scale

### Key CSS Classes

- `bg-gradient-deepspace` - Primary gradient background
- `glass-dark` - Dark glass morphism effect
- `text-light-blue` - Accent text color
- `shadow-elevated` - Card shadow

## Future Improvements

- [ ] Interactive timeline visualization with screenshot keyframes
- [ ] Real-time test execution with WebSocket/SSE streaming
- [ ] Session comparison feature
- [ ] Console log viewer
- [ ] Export results to PDF/CSV
- [ ] Test scheduling and automation
- [ ] Multi-user authentication
- [ ] Analytics and trends dashboard

## Technologies

- **Next.js 15+** - React framework with App Router
- **TailwindCSS 4.1** - Utility-first CSS
- **Starscape UI** - Custom design system
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **TypeScript** - Type safety
- **Bun** - JavaScript runtime and package manager

## Notes

- The dashboard is read-only for now (except delete)
- Test execution is stubbed and will be implemented later
- Timeline visualization is a placeholder
- All sessions stored in `results/` directory are automatically discovered

