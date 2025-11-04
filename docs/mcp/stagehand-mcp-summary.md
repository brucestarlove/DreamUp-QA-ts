# Stagehand: AI-Powered Browser Automation Framework

Stagehand is a browser automation framework that combines natural language AI capabilities with Playwright's reliable web automation. It solves the fundamental trade-off in browser automation: traditional frameworks like Playwright require brittle CSS selectors that break with UI changes, while pure AI agents are unpredictable and difficult to debug. Stagehand provides four core primitives—Act, Extract, Observe, and Agent—that let developers choose exactly how much AI to use in their automations, from single deterministic actions to fully autonomous multi-step workflows.

Built by Browserbase for production environments, Stagehand supports both TypeScript and Python, works with all major LLM providers (OpenAI, Anthropic, Google), and integrates seamlessly with cloud browser infrastructure. It enables self-healing automations that adapt when websites change, structured data extraction with type safety, and intelligent element discovery—all while maintaining full Playwright compatibility for maximum flexibility.

## Installation and Setup

### TypeScript Installation

```bash
npm install @browserbasehq/stagehand playwright zod
npx playwright install
```

### Python Installation

```bash
pip install stagehand
# or with uv
uv add stagehand
```

### Basic Configuration

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

const stagehand = new Stagehand({
  env: "BROWSERBASE",  // or "LOCAL"
  modelName: "google/gemini-2.5-flash",
  modelClientOptions: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

await stagehand.init();
const page = stagehand.page;

// Your automation code here

await stagehand.close();
```

```python
import os
from stagehand import Stagehand
from pydantic import BaseModel

stagehand = Stagehand(
    env="BROWSERBASE",  # or "LOCAL"
    model_name="google/gemini-2.5-flash",
    model_api_key=os.getenv("GOOGLE_API_KEY")
)

await stagehand.init()
page = stagehand.page

# Your automation code here

await stagehand.close()
```

## Act: Execute Natural Language Actions

### Single Action Execution

```typescript
await page.goto("https://github.com/browserbase/stagehand");
await page.act("click the star button");
await page.act("scroll to the bottom of the page");
await page.act("type 'browser automation' in the search box");
```

```python
await page.goto("https://github.com/browserbase/stagehand")
await page.act("click the star button")
await page.act("scroll to the bottom of the page")
await page.act("type 'browser automation' in the search box")
```

### Advanced Actions with Variables

```typescript
const username = "user@example.com";
const password = process.env.USER_PASSWORD;

await page.act({
  action: "enter %username% in the email field",
  variables: { username }
});

await page.act({
  action: "enter %password% in the password field",
  variables: { password }  // Sensitive data not sent to LLM
});

await page.act("click the login button");
```

```python
username = "user@example.com"
password = os.getenv("USER_PASSWORD")

await page.act(
    "enter %username% in the email field",
    variables={"username": username}
)

await page.act(
    "enter %password% in the password field",
    variables={"password": password}  # Sensitive data not sent to LLM
)

await page.act("click the login button")
```

### Custom Model Configuration

```typescript
await page.act({
  action: "click the submit button",
  modelName: "openai/gpt-4.1",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0
  },
  timeoutMs: 60000,
  domSettleTimeoutMs: 45000,
  iframes: true
});
```

```python
await page.act(
    "click the submit button",
    model_name="openai/gpt-4.1",
    model_client_options={
        "apiKey": os.getenv("OPENAI_API_KEY"),
        "temperature": 0
    },
    timeout_ms=60000,
    dom_settle_timeout_ms=45000,
    iframes=True
)
```

## Extract: Structured Data Extraction

### Single Object Extraction

```typescript
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  rating: z.number().optional(),
  inStock: z.boolean()
});

await page.goto("https://example-store.com/product/123");

const product = await page.extract({
  instruction: "extract the product details",
  schema: ProductSchema
});

console.log(product.name);    // Type-safe access
console.log(product.price);   // Type-safe access
console.log(product.inStock); // Type-safe access
```

```python
from pydantic import BaseModel
from typing import Optional

class Product(BaseModel):
    name: str
    price: float
    rating: Optional[float] = None
    in_stock: bool

await page.goto("https://example-store.com/product/123")

product = await page.extract(
    instruction="extract the product details",
    schema=Product
)

print(product.name)     # Type-safe access
print(product.price)    # Type-safe access
print(product.in_stock) # Type-safe access
```

### Array Extraction

```typescript
const ListingSchema = z.object({
  apartments: z.array(z.object({
    address: z.string().describe("the full street address"),
    price: z.string().describe("monthly rent with currency"),
    bedrooms: z.number(),
    squareFeet: z.string()
  }))
});

await page.goto("https://rental-site.com/listings");

const listings = await page.extract({
  instruction: "Extract ALL apartment listings with their details",
  schema: ListingSchema
});

for (const apt of listings.apartments) {
  console.log(`${apt.bedrooms}br at ${apt.address}: ${apt.price}`);
}
```

```python
from pydantic import BaseModel, Field
from typing import List

class Apartment(BaseModel):
    address: str = Field(description="the full street address")
    price: str = Field(description="monthly rent with currency")
    bedrooms: int
    square_feet: str

class Listings(BaseModel):
    apartments: List[Apartment]

await page.goto("https://rental-site.com/listings")

listings = await page.extract(
    instruction="Extract ALL apartment listings with their details",
    schema=Listings
)

for apt in listings.apartments:
    print(f"{apt.bedrooms}br at {apt.address}: {apt.price}")
```

### URL Extraction

```typescript
const NavSchema = z.object({
  links: z.array(z.object({
    text: z.string(),
    url: z.string().url()  // URL validation
  }))
});

const navigation = await page.extract({
  instruction: "extract all navigation links from the header",
  schema: NavSchema
});

for (const link of navigation.links) {
  console.log(`${link.text}: ${link.url}`);
}
```

```python
from pydantic import BaseModel, HttpUrl
from typing import List

class NavLink(BaseModel):
    text: str
    url: HttpUrl  # URL validation

class Navigation(BaseModel):
    links: List[NavLink]

navigation = await page.extract(
    instruction="extract all navigation links from the header",
    schema=Navigation
)

for link in navigation.links:
    print(f"{link.text}: {link.url}")
```

### Scoped Extraction with Selector

```typescript
// First observe to find the target section
const [dataTable] = await page.observe("find the pricing comparison table");

// Then extract only from that section (10x token reduction)
const PricingSchema = z.object({
  plans: z.array(z.object({
    name: z.string(),
    price: z.number(),
    features: z.array(z.string())
  }))
});

const pricing = await page.extract({
  instruction: "extract all pricing plan details",
  schema: PricingSchema,
  selector: dataTable.selector  // Limit extraction scope
});
```

```python
# First observe to find the target section
tables = await page.observe("find the pricing comparison table")
data_table = tables[0]

# Then extract only from that section (10x token reduction)
class PricingPlan(BaseModel):
    name: str
    price: float
    features: List[str]

class Pricing(BaseModel):
    plans: List[PricingPlan]

pricing = await page.extract(
    instruction="extract all pricing plan details",
    schema=Pricing,
    selector=data_table.selector  # Limit extraction scope
)
```

### Simple String Extraction

```typescript
// Extract without schema
const title = await page.extract("get the page title");
console.log(title.extraction);  // Returns { extraction: string }

// Get raw page content
const content = await page.extract();
console.log(content.page_text);  // Returns accessibility tree
```

```python
# Extract without schema
title = await page.extract("get the page title")
print(title["extraction"])  # Returns {"extraction": str}

# Get raw page content
content = await page.extract()
print(content["page_text"])  # Returns accessibility tree
```

## Observe: Discover Actionable Elements

### Element Discovery

```typescript
await page.goto("https://github.com/login");

const elements = await page.observe("find all form inputs and buttons");

// Each result contains:
// {
//   selector: "xpath=/html/body/div/form/input[1]",
//   description: "Email input field in login form",
//   method: "fill",
//   arguments: []
// }

for (const el of elements) {
  console.log(`${el.description} -> ${el.method}`);
}
```

```python
await page.goto("https://github.com/login")

elements = await page.observe("find all form inputs and buttons")

# Each result contains:
# {
#   "selector": "xpath=/html/body/div/form/input[1]",
#   "description": "Email input field in login form",
#   "method": "fill",
#   "arguments": []
# }

for el in elements:
    print(f"{el.description} -> {el.method}")
```

### Observe-Then-Act Pattern (No LLM Calls)

```typescript
// Observe once to plan actions
const [loginButton, signupButton] = await page.observe(
  "find the login and signup buttons"
);

// Validate the action
if (loginButton && loginButton.method === "click") {
  // Execute without additional LLM call
  await page.act(loginButton);
}
```

```python
# Observe once to plan actions
buttons = await page.observe("find the login and signup buttons")
login_button = buttons[0]
signup_button = buttons[1] if len(buttons) > 1 else None

# Validate the action
if login_button and login_button.method == "click":
    # Execute without additional LLM call
    await page.act(login_button)
```

### Multi-Step Action Planning

```typescript
// Plan all form actions at once
const formFields = await page.observe("find all form fields in order");

const formData = {
  0: "John Doe",
  1: "john@example.com",
  2: "1234567890",
  3: "Submit"
};

// Execute each action (no additional LLM calls)
for (let i = 0; i < formFields.length; i++) {
  const field = formFields[i];

  if (field.method === "fill") {
    await page.act(field);
    await page.keyboard.type(formData[i]);
  } else if (field.method === "click") {
    await page.act(field);
  }
}
```

```python
# Plan all form actions at once
form_fields = await page.observe("find all form fields in order")

form_data = {
    0: "John Doe",
    1: "john@example.com",
    2: "1234567890",
    3: "Submit"
}

# Execute each action (no additional LLM calls)
for i, field in enumerate(form_fields):
    if field.method == "fill":
        await page.act(field)
        await page.keyboard.type(form_data[i])
    elif field.method == "click":
        await page.act(field)
```

### Action Validation

```typescript
const prompt = "click the checkout button";

try {
  await page.act(prompt);
} catch (error) {
  if (error.message.includes("method not supported")) {
    // Observe to validate the method
    const [action] = await page.observe(prompt);

    if (action && action.method === "click") {
      await page.act(action);
    } else {
      throw new Error(`Expected click, got ${action?.method}`);
    }
  } else {
    throw error;
  }
}
```

```python
prompt = "click the checkout button"

try:
    await page.act(prompt)
except Exception as error:
    if "method not supported" in str(error):
        # Observe to validate the method
        results = await page.observe(prompt)
        action = results[0]

        if action and action.method == "click":
            await page.act(action)
        else:
            raise Exception(f"Expected click, got {action.method if action else 'none'}")
    else:
        raise error
```

## Agent: Autonomous Multi-Step Workflows

### Basic Agent Execution

```typescript
const agent = stagehand.agent({
  provider: "google",
  model: "gemini-2.5-computer-use-preview-10-2025",
  instructions: "You are a helpful assistant that can automate web tasks.",
  options: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

await page.goto("https://github.com");

const result = await agent.execute(
  "Find the browserbase/stagehand repository and star it"
);

if (result.success) {
  console.log("Task completed successfully!");
} else {
  console.log("Task failed:", result.message);
}
```

```python
agent = stagehand.agent({
    "provider": "google",
    "model": "gemini-2.5-computer-use-preview-10-2025",
    "instructions": "You are a helpful assistant that can automate web tasks.",
    "options": {
        "apiKey": os.getenv("GOOGLE_API_KEY"),
    },
})

await page.goto("https://github.com")

result = await agent.execute(
    "Find the browserbase/stagehand repository and star it"
)

if result.success:
    print("Task completed successfully!")
else:
    print(f"Task failed: {result.message}")
```

### Complex Multi-Step Task with Max Steps

```typescript
const agent = stagehand.agent({
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  instructions: "You are an expert at job applications. Be thorough and accurate.",
  options: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
});

await page.goto("https://jobs.example.com/search");

const result = await agent.execute({
  instruction: `
    Search for "software engineer" jobs in "San Francisco".
    Filter by remote work only.
    Apply to the top 3 positions using my resume.
    Save the job URLs for reference.
  `,
  maxSteps: 40  // Complex task needs more steps
});

if (result.success) {
  console.log("Applied to 3 jobs successfully!");
  // Extract confirmation details
  const confirmations = await page.extract({
    instruction: "extract application confirmation numbers",
    schema: z.object({
      applications: z.array(z.object({
        company: z.string(),
        position: z.string(),
        confirmationId: z.string()
      }))
    })
  });
  console.log(confirmations);
} else {
  console.log(`Task incomplete after ${result.stepsExecuted} steps`);
}
```

```python
agent = stagehand.agent({
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "instructions": "You are an expert at job applications. Be thorough and accurate.",
    "options": {
        "apiKey": os.getenv("ANTHROPIC_API_KEY"),
    },
})

await page.goto("https://jobs.example.com/search")

result = await agent.execute({
    "instruction": """
        Search for "software engineer" jobs in "San Francisco".
        Filter by remote work only.
        Apply to the top 3 positions using my resume.
        Save the job URLs for reference.
    """,
    "max_steps": 40  # Complex task needs more steps
})

if result.success:
    print("Applied to 3 jobs successfully!")
    # Extract confirmation details
    class Application(BaseModel):
        company: str
        position: str
        confirmation_id: str

    class Confirmations(BaseModel):
        applications: List[Application]

    confirmations = await page.extract(
        instruction="extract application confirmation numbers",
        schema=Confirmations
    )
    print(confirmations)
else:
    print(f"Task incomplete after {result.steps_executed} steps")
```

### Agent with MCP Integrations

```typescript
import { connectToMCPServer } from "@browserbasehq/stagehand";

// Connect to external services via MCP
const exaSearch = `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`;

const agent = stagehand.agent({
  provider: "google",
  model: "gemini-2.5-computer-use-preview-10-2025",
  integrations: [exaSearch],  // Give agent web search capabilities
  instructions: `
    You have access to web search through Exa.
    Use it to find current information before browsing websites.
  `,
  options: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

const result = await agent.execute({
  instruction: "Search for the best noise-cancelling headphones of 2025 and add the top recommendation to cart",
  maxSteps: 30
});
```

```python
# MCP integrations currently only supported in TypeScript
# Use standard agent for Python
agent = stagehand.agent({
    "provider": "google",
    "model": "gemini-2.5-computer-use-preview-10-2025",
    "instructions": "You are a helpful shopping assistant.",
    "options": {
        "apiKey": os.getenv("GOOGLE_API_KEY"),
    },
})

result = await agent.execute({
    "instruction": "Find the best noise-cancelling headphones and add to cart",
    "max_steps": 30
})
```

### Non-CUA Agent (Any LLM)

```typescript
// Use Stagehand agent without computer use models
const agent = stagehand.agent({
  instructions: "You are a helpful web automation assistant."
});

await page.goto("https://news.ycombinator.com");

const result = await agent.execute({
  instruction: "Find the top 5 posts and save their titles and URLs",
  maxSteps: 20
});
```

## Caching Actions for Performance

### File-Based Action Cache

```typescript
import { readFile, writeFile } from "fs/promises";

async function getCache(key: string): Promise<ObserveResult | undefined> {
  try {
    const cache = JSON.parse(await readFile("cache.json", "utf-8"));
    return cache[key];
  } catch {
    return undefined;
  }
}

async function setCache(key: string, value: ObserveResult): Promise<void> {
  let cache = {};
  try {
    cache = JSON.parse(await readFile("cache.json", "utf-8"));
  } catch {}
  cache[key] = value;
  await writeFile("cache.json", JSON.stringify(cache, null, 2));
}

async function actWithCache(
  page: Page,
  prompt: string,
  selfHeal = false
) {
  try {
    let action = await getCache(prompt);

    if (!action) {
      // Observe once and cache
      [action] = await page.observe(prompt);
      await setCache(prompt, action);
    }

    // Execute cached action (no LLM call)
    await page.act(action);
  } catch (error) {
    if (selfHeal) {
      console.log("Self-healing with fresh LLM call...");
      await page.act(prompt);
    } else {
      throw error;
    }
  }
}

// Usage
await actWithCache(page, "click the login button", true);
await actWithCache(page, "click the submit button", true);
```

```python
import json
import aiofiles
from typing import Optional, Dict, Any

async def get_cache(key: str) -> Optional[Dict[str, Any]]:
    try:
        async with aiofiles.open("cache.json", "r") as f:
            cache = json.loads(await f.read())
            return cache.get(key)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

async def set_cache(key: str, value: Dict[str, Any]) -> None:
    try:
        async with aiofiles.open("cache.json", "r") as f:
            cache = json.loads(await f.read())
    except (FileNotFoundError, json.JSONDecodeError):
        cache = {}

    cache[key] = value
    async with aiofiles.open("cache.json", "w") as f:
        await f.write(json.dumps(cache, indent=2))

async def act_with_cache(
    page,
    prompt: str,
    self_heal: bool = False
):
    try:
        action = await get_cache(prompt)

        if not action:
            # Observe once and cache
            results = await page.observe(prompt)
            action = results[0]
            await set_cache(prompt, action)

        # Execute cached action (no LLM call)
        await page.act(action)
    except Exception as error:
        if self_heal:
            print("Self-healing with fresh LLM call...")
            await page.act(prompt)
        else:
            raise error

# Usage
await act_with_cache(page, "click the login button", True)
await act_with_cache(page, "click the submit button", True)
```

## Environment Configuration

### Browserbase Cloud Environment

```typescript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
  browserbaseSessionCreateParams: {
    proxies: true,
    region: "us-west-2",
    timeout: 3600,
    keepAlive: true,
    browserSettings: {
      viewport: { width: 1920, height: 1080 },
      blockAds: true,
      solveCaptchas: true,
      recordSession: true,
    },
  },
});

const result = await stagehand.init();
console.log("Live View:", result.sessionUrl);
console.log("Debug:", result.debugUrl);
console.log("Session ID:", result.sessionId);
```

```python
stagehand = Stagehand(
    env="BROWSERBASE",
    api_key=os.getenv("BROWSERBASE_API_KEY"),
    project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
    browserbase_session_create_params={
        "proxies": True,
        "region": "us-west-2",
        "timeout": 3600,
        "keep_alive": True,
        "browser_settings": {
            "viewport": {"width": 1920, "height": 1080},
            "block_ads": True,
            "solve_captchas": True,
            "record_session": True,
        },
    },
)

result = await stagehand.init()
print(f"Live View: {result.session_url}")
print(f"Debug: {result.debug_url}")
print(f"Session ID: {result.session_id}")
```

### Local Development Environment

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  localBrowserLaunchOptions: {
    headless: false,
    devtools: true,
    viewport: { width: 1280, height: 720 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  },
});

await stagehand.init();
```

```python
stagehand = Stagehand(
    env="LOCAL",
    headless=False,
    local_browser_launch_options={
        "devtools": True,
        "viewport": {"width": 1280, "height": 720},
        "args": [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
    },
)

await stagehand.init()
```

### Connect to Existing Browser

```typescript
// Connect to your running Chrome instance
const stagehand = new Stagehand({
  env: "LOCAL",
  localBrowserLaunchOptions: {
    cdpUrl: 'http://localhost:9222'
  }
});

await stagehand.init();
// Now automate your actual browser with extensions and history
```

```python
# Connect to your running Chrome instance
stagehand = Stagehand(
    env="LOCAL",
    local_browser_launch_options={
        "cdp_url": "http://localhost:9222"
    }
)

await stagehand.init()
# Now automate your actual browser with extensions and history
```

## Model Configuration

### Using Different LLM Providers

```typescript
// Google Gemini (Recommended)
const stagehand = new Stagehand({
  modelName: "google/gemini-2.5-flash",
  modelClientOptions: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

// OpenAI
const stagehand = new Stagehand({
  modelName: "openai/gpt-4.1",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    maxTokens: 4096
  },
});

// Anthropic
const stagehand = new Stagehand({
  modelName: "anthropic/claude-3-7-sonnet-latest",
  modelClientOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
});
```

```python
# Google Gemini (Recommended)
stagehand = Stagehand(
    model_name="google/gemini-2.5-flash",
    model_api_key=os.getenv("GOOGLE_API_KEY")
)

# OpenAI
stagehand = Stagehand(
    model_name="openai/gpt-4.1",
    model_api_key=os.getenv("OPENAI_API_KEY")
)

# Anthropic
stagehand = Stagehand(
    model_name="anthropic/claude-3-7-sonnet-latest",
    model_api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

## Summary

Stagehand excels at building production-grade browser automations that combine AI flexibility with code precision. The four primitives—Act, Extract, Observe, and Agent—cover the full spectrum from deterministic single actions to autonomous multi-step workflows. Use Act for self-healing button clicks and form fills, Extract for type-safe data scraping with Zod/Pydantic schemas, Observe for intelligent element discovery and action caching, and Agent for complex end-to-end workflows like job applications or research tasks. The framework's observe-then-act pattern enables significant performance optimization by caching actions and avoiding redundant LLM calls.

Integration patterns vary by use case: combine Observe→Act for cost-optimized form automation, Observe→Extract for targeted data scraping with 10x token reduction, and Agent for autonomous workflows with success validation. Stagehand works seamlessly with Browserbase's cloud infrastructure for production scale (stealth mode, proxies, session recording) or locally for development (DevTools, custom Chrome paths). Full Playwright compatibility means you can mix AI-powered actions with traditional selectors, while support for LangChain, CrewAI, and MCP enables advanced agentic workflows with external tool access. The framework handles security through variable substitution for credentials, supports all major LLM providers, and provides comprehensive error handling and retry mechanisms.
