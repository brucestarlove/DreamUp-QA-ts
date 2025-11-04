### Stagehand History API Version Comparison

Source: https://docs.stagehand.dev/v3/migrations/v2

Compares the History API implementation in Stagehand v2 and v3. v2 provides direct access, while v3 returns a promise, indicating an asynchronous operation.

```typescript
const history = stagehand.history;
```

```typescript
const history = await stagehand.history;
```

--------------------------------

### Install Stagehand v3 Package

Source: https://docs.stagehand.dev/v3/migrations/v2

Updates the Stagehand package to the latest version using npm. This command ensures you are using Stagehand v3 for your project.

```bash
npm install @browserbasehq/stagehand@latest
```

--------------------------------

### Stagehand Metrics API Version Comparison

Source: https://docs.stagehand.dev/v3/migrations/v2

Compares the Metrics API implementation in Stagehand v2 and v3. Similar to the History API, v2 offers direct access, whereas v3's Metrics API is asynchronous and returns a promise.

```typescript
const metrics = stagehand.metrics;
```

```typescript
const metrics = await stagehand.metrics;
```

--------------------------------

### Extract Data from Iframes (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

This snippet demonstrates how to extract data from iframes using Stagehand. Version 3 simplifies this by automatically handling iframes without requiring an explicit `iframes: true` option.

```typescript
const data = await page.extract({
  instruction: "extract data from iframe",
  schema: DataSchema,
  iframes: true  // Required for iframe content
});
```

```typescript
// Automatic iframe support
const data = await stagehand.extract(
  "extract data from iframe",
  DataSchema
);
```

--------------------------------

### Schema-less Extraction with extract() in Stagehand

Source: https://docs.stagehand.dev/v3/migrations/v2

Stagehand v3 simplifies schema-less extraction compared to v2. Both versions allow extraction with a string instruction for specific data or extraction of the entire page's raw content, but v3 returns page text under the `pageText` property.

```typescript
// String instruction
const result = await page.extract("get the page title");
// Returns: { extraction: "Page Title" }

// Raw page content
const content = await page.extract();
// Returns: { page_text: "..." }
```

```typescript
// String instruction
const result = await stagehand.extract("get the page title");
// Returns: { extraction: "Page Title" }

// Raw page content
const content = await stagehand.extract();
// Returns: { pageText: "..." }
```

--------------------------------

### Manage Cache Directories with Versioning and Cleanup

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

Demonstrates techniques for managing cache directories to prevent uncontrolled growth. This includes using version prefixes for directories and implementing cleanup of old cache versions using Node.js's `rmSync` function. Ensure proper error handling for the `rmSync` operation.

```javascript
// Versioned caches
const CACHE_VERSION = '2024-01';
const cacheDir = `cache/workflow-${CACHE_VERSION}`;

// Cleanup old versions
rmSync('cache/workflow-2023-12', { recursive: true, force: true });
```

--------------------------------

### Stagehand Vercel Project Dependencies

Source: https://docs.stagehand.dev/v3/best-practices/deployments

Defines project metadata and lists dependencies for a Stagehand project intended for Vercel deployment, including Node.js version requirements.

```json
{
    "name": "bb-stagehand-on-vercel",
    "private": true,
    "type": "module",
    "engines": { "node": ">=18" },
    "dependencies": {
      "@browserbasehq/stagehand": "^3.0.0"
    },
    "devDependencies": {
      "@types/node": "^20.12.12",
      "@vercel/node": "^3.2.20",
      "typescript": "^5.2.2"
    }
}
```

--------------------------------

### Version Control for Caches (gitignore & TypeScript)

Source: https://docs.stagehand.dev/v3/best-practices/deterministic-agent

This snippet shows how to use .gitignore to commit cache directories for deterministic CI/CD pipelines and a TypeScript example for initializing Stagehand with a committed cache directory. It ensures consistent behavior across environments.

```gitignore
# .gitignore

# Commit cache directories for deterministic CI/CD
!cache/
!cache/**/*.json
```

```typescript
// CI/CD pipeline will use pre-generated cache
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "cache/production-workflow" // Committed to repo
});
```

--------------------------------

### Configure Git to Ignore Cache Directories

Source: https://docs.stagehand.dev/v3/best-practices/caching

Shows how to configure a `.gitignore` file to prevent cache directories from being accidentally committed to version control. It also demonstrates how to use negation patterns (`!`) to explicitly include specific cache directories if they need to be tracked for CI/CD consistency.

```gitignore
# .gitignore
# Don't ignore cache directories
!cache/
```

--------------------------------

### Stagehand v3 Initialization and Usage

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates the initialization and core functionalities of Stagehand v3, featuring a simplified configuration and enhanced APIs for actions, extraction, and observation. It highlights automatic iframe support and the new context API.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from 'zod/v3';

// Initialize - simplified configuration
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  model: "openai/gpt-5",  // Unified model configuration
  cacheDir: "./cache",      // Flexible cache directory
  domSettleTimeout: 5000    // Consistent naming
});

await stagehand.init();
const page = stagehand.context.pages()[0];  // Context API

// Navigate
await page.goto("https://example.com");

// Act - cleaner interface, automatic iframe support
await stagehand.act("click the login button", {
  timeout: 10000
  // No iframes flag needed - automatic!
});

// Extract - cleaner parameter order
const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  inStock: z.boolean()
});

const product = await stagehand.extract(
  "extract product details",
  ProductSchema
  // Automatic iframe support, no extra flags needed
);

// Observe - simplified
const actions = await stagehand.observe("find all buttons");
// Automatic iframe support

// Get metrics
const metrics = await stagehand.metrics;
console.log('Total tokens used:',
  metrics.totalPromptTokens + metrics.totalCompletionTokens);

await stagehand.close();
```

--------------------------------

### Stagehand Server Configuration

Source: https://docs.stagehand.dev/mcp

Defines the server's name, version, and transport protocol. This configuration is fundamental for the Stagehand application's operation.

```JSON
{
  "server": {
    "name": "🤘 Stagehand",
    "version": "1.0.0",
    "transport": "http"
  }
}
```

--------------------------------

### Stagehand act() Method: v2 Options vs v3 Simplified String Instruction

Source: https://docs.stagehand.dev/v3/migrations/v2

Compares the `act()` method signature in Stagehand v2 and v3. v3 simplifies the call by removing the `action` parameter and allowing a direct string instruction, with options passed separately.

```typescript
await page.act({
  action: "click the login button",
  modelName: "openai/gpt-5-mini",
  variables: { username: "john" },
  timeoutMs: 10000,
  domSettleTimeoutMs: 5000,
  iframes: true
});

```

```typescript
// Clean, simple string instruction (v3)
await stagehand.act("click the login button");

// With options (v3)
await stagehand.act("click the login button", {
  model: "openai/gpt-5-mini",
  variables: { username: "john" },
  timeout: 10000,
  page: page  // Optional: specify which page
});

```

--------------------------------

### Stagehand Page Access: v2 Direct vs v3 Context API

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates how to access pages in Stagehand v2 directly and in v3 using the Context API. v3 offers more robust multi-page management.

```typescript
const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Direct page access (v2)
const page = stagehand.page;
await page.goto("https://example.com");

```

```typescript
const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Access via context (v3)
const page = stagehand.context.pages()[0];
await page.goto("https://example.com");

// Or use the convenience getter (v3)
const page = stagehand.page;
await page.goto("https://example.com");

```

--------------------------------

### Initialize Stagehand with a Committed Cache Directory

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

Initializes the Stagehand instance using a cache directory that is committed to version control. This ensures that CI/CD environments can reliably access pre-generated cache files for consistent execution.

```javascript
// CI/CD pipeline will use pre-generated cache
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "cache/production-workflow" // Committed to repo
});
```

--------------------------------

### Observe Method Signature Updates (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates the changes in the `observe()` method signature between Stagehand v2 and v3. V3 moves the method to the `stagehand` instance and introduces new options like `selector` while removing others.

```typescript
const results = await page.observe({
  instruction: "find all buttons",
  modelName: "openai/gpt-5",
  domSettleTimeoutMs: 5000,
  drawOverlay: true,
  iframes: true
});
```

```typescript
const results = await stagehand.observe("find all buttons", {
  model: "openai/gpt-5",
  timeout: 10000,
  selector: ".container",  // NEW: scope observation to selector
  page: page  // Optional: specify which page
});
```

--------------------------------

### Simplify Execute Method: Stagehand v2 to v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates the changes to the execute() method in Stagehand v3 compared to v2. V3 removes options like `autoScreenshot`, `waitBetweenActions`, and `context`, while introducing new parameters such as `page` for specifying the operating page and `highlightCursor` for visual debugging.

```typescript
const result = await agent.execute({
  instruction: "Search for products",
  maxSteps: 20,
  autoScreenshot: true,
  waitBetweenActions: 1000,
  context: "Focus on electronics category"
});
```

```typescript
const result = await agent.execute({
  instruction: "Search for products",
  maxSteps: 20,
  page: page,  // NEW: specify which page to operate on
  highlightCursor: true  // NEW: visual cursor for debugging
});
```

--------------------------------

### Initialize Stagehand in Python

Source: https://docs.stagehand.dev/v2/references/stagehand

Illustrates the initialization of the Stagehand client using Python. It accepts similar configuration parameters as the TypeScript version, such as environment, API keys, model names, and logging preferences, followed by an asynchronous `init()` call.

```python
from stagehand import Stagehand

stagehand = Stagehand(
    env: Literal["BROWSERBASE", "LOCAL"] = "BROWSERBASE",
    api_key: str = None,
    project_id: str = None,
    api_url: str = None,
    model_name: str = None,
    model_api_key: str = None,
    model_client_options: Dict[str, Any] = None,
    verbose: int = 1,
    logger: Callable = None,
    use_rich_logging: bool = True,
    dom_settle_timeout_ms: int = 3000,
    browserbase_session_create_params: Dict = None,
    browserbase_session_id: str = None,
    enable_caching: bool = False,
    self_heal: bool = True,
    wait_for_captcha_solves: bool = False,
    system_prompt: str = None,
    local_browser_launch_options: Dict[str, Any] = None,
    use_api: bool = True,
    experimental: bool = False,
)
await stagehand.init()
```

--------------------------------

### Stagehand Multi-Page Management: v2 Limited vs v3 Context API

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates multi-page handling in Stagehand v2 and the enhanced capabilities in v3 using the Context API. v3 allows accessing all pages, creating new ones, and setting the active page.

```typescript
const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Limited multi-page support (v2)
const page = stagehand.page;

```

```typescript
const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Access all pages (v3)
const pages = stagehand.context.pages();
const mainPage = pages[0];

// Create new page (v3)
const newPage = await stagehand.context.newPage();

// Set active page (v3)
stagehand.context.setActivePage(newPage);

// Now stagehand.page returns newPage
await stagehand.act("click button");  // Acts on newPage

```

--------------------------------

### Stagehand v2 Initialization and Usage

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates the initialization and core functionalities of Stagehand v2, including navigation, actions, extraction, and observation. It uses Zod for schema validation during extraction.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from 'zod/v3';

// Initialize
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  modelName: "openai/gpt-5",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY
  },
  enableCaching: true,
  domSettleTimeoutMs: 5000
});

await stagehand.init();
const page = stagehand.page;

// Navigate
await page.goto("https://example.com");

// Act
await page.act({
  action: "click the login button",
  timeoutMs: 10000,
  iframes: true
});

// Extract
const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  inStock: z.boolean()
});

const product = await page.extract({
  instruction: "extract product details",
  schema: ProductSchema,
  domSettleTimeoutMs: 5000,
  iframes: true
});

// Observe
const actions = await page.observe({
  instruction: "find all buttons",
  drawOverlay: false,
  iframes: true
});

await stagehand.close();
```

--------------------------------

### Basic Page Action with act() - Python

Source: https://docs.stagehand.dev/v2/basics/act

Illustrates the basic usage of the `act()` function in Python for interacting with web pages. Similar to TypeScript, it accepts natural language commands to execute actions. This version shows navigating to a URL and clicking an element.

```python
await page.goto("https://example-store.com")
await page.act("click the add to cart button")
```

```python
# Break it into single-step actions
await page.act("open the filters panel")
await page.act("choose 4-star rating")
await page.act("click the apply button")
```

```python
# Too complex - trying to do multiple things at once
await page.act("open the filters panel, choose 4-star rating, and click apply")
```

--------------------------------

### Array Schema Extraction (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Compares how array schemas are handled in Stagehand v2 and v3. V2 required wrapping arrays in an object, while v3 allows direct use of array schemas for more ergonomic extraction.

```typescript
import { z } from 'zod/v3';

// Had to wrap array in object
const ApartmentListingsSchema = z.object({
  apartments: z.array(z.object({
    address: z.string(),
    price: z.string(),
    bedrooms: z.number()
  }))
});

const result = await page.extract({
  instruction: "extract all apartment listings",
  schema: ApartmentListingsSchema
});

// Access via: result.apartments
```

```typescript
import { z } from 'zod/v3';

// Can use array schema directly
const ApartmentListingsSchema = z.array(
  z.object({
    address: z.string(),
    price: z.string(),
    bedrooms: z.number()
  })
);

const result = await stagehand.extract(
  "extract all apartment listings",
  ApartmentListingsSchema
);

// Result is directly the array
console.log(result[0].address);
```

--------------------------------

### Update Stagehand Agent Execute Options (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates how to update agent execution calls by removing deprecated options like `autoScreenshot`, `waitBetweenActions`, and `context`, and utilizing v3 alternatives such as `highlightCursor`. Context should now be passed within the `systemPrompt` during agent creation.

```typescript
// v2 ❌
await agent.execute({
  instruction: "task",
  autoScreenshot: true,
  waitBetweenActions: 1000,
  context: "additional context"
});

// v3 ✅
const agent = stagehand.agent({
  model: "google/gemini-2.5-computer-use-preview-10-2025",
  systemPrompt: "Your context here."  // Move context to systemPrompt
});

await agent.execute({
  instruction: "task",
  highlightCursor: true  // Use new option for visual feedback
});
```

--------------------------------

### Observe then Act Workflow (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates the 'observe then act' workflow using Stagehand. While the core concept remains, v3 updates the method signatures to be called on the `stagehand` instance instead of the `page` instance.

```typescript
const [action] = await page.observe("find the login button");
await page.act(action);
```

```typescript
const [action] = await stagehand.observe("find the login button");
await stagehand.act(action);
```

--------------------------------

### Stagehand act() Method: v2 ModelName vs v3 Model Configuration

Source: https://docs.stagehand.dev/v3/migrations/v2

Shows how model configuration is handled within the `act()` method for Stagehand v2 and v3. v3 offers more flexible model configuration, including direct API key provision.

```typescript
await page.act({
  action: "fill the form",
  modelName: "anthropic/claude-sonnet-4-5",
  modelClientOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY
  }
});

```

```typescript
// String format (v3)
await stagehand.act("fill the form", {
  model: "anthropic/claude-sonnet-4-5"
});

// Object format (v3)
await stagehand.act("fill the form", {
  model: {
    modelName: "anthropic/claude-sonnet-4-5",
    apiKey: process.env.ANTHROPIC_API_KEY
  }
});

```

--------------------------------

### Initialize Computer Use Agent (Python)

Source: https://docs.stagehand.dev/v2/basics/agent

Initializes a Stagehand agent for computer use with Anthropic's Claude Sonnet model in Python. Similar to the TypeScript version, it requires an API key and custom instructions. The agent then executes a job application task.

```python
agent = stagehand.agent({
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "instructions": "You are a helpful assistant that can use a web browser.",
      "options": {
        "apiKey": os.getenv("ANTHROPIC_API_KEY"),
      },
  })
  await agent.execute("apply for a job at Browserbase")
```

--------------------------------

### Git Ignore for Stagehand Cache Directories

Source: https://docs.stagehand.dev/best-practices/caching

This example shows how to configure a `.gitignore` file to prevent Stagehand cache directories from being committed to version control. By default, Git ignores files and directories specified in `.gitignore`. However, using the negation pattern `!cache/` ensures that any directories within `cache/` (including the actual cache files) are tracked. This is crucial for CI/CD pipelines to ensure consistent behavior across environments without storing potentially large cache files in the repository.

```git
# .gitignore
# Don't ignore cache directories
!cache/

```

--------------------------------

### Update Agent Configuration: Stagehand v2 to v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Compares agent configuration in Stagehand v2 and v3. V3 simplifies configuration by incorporating the provider into the model string, renaming 'instructions' to 'systemPrompt', and introducing the 'cua' flag for Computer Use Agent mode. It also removes the 'options' parameter in favor of a model object format for advanced settings.

```typescript
const agent = stagehand.agent({
  provider: "google",
  model: "gemini-2.5-computer-use-preview-10-2025",
  instructions: "You are a helpful assistant that can navigate websites.",
  options: {
    apiKey: process.env.GEMINI_API_KEY
  },
  integrations: ["https://mcp-server.example.com"],
  tools: customTools
});
```

```typescript
const agent = stagehand.agent({
  model: "google/gemini-2.5-computer-use-preview-10-2025",  // Provider now in model string
  systemPrompt: "You are a helpful assistant that can navigate websites.",  // Renamed from 'instructions'
  cua: true,  // NEW: Computer Use Agent mode
  integrations: ["https://mcp-server.example.com"],
  tools: customTools
});
```

--------------------------------

### Stagehand act() Method: v2 timeoutMs vs v3 timeout Parameter

Source: https://docs.stagehand.dev/v3/migrations/v2

Highlights the renaming of the timeout parameter in the `act()` method from `timeoutMs` in Stagehand v2 to `timeout` in v3.

```typescript
await page.act({
  action: "click button",
  timeoutMs: 15000
});

```

```typescript
await stagehand.act("click button", {
  timeout: 15000
});

```

--------------------------------

### Configure Execution Model: Stagehand v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Introduces the `executionModel` option in Stagehand v3, allowing the use of a separate, potentially faster or cheaper, model specifically for tool execution. This enables optimizing costs and performance by distinguishing between high-level reasoning and action execution models.

```typescript
const agent = stagehand.agent({
  model: "anthropic/claude-sonnet-4-5",  // Main reasoning model
  executionModel: "anthropic/claude-haiku-4-5"  // Faster model for tool execution (act, extract, observe)
});

// The agent will use claude-sonnet-4-5 for high-level reasoning
// but claude-haiku-4-5 for executing individual actions
const result = await agent.execute("Complete the checkout process");
```

--------------------------------

### Accessing Page Instance in Stagehand v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates how to access the current page instance in Stagehand v3, addressing the change from direct `stagehand.page` access in v2 to using the Context API or a getter method.

```typescript
// Use context API (recommended)
const page = stagehand.context.pages()[0];

// Or use the convenience getter
const page = stagehand.page;
```

--------------------------------

### Stagehand Initialization: DOM Settle Timeout

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates the renaming of the DOM settlement timeout parameter from `domSettleTimeoutMs` in v2 to `domSettleTimeout` in v3 for improved consistency.

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  domSettleTimeoutMs: 5000
});
```

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  domSettleTimeout: 5000
});
```

--------------------------------

### extract() Method Signature and Location Change in Stagehand

Source: https://docs.stagehand.dev/v3/migrations/v2

In Stagehand v3, the `extract()` method has been moved from the `page` object to the `stagehand` instance. The parameter structure has also been updated for better clarity, with `instruction` and `schema` as positional arguments and `options` as an optional third parameter.

```typescript
import { z } from 'zod/v3';

const result = await page.extract({
  instruction: "extract product details",
  schema: z.object({
    name: z.string(),
    price: z.number()
  }),
  modelName: "openai/gpt-5",
  domSettleTimeoutMs: 5000,
  selector: "xpath=/html/body/div",
  iframes: true
});
```

```typescript
import { z } from 'zod/v3';

// Cleaner parameter structure
const result = await stagehand.extract(
  "extract product details",
  z.object({
    name: z.string(),
    price: z.number()
  }),
  {
    model: "openai/gpt-5",
    selector: ".container", // NEW: CSS selector support
    timeout: 10000,
    page: page  // Optional: specify which page
  }
);
```

--------------------------------

### Stagehand Initialization: Model Configuration

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates the change in Stagehand initialization for model configuration from v2 to v3. Stagehand v3 consolidates `modelName` and `modelClientOptions` into a single `model` parameter, offering both string and object formats for simplicity and advanced settings.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  modelName: "openai/gpt-5",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://custom-proxy.com/v1"
  }
});
```

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

// Option 1: String format (recommended for simplicity, auto-loads model API key from env)
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  model: "openai/gpt-5"
});

// Option 2: Object format (for advanced configuration)
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  model: {
    modelName: "gpt-5",
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://custom-proxy.com/v1"
  }
});
```

--------------------------------

### Stagehand v3 Model Configuration

Source: https://docs.stagehand.dev/v3/migrations/v2

Provides examples of the correct TypeScript syntax for configuring the model in Stagehand v3, supporting both string and object formats for specifying the model and its options.

```typescript
// String format
model: "openai/gpt-5"

// Object format
model: {
  modelName: "openai/gpt-5",
  apiKey: process.env.OPENAI_API_API_KEY
}
```

--------------------------------

### Automatic Iframe Support in Observe (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates the automatic iframe support in Stagehand v3's `observe()` method. Similar to `extract()`, v3 handles iframes inherently, removing the need for the `iframes: true` option.

```typescript
const results = await page.observe({
  instruction: "find elements in iframe",
  iframes: true
});
```

```typescript
// Automatic iframe support
const results = await stagehand.observe("find elements in iframe");
```

--------------------------------

### Configure Model in agent(): Stagehand v2 vs v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates model configuration within the agent() method for Stagehand v2 and v3. V3 supports both string and object formats for model configuration, allowing for advanced settings like `apiKey` and `baseURL` directly within the model object.

```typescript
const agent = stagehand.agent({
  provider: "google",
  model: "gemini-2.5-computer-use-preview-10-2025",
  options: {
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://custom-proxy.com/v1"
  }
});
```

```typescript
// String format (recommended)
const agent = stagehand.agent({
  model: "google/gemini-2.5-computer-use-preview-10-2025"
});

// Object format for advanced configuration
const agent = stagehand.agent({
  model: {
    modelName: "gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://custom-proxy.com/v1"
  }
});
```

--------------------------------

### Stagehand Initialization: Caching Changes

Source: https://docs.stagehand.dev/v3/migrations/v2

Highlights the modification in Stagehand's caching mechanism from a boolean `enableCaching` flag in v2 to a `cacheDir` string parameter in v3, allowing for explicit cache directory specification.

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  enableCaching: true
});
```

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  cacheDir: "./stagehand-cache"  // Specify cache directory
});
```

--------------------------------

### Model Configuration for extract() in Stagehand

Source: https://docs.stagehand.dev/v3/migrations/v2

Stagehand v3 streamlines model configuration within the `extract()` method. While v2 used `modelName` and `modelClientOptions`, v3 consolidates this into the `model` property within the options object, allowing direct specification of the model to be used.

```typescript
const data = await page.extract({
  instruction: "extract data",
  schema: DataSchema,
  modelName: "anthropic/claude-sonnet-4-5",
  modelClientOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY
  }
});
```

```typescript
const data = await stagehand.extract(
  "extract data",
  DataSchema,
  {
    model: "anthropic/claude-sonnet-4-5"
  }
);
```

--------------------------------

### Enhanced ActResult Structure in Stagehand

Source: https://docs.stagehand.dev/v3/migrations/v2

Stagehand v3 provides a more detailed `ActResult` structure compared to v2. The v3 result includes an `actionDescription` for an overall summary and an `actions` array containing detailed information for each step executed.

```typescript
const result = await page.act("click the button");
console.log(result.action);  // Single action string
```

```typescript
const result = await stagehand.act("click the button");
console.log(result.actionDescription);  // Overall description
console.log(result.actions);  // Array of action details

// ActResult structure:
// {
//   success: boolean;
//   message: string;
//   actionDescription: string;
//   actions: Array<{ 
//     selector: string;
//     description: string;
//     method?: string;
//     arguments?: string[];
//   }>;
// }
```

--------------------------------

### V3Context Interface Definition

Source: https://docs.stagehand.dev/v3/references/context

This defines the TypeScript interface for the V3 Context, outlining the methods available for managing browser pages, including `newPage`, `pages`, `activePage`, `setActivePage`, and `close`.

```typescript
interface V3Context {
  newPage(url?: string): Promise<Page>;
  pages(): Page[];
  activePage(): Page | undefined;
  setActivePage(page: Page): void;
  close(): Promise<void>;
}
```

--------------------------------

### Stagehand v3 Agent with Multi-Page Support

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates how to use Stagehand v3 agents to operate on specific web pages. This includes creating new pages and executing agent instructions on a designated page.

```typescript
const page1 = stagehand.page;
const page2 = await stagehand.context.newPage();

const agent = stagehand.agent({
  model: "google/gemini-2.5-computer-use-preview-10-2025"
});

// Execute on specific page
await page2.goto("https://example.com/dashboard");
const result = await agent.execute({
  instruction: "Export the data table",
  page: page2  // Operate on page2 instead of default page
});
```

--------------------------------

### Automatic iframe Interaction in Stagehand

Source: https://docs.stagehand.dev/v3/migrations/v2

Stagehand v3 now automatically handles iframe interactions without requiring an explicit flag. This simplifies testing by removing the need for the 'iframes: true' option when clicking elements within iframes.

```typescript
await page.act({
  action: "click button inside iframe",
  iframes: true  // Required to interact with iframes
});
```

```typescript
// Automatic iframe support - no flag needed
await stagehand.act("click button inside iframe");
```

--------------------------------

### Calling act() Method in Stagehand v3

Source: https://docs.stagehand.dev/v3/migrations/v2

Illustrates the correct way to call the `act()` method in Stagehand v3, highlighting its relocation from the `page` object in v2 to the main `stagehand` instance.

```typescript
// v2 ❌
await page.act("click button");

// v3 ✅
await stagehand.act("click button");
```

--------------------------------

### Update Stagehand Agent Configuration Parameters (TypeScript)

Source: https://docs.stagehand.dev/v3/migrations/v2

Demonstrates the transition from v2's `provider` and `instructions` parameters to v3's `model` and `systemPrompt` for agent configuration. Ensure your model strings are in the correct format.

```typescript
// v2 ❌
const agent = stagehand.agent({
  provider: "anthropic",
  model: "claude-sonnet-4-5",
  instructions: "You are a helpful assistant that..."
});

// v3 ✅
const agent = stagehand.agent({
  model: "anthropic/claude-sonnet-4-5",
  systemPrompt: "You are a helpful assistant that..."
});
```

--------------------------------

### Implement Cache Invalidation Strategies for Stagehand

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

Provides examples of different strategies for invalidating Stagehand caches, including time-based invalidation, version-based invalidation, and using a manual flag. These help ensure that caches do not become stale.

```javascript
// Option 1: Time-based invalidation
if (isCacheOlderThan('cache/workflow', 7)) {
  clearCache('cache/workflow');
}

// Option 2: Version-based invalidation
const CACHE_VERSION = 'v2';
const cacheDir = `cache/workflow-${CACHE_VERSION}`;

// Option 3: Manual invalidation flag
if (process.env.CLEAR_CACHE === 'true') {
  clearCache('cache/workflow');
}
```

--------------------------------

### Schema Best Practices: Python

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Illustrates implementing schema best practices in Python using Pydantic. It shows how to use descriptive field names, correct types (str, float, bool), and `Field` for detailed descriptions to enhance data extraction accuracy with Stagehand. Contrasts good practices with less effective, generic approaches.

```python
from pydantic import BaseModel, Field

  # Good - Descriptive names, correct types, and helpful descriptions
  class ProductData(BaseModel):
      productTitle: str = Field(description="The main product name displayed on the page")
      priceInDollars: float = Field(description="Current selling price as a number, without currency symbol")
      isInStock: bool = Field(description="Whether the product is available for purchase")

  productData = await page.extract(
    "Extract product information",
    schema=ProductData
  )

  # Bad - Generic names, wrong types, no descriptions
  class Data(BaseModel):
      name: str      # Too generic, no context
      price: str     # Should be float, no context
      stock: str     # Should be bool, no context

  data = await page.extract(
    "Get product details",
    schema=Data
  )
```

--------------------------------

### Structured Extraction with Pydantic Schema

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Explains how to extract structured data using Pydantic models. This is the recommended method for complex data extraction, ensuring data integrity and type safety.

```python
from pydantic import BaseModel, Field
from typing import List

class ButtonData(BaseModel):
    text: str = Field(..., description="Button text content")

data = await page.extract(
    instruction="extract the sign in button text",
    schema=ButtonData
)
```

--------------------------------

### Benchmark Workflow Actions (Python)

Source: https://docs.stagehand.dev/v2/best-practices/speed-optimization

Compares the execution time of a series of direct page actions with an optimized approach using `page.observe` to find and execute actions. This helps in identifying performance bottlenecks and the effectiveness of optimization strategies.

```python
import time

# Before optimization  
start = time.time()
await page.act("Fill form")
await page.act("Click submit") 
await page.act("Confirm submission")
print(f"Workflow took {(time.time() - start) * 1000:.0f}ms")  # 8000ms

# After optimization with observe planning
start = time.time()
workflow_actions = await page.observe("Find form, submit, and confirm elements")

# Execute actions sequentially to avoid conflicts
for action in workflow_actions:
    await page.act(action)
print(f"Optimized workflow took {(time.time() - start) * 1000:.0f}ms")  # 500ms
```

--------------------------------

### Automatic Multitab Navigation and Extraction

Source: https://docs.stagehand.dev/v2/best-practices/using-multiple-tabs

This snippet demonstrates Stagehand's automatic adaptation to multitab workflows. The `stagehand.page` object dynamically points to the most recent tab, allowing seamless interaction and data extraction without manual tab switching. No external dependencies are required beyond the Stagehand library.

```typescript
const page = stagehand.page;
await page.goto("https://example.com");
await page.act("click the button that opens a new tab");
// page now automatically points to the new tab
await page.extract("get data from new tab");
```

```python
page = stagehand.page
await page.goto("https://example.com")
await page.act("click the button that opens a new tab")
# page now automatically points to the new tab
await page.extract("get data from new tab")
```

--------------------------------

### Complex Object Extraction with Pydantic Models

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Illustrates extracting complex nested data structures using Pydantic models. This allows for the extraction of detailed information, such as lists of companies with their names and descriptions.

```python
from pydantic import BaseModel, Field
from typing import List

class Company(BaseModel):
    name: str = Field(..., description="Company name")
    description: str = Field(..., description="Brief company description")

class Companies(BaseModel):
    companies: List[Company] = Field(..., description="List of companies")

companies_data = await page.extract(
    "Extract names and descriptions of 5 companies",
    schema=Companies
)
```

--------------------------------

### Core Browser Automation Tools

Source: https://docs.stagehand.dev/integrations/mcp/tools

Tools for modern web automation using natural language commands.

```APIDOC
## POST /browserbase_stagehand_navigate

### Description
Navigate to any URL in the browser.

### Method
POST

### Endpoint
/browserbase_stagehand_navigate

### Parameters
#### Request Body
- **url** (string) - Required - The URL to navigate to.

### Request Example
```json
{
  "url": "https://example.com"
}
```

### Response
#### Success Response (200)
(No specific response fields documented)

## POST /browserbase_stagehand_act

### Description
Perform an action on the web page using natural language.

### Method
POST

### Endpoint
/browserbase_stagehand_act

### Parameters
#### Request Body
- **action** (string) - Required - The action to perform (e.g., “click the login button”, “fill form field”).

### Request Example
```json
{
  "action": "click the submit button"
}
```

### Response
#### Success Response (200)
(No specific response fields documented)

## POST /browserbase_stagehand_extract

### Description
Extract all text content from the current page (filters out CSS and JavaScript).

### Method
POST

### Endpoint
/browserbase_stagehand_extract

### Parameters
No input parameters required.

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **textContent** (string) - The extracted text content of the page.

## POST /browserbase_stagehand_observe

### Description
Observe and find actionable elements on the web page.

### Method
POST

### Endpoint
/browserbase_stagehand_observe

### Parameters
#### Request Body
- **instruction** (string) - Required - Specific instruction for observation (e.g., “find the login button”, “locate search form”).

### Request Example
```json
{
  "instruction": "find the search input field"
}
```

### Response
#### Success Response (200)
- **element** (object) - Information about the observed element.

## POST /browserbase_screenshot

### Description
Capture a PNG screenshot of the current page.

### Method
POST

### Endpoint
/browserbase_screenshot

### Parameters
No input parameters required.

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **image** (string) - Base-64 encoded PNG data of the screenshot.

## GET /browserbase_stagehand_get_url

### Description
Get the current URL of the browser page.

### Method
GET

### Endpoint
/browserbase_stagehand_get_url

### Parameters
No input parameters required.

### Response
#### Success Response (200)
- **url** (string) - Complete URL including protocol, domain, path, and any query parameters or fragments.

## GET /browserbase_stagehand_get_all_urls

### Description
Get current URLs of all active browser sessions.

### Method
GET

### Endpoint
/browserbase_stagehand_get_all_urls

### Parameters
No input parameters required.

### Response
#### Success Response (200)
- **sessionUrls** (object) - Mapping of session IDs to their current URLs in JSON format.
```
```

--------------------------------

### More Flexible Schema Definition (Python)

Source: https://docs.stagehand.dev/v2/basics/extract

Defines a schema with optional fields and flexible types to handle potential variations in data, reducing schema validation errors and type mismatches. Uses `Optional` and type hints for more robust data handling.

```python
class FlexibleProduct(BaseModel):
    price: str = Field(description="price including currency symbol, e.g., '$19.99'")
    availability: Optional[str] = Field(default=None, description="stock status if available")
    rating: Optional[float] = None
```

--------------------------------

### Extract Data with Pydantic Schema in Python

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Shows how to use Stagehand Python's `extract` method to retrieve structured data from a web page, using Pydantic models for schema definition. Requires importing `BaseModel` from `pydantic` and defining the expected data structure.

```python
from pydantic import BaseModel

class ExtractedData(BaseModel):
    some_value: str

result = await page.extract(
    instruction="the instruction to execute",
    schema=ExtractedData
)
```

--------------------------------

### browserbase_screenshot

Source: https://docs.stagehand.dev/v3/integrations/mcp/tools

Captures a PNG screenshot of the current page.

```APIDOC
## browserbase_screenshot

### Description
Capture a PNG screenshot of the current page

### Method
GET

### Endpoint
/browserbase_screenshot

### Parameters
No input parameters required

### Response
#### Success Response (200)
- **image** (string) - Base-64 encoded PNG data
```

--------------------------------

### Array Extraction with Pydantic List

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Shows how to extract a list of strings using Pydantic's List type. This is useful for extracting multiple similar data points, such as all button texts on a page.

```python
from pydantic import BaseModel, Field
from typing import List

class ButtonsData(BaseModel):
    buttons: List[str] = Field(..., description="List of button texts")

data = await page.extract(
    instruction="extract the text inside all buttons",
    schema=ButtonsData
)
```

--------------------------------

### Extract Complex Product Data with TypeScript

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Extracts structured product information from a webpage using a Zod schema. Requires the 'page.extract' method and a defined Zod schema for the expected data structure. Outputs a typed object matching the schema.

```typescript
const productData = await page.extract({
  instruction: "extract product information from this page",
  schema: z.object({
    title: z.string(),
    price: z.number(),
    description: z.string(),
    features: z.array(z.string()),
    availability: z.boolean(),
  }),
});
```

--------------------------------

### Advanced StagehandTool Configuration (Python)

Source: https://docs.stagehand.dev/integrations/crew-ai/configuration

Illustrates customizing the StagehandTool with advanced parameters like DOM settlement timeout, headless mode, self-healing capabilities, CAPTCHA handling, and verbosity levels. This allows for fine-tuning the browser automation behavior.

```python
stagehand_tool = StagehandTool(
    api_key=browserbase_api_key,
    project_id=browserbase_project_id,
    model_api_key=model_api_key,
    model_name=AvailableModel.CLAUDE_3_7_SONNET_LATEST,
    dom_settle_timeout_ms=5000,  # Wait longer for DOM to settle
    headless=True,  # Run browser in headless mode
    self_heal=True,  # Attempt to recover from errors
    wait_for_captcha_solves=True,  # Wait for CAPTCHA solving
    verbose=1,  # Control logging verbosity (0-3)
)
```

--------------------------------

### Troubleshooting: Improve accuracy with specific instructions

Source: https://docs.stagehand.dev/v3/basics/observe

This snippet illustrates how providing more context and specific details in the observation instruction significantly improves the accuracy of element detection compared to a generic instruction.

```typescript
// More specific instructions improve accuracy
// Instead of:
await stagehand.observe("find the button");

// Use context:
await stagehand.observe("find the red 'Delete' button in the user settings panel");
```

--------------------------------

### Configure Context7 MCP Server for Stagehand

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

This snippet configures the Context7 MCP server for Stagehand development. Context7 by Upstash provides semantic search across documentation and codebase context, enabling AI assistants to find relevant code patterns and examples. It requires 'npx' to install the package.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

--------------------------------

### Intelligent Model Switching for Cost Savings

Source: https://docs.stagehand.dev/v3/best-practices/cost-optimization

Implement a strategy to automatically fall back to cheaper LLM models for simpler tasks. This function iterates through a list of models, starting with the least expensive, and uses the first one that successfully processes the prompt.

```typescript
// Use models from least to most expensive based on task complexity
// See stagehand.dev/evals for performance comparisons
async function smartAct(prompt: string) {
  const models = ["google/gemini-2.5-flash", "openai/gpt-4o"];

  for (const model of models) {
    try {
      const stagehand = new Stagehand({
        env: "LOCAL",
        model: model
      });
      await stagehand.init();
      const [action] = await stagehand.observe(prompt);
      await stagehand.act(action);
      await stagehand.close();
      return;
    } catch (error) {
      console.log(`Falling back to ${model}...`);
      await stagehand.close();
    }
  }
}
```

--------------------------------

### Extract Product Data Across Pages (JavaScript)

Source: https://docs.stagehand.dev/v2/basics/extract

This JavaScript snippet demonstrates how to iterate through a list of page numbers, navigate to each page, and extract product data using a specified schema. It includes a timeout for the extraction process and aggregates the product data from all pages.

```javascript
for (const pageNum of pageNumbers) {
  await page.act(`navigate to page ${pageNum}`);
  
  const pageData = await page.extract({
    instruction: "extract product data from the current page only",
    schema: ProductPageSchema,
    timeoutMs: 60000 // 60 second timeout
  });
  
  allData.push(...pageData.products);
}
```