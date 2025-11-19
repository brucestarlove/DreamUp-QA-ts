## Directory Structure

This document describes the organization of the DreamUp QA TypeScript codebase.

## Overview

The codebase follows a **modular architecture** with clear separation of concerns. Each directory has a specific purpose and responsibility.

```
src/
├── actions/           # Action strategy implementations
├── api-server.ts      # API server entry point
├── capture/           # Screenshot capture and optimization
├── capture.ts         # Legacy capture manager (use capture/ for new code)
├── cli/               # CLI entry point
├── cli.ts             # CLI entry point
├── config/            # Configuration management
├── config.ts          # Base configuration
├── core/              # Core domain logic (logical grouping)
├── cua.ts             # Computer Use Agent manager
├── errors/            # Error handling and custom errors
├── evaluation.ts      # LLM evaluation logic
├── hooks/             # React hooks (for dashboard)
├── index.ts           # Main SDK export
├── interaction.ts     # Action execution orchestration
├── interfaces/        # TypeScript interfaces (DI contracts)
├── lib/               # Shared library code
├── mocks/             # Mock implementations for testing
├── observability/     # Logging and monitoring
├── reporter.ts        # Test result reporter
├── services/          # Business logic services
├── session.ts         # Browser session manager
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Module Descriptions

### Core Modules

#### `actions/` - Action Strategies
Contains the Strategy pattern implementation for test actions.

**Files:**
- `base-action.ts` - Abstract base class for all actions
- `click-action.ts` - Click interactions (DOM & CUA)
- `press-action.ts` - Keyboard input
- `axis-action.ts` - Continuous directional input
- `agent-action.ts` - Autonomous agent gameplay
- `wait-action.ts` - Delays and waiting
- `screenshot-action.ts` - Screenshot capture
- `observe-action.ts` - Page observation
- `action-registry.ts` - Central action registry
- `index.ts` - Barrel export

**Purpose:** Extensible action system for QA automation

**Import from:**
```typescript
import { ClickAction, ActionRegistry } from './actions/index.js';
```

#### `config/` - Configuration Management
Handles configuration loading, validation, and environment-specific settings.

**Files:**
- `async-loader.ts` - Async configuration loading
- `validator.ts` - Config validation and linting
- `environment.ts` - Environment-specific configuration
- `loaders/base-loader.ts` - Loader interface
- `loaders/json-loader.ts` - JSON config loader
- `loaders/ts-loader.ts` - TypeScript/JS config loader

**Purpose:** Type-safe, validated configuration system

**Import from:**
```typescript
import { loadConfigAsync, ConfigValidator } from './config/async-loader.js';
import { loadEnvironmentConfig } from './config/environment.js';
```

#### `errors/` - Error Handling
Custom error classes and centralized error handling.

**Files:**
- `custom-errors.ts` - 16 custom error types with context
- `error-handler.ts` - Error handler with recovery strategies

**Purpose:** Structured error handling with metadata

**Import from:**
```typescript
import { ActionExecutionError, SessionTimeoutError } from './errors/custom-errors.js';
import { ErrorHandler } from './errors/error-handler.js';
```

#### `services/` - Business Logic
High-level business logic and orchestration.

**Files:**
- `test-orchestrator.ts` - Orchestrates test execution
- `container.ts` - Dependency injection container
- `session-pool.ts` - Browser session pooling

**Purpose:** Reusable business logic across CLI and API

**Import from:**
```typescript
import { TestOrchestrator } from './services/test-orchestrator.js';
import { createServiceContainer } from './services/container.js';
import { SessionPool } from './services/session-pool.js';
```

#### `interfaces/` - Dependency Injection Contracts
TypeScript interfaces for dependency injection.

**Files:**
- `session-manager.interface.ts` - Session management contract
- `capture-manager.interface.ts` - Capture management contract
- `cua-manager.interface.ts` - CUA contract
- `progress-reporter.interface.ts` - Progress reporting contract
- `ora-progress-reporter.ts` - CLI spinner implementation

**Purpose:** Enables testing with mock implementations

**Import from:**
```typescript
import type { ISessionManager, ICaptureManager } from './interfaces/';
```

### New Modules (Low-Priority Refactoring)

#### `capture/` - Optimized Screenshot Management
Enhanced screenshot capture with optimization features.

**Files:**
- `screenshot-optimizer.ts` - Compression and deduplication
- `optimized-capture-manager.ts` - Enhanced capture manager
- `index.ts` - Barrel export

**Features:**
- Screenshot deduplication (hash-based)
- Compression support (placeholder for sharp)
- Thumbnail generation
- Caching

**Import from:**
```typescript
import { OptimizedCaptureManager, ScreenshotOptimizer } from './capture/index.js';
```

#### `mocks/` - Mock Implementations
Mock implementations of all interfaces for testing.

**Files:**
- `mock-session-manager.ts` - Mock session manager
- `mock-capture-manager.ts` - Mock capture manager
- `mock-cua-manager.ts` - Mock CUA manager
- `mock-progress-reporter.ts` - Mock progress reporter
- `index.ts` - Barrel export

**Purpose:** Test without BrowserBase or OpenAI dependencies

**Import from:**
```typescript
import { MockSessionManager, MockCaptureManager } from './mocks/index.js';
```

#### `core/` - Logical Core Grouping
Barrel export for core domain logic (maintains backward compatibility).

**Purpose:** Logical organization without breaking existing imports

**Import from:**
```typescript
import { SessionManager, CaptureManager, CUAManager } from './core/index.js';
```

### Support Modules

#### `utils/` - Utility Functions
Reusable utility functions.

**Files:**
- `retry.ts` - Retry logic with exponential backoff
- `errors.ts` - Issue creation utilities
- `time.ts` - Time formatting and delays
- `logger.ts` - Simple console logger
- `type-guards.ts` - TypeScript type guards
- `controls.ts` - Game control mappings
- `index.ts` - Barrel export

**Import from:**
```typescript
import { retryOperation, getTimestamp, createIssue } from './utils/index.js';
```

#### `observability/` - Logging and Monitoring
Structured logging system.

**Files:**
- `structured-logger.ts` - Custom structured logger

**Features:**
- JSON-formatted logs
- File and console output
- Buffered writes
- Context metadata
- Child loggers

**Import from:**
```typescript
import { createLogger } from './observability/structured-logger.js';
```

#### `types/` - TypeScript Definitions
Type definitions and declarations.

**Files:**
- `stagehand.d.ts` - Stagehand type extensions

**Purpose:** Type safety for third-party libraries

#### `lib/` - Shared Library Code
Shared code for dashboard and API.

**Files:**
- `types/test-result.ts` - Test result types
- `utils/date.ts` - Date utilities
- `utils.ts` - Misc utilities
- `data/sessions.ts` - Session data access

**Purpose:** Code shared between server and client

### Entry Points

#### `cli.ts` - Command Line Interface
Main CLI entry point for running tests from terminal.

**Usage:**
```bash
bun run cli.ts --url https://game.example.com --config config.json
```

#### `api-server.ts` - API Server
Express server for running tests via HTTP API.

**Usage:**
```bash
bun run api-server.ts
```

**Endpoints:**
- `POST /api/test` - Run a test
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get session details

#### `index.ts` - SDK Export
Main SDK export for using as a library.

**Usage:**
```typescript
import { TestOrchestrator, SessionManager } from './src/index.js';
```

## Import Patterns

### Barrel Exports
Use barrel exports (index.ts) for cleaner imports:

```typescript
// Good: Use barrel export
import { ClickAction, ActionRegistry } from './actions/index.js';

// Avoid: Direct file imports
import { ClickAction } from './actions/click-action.js';
import { ActionRegistry } from './actions/action-registry.js';
```

### Module Boundaries
Respect module boundaries:

```typescript
// Good: Import from public API
import { TestOrchestrator } from './services/test-orchestrator.js';

// Avoid: Reaching into internals
import { SomeInternalClass } from './services/internal/some-class.js';
```

### Legacy Compatibility
Some root-level files maintain backward compatibility:

```typescript
// Still works (legacy)
import { SessionManager } from './session.js';

// Preferred (new)
import { SessionManager } from './core/index.js';
```

## Organization Principles

1. **Single Responsibility** - Each directory has one clear purpose
2. **Dependency Inversion** - Depend on interfaces, not implementations
3. **Modularity** - Clear module boundaries with barrel exports
4. **Testability** - Mock implementations for all interfaces
5. **Scalability** - Session pooling and optimization features
6. **Maintainability** - Logical organization with documentation

## Migration Guide

### From Old to New Structure

**Before (High-Priority Refactoring):**
```typescript
import { SessionManager } from './session.js';
import { CaptureManager } from './capture.js';
```

**After (Low-Priority Refactoring):**
```typescript
// Option 1: Use logical grouping
import { SessionManager, CaptureManager } from './core/index.js';

// Option 2: Use optimized versions
import { OptimizedCaptureManager } from './capture/index.js';

// Option 3: Use mocks for testing
import { MockSessionManager, MockCaptureManager } from './mocks/index.js';
```

### Using Session Pooling

**Before:**
```typescript
const sessionManager = new SessionManager(/* ... */);
const stagehand = await sessionManager.initialize();
```

**After:**
```typescript
import { SessionPool } from './services/session-pool.js';

const pool = new SessionPool({ maxSize: 10 });
const stagehand = await pool.acquire();
// ... use stagehand
await pool.release(stagehand);
```

### Using Screenshot Optimization

**Before:**
```typescript
const captureManager = new CaptureManager(sessionDir);
await captureManager.takeScreenshot(page, 'baseline');
```

**After:**
```typescript
import { OptimizedCaptureManager } from './capture/index.js';

const captureManager = new OptimizedCaptureManager(sessionDir, {
  enableCompression: true,
  enableDeduplication: true,
  enableThumbnails: true,
});
await captureManager.takeScreenshot(page, 'baseline');
```

## Future Improvements

1. **Plugin System** - Action registry enables external plugins
2. **Custom Loaders** - Add YAML, TOML config support
3. **Advanced Pooling** - Multi-region session pools
4. **Metrics Collection** - Structured logging enables metrics
5. **Dashboard Integration** - Real-time test monitoring

## Conclusion

The directory structure balances **backward compatibility** with **modern architecture**:

- ✅ Logical module organization
- ✅ Clear separation of concerns
- ✅ Dependency injection ready
- ✅ Mock implementations for testing
- ✅ Performance optimizations
- ✅ Scalability features
- ✅ Comprehensive documentation

All existing code continues to work while new features use improved architecture.
