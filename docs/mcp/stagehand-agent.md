### Agent Creation

Source: https://docs.stagehand.dev/v2/references/agent

This section details how to create an instance of an AI agent using the `stagehand.agent()` method. It includes the configuration interface for agents.

```APIDOC
## Agent Creation API

### Description
This API allows for the creation of autonomous AI agents capable of performing multi-step browser workflows. It takes an `AgentConfig` object to define the agent's behavior and capabilities.

### Method
`stagehand.agent(config: AgentConfig): AgentInstance`

### Parameters
#### Request Body (`AgentConfig`)
- **provider** (`AgentProviderType`) - Optional - AI provider for agent functionality. Options: `"anthropic"`, `"openai"`
- **model** (`string`) - Optional - Specific model for agent execution. Examples: `"claude-sonnet-4-20250514"`, `"gpt-4o"
- **instructions** (`string`) - Optional - System instructions defining agent behavior.
- **options** (`Record<string, unknown>`) - Optional - Provider-specific configuration (e.g., `apiKey`, `baseURL`).
- **integrations** (`(Client | string)[]`) - Optional - MCP integrations for external tools and services.
- **tools** (`ToolSet`) - Optional - Custom tool definitions to extend agent capabilities.

### Request Example
```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "instructions": "Navigate the website and find the contact information.",
  "integrations": ["http://example.com/mcp/service"],
  "tools": {
    "get_current_url": {
      "description": "Get the current URL of the browser."
    }
  }
}
```

### Response
#### Success Response (AgentInstance)
- **execute** (`(instructionOrOptions: string | AgentExecuteOptions) => Promise<AgentResult>`) - A method to execute instructions or options on the agent.

#### Response Example
```json
{
  "execute": "[Function Reference]"
}
```
```

--------------------------------

### Agent Creation API

Source: https://docs.stagehand.dev/v3/references/agent

Information on creating an agent instance using the stagehand.agent() method, including its configuration options.

```APIDOC
## POST /agent

### Description
Creates an agent instance for autonomous AI workflows.

### Method
POST

### Endpoint
/agent

### Parameters
#### Request Body
- **config** (AgentConfig) - Optional - Configuration object for the agent.

**AgentConfig Interface:**
```typescript
interface AgentConfig {
  systemPrompt?: string;
  integrations?: (Client | string)[];
  tools?: ToolSet;
  cua?: boolean;
  model?: string | AgentModelConfig<string>;
  executionModel?: string | AgentModelConfig<string>;
}
```

**AgentModelConfig for advanced configuration:**
```typescript
type AgentModelConfig<TModelName extends string = string> = {
  modelName: TModelName;
} & Record<string, unknown>;
```

### Request Example
```json
{
  "config": {
    "systemPrompt": "You are a helpful assistant.",
    "model": "openai/gpt-4o",
    "cua": true
  }
}
```

### Response
#### Success Response (200)
- **agentInstance** (AgentInstance) - The created agent instance.

**AgentInstance Interface:**
```typescript
interface AgentInstance {
  execute: (instructionOrOptions: string | AgentExecuteOptions) => Promise<AgentResult>;
}
```

#### Response Example
```json
{
  "agentInstance": {
    "execute": "[Function: execute]"
  }
}
```
```

--------------------------------

### Create Stagehand Agent Instance (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Instantiates an autonomous AI agent for browser automation. Requires an `AgentConfig` object to define the AI provider, model, instructions, integrations, and tools. The `AgentConfig` interface specifies optional fields for customizing agent behavior.

```typescript
const agent = stagehand.agent(config: AgentConfig): AgentInstance
```

--------------------------------

### Agent Configuration Interface (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Defines the `AgentConfig` interface used for configuring agent behavior. This includes setting a custom `systemPrompt`, providing `integrations` with external services, defining custom `tools`, enabling `cua` (Computer Use Agent) mode, and specifying the `model` and `executionModel` for agent operations. `AgentModelConfig` allows for advanced model-specific settings.

```typescript
interface AgentConfig {
  systemPrompt?: string;
  integrations?: (Client | string)[];
  tools?: ToolSet;
  cua?: boolean;
  model?: string | AgentModelConfig<string>;
  executionModel?: string | AgentModelConfig<string>;
}

type AgentModelConfig<TModelName extends string = string> = {
  modelName: TModelName;
} & Record<string, unknown>;
```

--------------------------------

### Agent Result Structure

Source: https://docs.stagehand.dev/basics/agent

This JSON structure represents the expected return value of the `agent()` function, conforming to a `Promise<AgentResult>`. It includes `success` status, a `message`, an array of `actions` performed by the agent (with `type`, `taskCompleted`, `pageUrl`, and `timestamp`), a final `completed` status, and `usage` metrics.

```json
{
  "success": true,
  "message": "The first name and email fields have been filled successfully with 'John' and 'john@example.com'.",
  "actions": [
    {
      "type": "ariaTree",
      "reasoning": undefined,
      "taskCompleted": true,
      "pageUrl": "https://example.com",
      "timestamp": 1761598722055
    },
    {
      "type": "act",
      "reasoning": undefined,
      "taskCompleted": true,
      "action": "type \"John\" into the First Name textbox",
      "playwrightArguments": {...},
      "pageUrl": "https://example.com",
      "timestamp": 1761598731643
    },
    {
      "type": "close",
      "reasoning": "The first name and email fields have been filled successfully.",
      "taskCompleted": true,
      "taskComplete": true,
      "pageUrl": "https://example.com",
      "timestamp": 1761598732861
    }
  ],
  "completed": true,
  "usage": {
    "input_tokens": 2040,
    "output_tokens": 28,
    "inference_time_ms": 14079
  }
}

```

--------------------------------

### Create a Stagehand Agent with Any LLM (TypeScript)

Source: https://docs.stagehand.dev/basics/agent

This snippet demonstrates initializing a Stagehand agent without specifying a Computer Use Agent configuration, allowing it to work with any LLM provider. It's currently only supported in TypeScript. The agent can then execute simple instructions.

```typescript
const agent = stagehand.agent();
await agent.execute("apply for a job at Browserbase")

```

--------------------------------

### Navigate Before Agent Execution in TypeScript

Source: https://docs.stagehand.dev/v3/basics/agent

This snippet illustrates the best practice of navigating the agent to the target page using `page.goto()` before executing agent instructions. This ensures the agent starts on the correct page, improving task completion accuracy.

```typescript
await page.goto('https://github.com/browserbase/stagehand');
await agent.execute('Get me the latest PR on the stagehand repo');
```

--------------------------------

### Initialize Default Agent (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/agent

Initializes a Stagehand agent without specifying a provider or model, allowing it to use any available LLM. This is currently only supported in TypeScript. The agent is then used to execute a job application task.

```typescript
const agent = stagehand.agent();
await agent.execute("apply for a job at Browserbase")
```

--------------------------------

### Example Agent Execution Response (JSON)

Source: https://docs.stagehand.dev/v2/references/agent

An example of the JSON object returned by the agent's `execute` method. This structure shows a successful execution with details about the actions taken, completion status, metadata, and token usage.

```json
{
  "success": true,
  "message": "Task completed successfully",
  "actions": [
    {
      "action": "click",
      "selector": "button.primary",
      "text": "Submit"
    }
  ],
  "completed": true,
  "metadata": {
    "execution_time": 1000
  },
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "inference_time_ms": 100
  }
}
```

--------------------------------

### Agent Execute Options Interface (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Defines the `AgentExecuteOptions` interface for fine-tuning agent execution. This includes setting the `instruction` for the task, `maxSteps` to limit agent actions, specifying a browser `page` (compatible with Playwright, Puppeteer, Patchright, and Stagehand) for execution context, and enabling `highlightCursor` for visual feedback during operation.

```typescript
interface AgentExecuteOptions {
  instruction: string;
  maxSteps?: number;
  page?: PlaywrightPage | PuppeteerPage | PatchrightPage | Page;
  highlightCursor?: boolean;
}
```

--------------------------------

### Execute Agent Task

Source: https://docs.stagehand.dev/basics/agent

This snippet demonstrates how to execute a task using the agent. It shows a basic example of providing a natural language instruction to the agent for finding specific information. The agent processes the instruction and returns the result.

```javascript
await agent.execute("Find Italian restaurants in Brooklyn that are open after 10pm and have outdoor seating");
```

--------------------------------

### Execute Agent with Open Operator (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/build-agent

Initiates an Open Operator agent to perform a task, such as extracting specific information from a webpage. It first navigates to a URL, then uses the agent to execute an instruction, logging the result. This requires the Stagehand library.

```typescript
await stagehand.page.goto("https://github.com/browserbase/stagehand");

  // Open Operator will use the default LLM from Stagehand config
  const operator = stagehand.agent();
  const { message, actions } = await operator.execute(
  	"Extract the top contributor's username"
  );

  console.log(message);
```

--------------------------------

### Cache Agent Actions with `agent()` in TypeScript

Source: https://docs.stagehand.dev/v3/best-practices/caching

Illustrates how to cache actions performed by an agent, including Computer Use Agent actions. Similar to `act()`, specifying a `cacheDir` in the Stagehand constructor enables caching. The cache key is automatically generated based on the instruction, start URL, execution options, and agent configuration, ensuring that identical agent executions are served from the cache.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "agent-cache", // Specify a cache directory
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://browserbase.github.io/stagehand-eval-sites/sites/drag-drop/");

const agent = stagehand.agent({
  cua: true,
  model: {
    modelName: "google/gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  },
  systemPrompt: "You are a helpful assistant that can use a web browser.",
});

await page.goto("https://play2048.co/");

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached actions
const result = await agent.execute({
  instruction: "play a gane of 2048",
  maxSteps: 20,
});

console.log(JSON.stringify(result, null, 2));
```

--------------------------------

### Create an Agent with MCP Integrations (Exa.ai)

Source: https://docs.stagehand.dev/basics/agent

This code initializes a Computer Use Agent (`cua: true`) with an integration for Exa.ai's MCP. This allows the agent to use web search via Exa.ai for current information before performing browser actions. It requires an OpenAI model, an OpenAI API key, and an Exa API key from environment variables, along with a specific system prompt guiding the agent's behavior.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "openai/computer-use-preview",
        apiKey: process.env.OPENAI_API_KEY
    },
    integrations: [
      `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`,
    ],
    systemPrompt: `You have access to web search through Exa. Use it to find current information before browsing.`
});

await agent.execute("Search for the best headphones of 2025 and go through checkout for the top recommendation");

```

--------------------------------

### Create Stagehand Agents

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Demonstrates creating different types of agents within Stagehand, including a basic agent, an OpenAI agent, and an Anthropic agent, by specifying model and API keys.

```python
# Basic agent (uses default model)
agent = stagehand.agent()

# OpenAI agent
agent = stagehand.agent(
    model="computer-use-preview",
    instructions="You are a helpful web navigation assistant.",
    options={"apiKey": os.getenv("OPENAI_API_KEY")}
)

# Anthropic agent
agent = stagehand.agent(
    model="claude-sonnet-4-20250514",
    instructions="You are a helpful web navigation assistant.",
    options={"apiKey": os.getenv("ANTHROPIC_API_KEY")}
)
```

--------------------------------

### Execute High-Level Task with Stagehand Agent

Source: https://docs.stagehand.dev/v3/basics/agent

Demonstrates the basic usage of the `agent().execute()` method to perform a high-level task. This is a simplified example that doesn't specify LLM provider or advanced configurations.

```typescript
await agent.execute("apply for a job at browserbase")
```

--------------------------------

### Initialize Computer Use Agent (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/agent

Initializes a Stagehand agent configured for computer use with Anthropic's Claude Sonnet model. It requires an API key for the provider and allows for custom instructions to guide the agent's behavior. The agent is then used to execute a job application task.

```typescript
const agent = stagehand.agent({
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    instructions: "You are a helpful assistant that can use a web browser.",
    options: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  });
  await agent.execute("apply for a job at Browserbase")
```

--------------------------------

### Configure and Execute Computer Use Agent with Google Gemini

Source: https://docs.stagehand.dev/v3/basics/agent

Initializes and executes a Computer Use Agent (CUA) configured with Google's Gemini model. This snippet requires setting the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable and specifies custom instructions and a maximum number of steps for the agent's execution.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "google/gemini-2.5-computer-use-preview-10-2025",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    },
    systemPrompt: "You are a helpful assistant...",
});

await agent.execute({
    instruction: "Go to Hacker News and find the most controversial post from today, then read the top 3 comments and summarize the debate.",
    maxSteps: 20,
    highlightCursor: true
})
```

--------------------------------

### Agent Result Response

Source: https://docs.stagehand.dev/v3/references/agent

Details the structure and fields of the AgentResult object returned by the API, including success status, messages, actions, completion status, optional metadata, and usage metrics.

```APIDOC
## Agent Result API Response

### Description
This endpoint returns an AgentResult object that encapsulates the outcome of an agent's execution. It provides information on whether the task was successful, a descriptive message, a list of actions performed, the overall completion status, optional metadata, and usage metrics.

### Method
GET (or POST, depending on context)

### Endpoint
`/websites/stagehand_dev/agent/result`

### Response
#### Success Response (200)
- **success** (boolean) - Whether the task was completed successfully.
- **message** (string) - Description of the execution result and status.
- **actions** (AgentAction[]) - Array of individual actions taken during execution. Each action contains tool-specific data.
- **completed** (boolean) - Whether the agent believes the task is fully complete.
- **metadata** (Record<string, unknown>) - Optional. Additional execution metadata and debugging information.
- **usage** (object) - Optional. Token usage and performance metrics.
  - **input_tokens** (number) - Number of input tokens used.
  - **output_tokens** (number) - Number of output tokens generated.
  - **inference_time_ms** (number) - Total inference time in milliseconds.

#### Response Example
```json
{
  "success": true,
  "message": "Task completed successfully",
  "actions": [
    {
      "type": "act",
      "instruction": "click the submit button",
      "reasoning": "User requested to submit the form",
      "taskCompleted": false
    },
    {
      "type": "observe",
      "instruction": "check if submission was successful",
      "taskCompleted": true
    }
  ],
  "completed": true,
  "metadata": {
    "steps_taken": 2
  },
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 340,
    "inference_time_ms": 2500
  }
}
```
```

--------------------------------

### Execute a Task with the Stagehand Agent

Source: https://docs.stagehand.dev/basics/agent

This snippet demonstrates the basic usage of the `agent.execute()` method to perform a high-level task. It requires an initialized `agent` object. The function takes a string instruction as input and returns a Promise.

```typescript
await agent.execute("apply for a job at browserbase")

```

--------------------------------

### AgentExecuteOptions Interface Definition (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Specifies options for executing an agent's task. Key parameters include the natural language `instruction`, `maxSteps` to limit actions, `autoScreenshot` to capture screen state, `waitBetweenActions` for delays, and optional `context` to guide the agent.

```typescript
interface AgentExecuteOptions {
  instruction: string;
  maxSteps?: number;
  autoScreenshot?: boolean;
  waitBetweenActions?: number;
  context?: string;
}
```

--------------------------------

### Create Agent Instance (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

This snippet demonstrates how to create an agent instance using the `stagehand.agent()` method. It accepts an optional `AgentConfig` object for customization. The `AgentConfig` interface allows defining system prompts, integrations, tools, CUA mode, and model configurations. The returned `AgentInstance` has an `execute` method to run instructions.

```typescript
const agent = stagehand.agent(config?: AgentConfig): AgentInstance
```

--------------------------------

### Agent Execution API

Source: https://docs.stagehand.dev/v3/references/agent

Details on executing instructions using the agent.execute() method, including available options and parameters.

```APIDOC
## POST /agent/execute

### Description
Executes an instruction or a set of options using the agent.

### Method
POST

### Endpoint
/agent/execute

### Parameters
#### Request Body
- **instructionOrOptions** (string | AgentExecuteOptions) - Required - The instruction or options to execute.

**AgentExecuteOptions Interface:**
```typescript
interface AgentExecuteOptions {
  instruction: string;
  maxSteps?: number;
  page?: PlaywrightPage | PuppeteerPage | PatchrightPage | Page;
  highlightCursor?: boolean;
}
```

### Request Example
**String Instruction:**
```json
{
  "instructionOrOptions": "Go to google.com and search for the latest AI news."
}
```

**With Options:**
```json
{
  "instructionOrOptions": {
    "instruction": "Find the contact information on the page.",
    "maxSteps": 5,
    "highlightCursor": true
  }
}
```

### Response
#### Success Response (200)
- **result** (AgentResult) - The result of the agent's execution.

#### Response Example
```json
{
  "result": {
    "data": "Contact information found successfully."
  }
}
```
```

--------------------------------

### Create Stagehand Agent

Source: https://docs.stagehand.dev/v3/references/stagehand

Creates an AI agent instance for managing autonomous, multi-step workflows. The agent can be configured using an optional `AgentConfig` object. Refer to the agent() reference for detailed documentation on its capabilities.

```typescript
stagehand.agent(config?: AgentConfig): AgentInstance
```

--------------------------------

### Execute Computer Use Agent with Stagehand (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/computer-use

Assigns a task to a Stagehand Computer Use Agent. It first navigates to a website, then configures the agent with a specified provider (Anthropic or OpenAI), model, custom instructions, and API key. Finally, it executes the agent to perform a given task.

```typescript
await stagehand.page.goto("https://www.google.com");

const agent = stagehand.agent({
	// You can use either OpenAI or Anthropic
	provider: "anthropic",
	// The model to use (computer-use-preview for OpenAI)
	model: "claude-sonnet-4-20250514",

	// Customize the system prompt
	instructions: `You are a helpful assistant that can use a web browser.
	Do not ask follow up questions, the user will trust your judgement.`,

	// Customize the API key
	options: {
		apiKey: process.env.ANTHROPIC_API_KEY,
	},
});

// Execute the agent
await agent.execute("Apply for a library card at the San Francisco Public Library");
```

--------------------------------

### Cache Agent Actions with Stagehand's agent() Function

Source: https://docs.stagehand.dev/best-practices/caching

This example shows how to cache actions performed by Stagehand's `agent()` function, including Computer Use Agent actions. Similar to `act()`, specifying a `cacheDir` enables caching. The cache key is automatically generated based on the instruction, start URL, and agent execution options. This ensures that subsequent runs with identical parameters reuse cached results, saving inference costs and time. The example includes setting up a Computer Use Agent and executing an instruction.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "agent-cache", // Specify a cache directory
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://browserbase.github.io/stagehand-eval-sites/sites/drag-drop/");

const agent = stagehand.agent({
  cua: true,
  model: {
    modelName: "google/gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  },
  systemPrompt: "You are a helpful assistant that can use a web browser.",
});

await page.goto("https://play2048.co/");

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached actions
const result = await agent.execute({
  instruction: "play a gane of 2048",
  maxSteps: 20,
});

console.log(JSON.stringify(result, null, 2));

```

--------------------------------

### AgentResult Interface Definition (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Defines the structure for agent execution results, including success status, messages, a list of actions taken, completion status, optional metadata, and usage metrics. The AgentAction interface specifies fields for individual tool actions.

```typescript
interface AgentResult {
  success: boolean;
  message: string;
  actions: AgentAction[];
  completed: boolean;
  metadata?: Record<string, unknown>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    inference_time_ms: number;
  };
}

// AgentAction can contain various tool-specific fields
interface AgentAction {
  type: string;
  reasoning?: string;
  taskCompleted?: boolean;
  action?: string;
  timeMs?: number;        // wait tool
  pageText?: string;      // ariaTree tool
  pageUrl?: string;       // ariaTree tool
  instruction?: string;   // various tools
  [key: string]: unknown; // Additional tool-specific fields
}
```

--------------------------------

### Navigate to Target Page Before Agent Execution

Source: https://docs.stagehand.dev/v2/basics/agent

Ensures the agent performs actions on the correct webpage by navigating to it first. This improves accuracy and efficiency compared to instructing the agent to find the page itself.

```typescript
await page.goto('https://github.com/browserbase/stagehand');
      await agent.execute('Get me the latest PR on the stagehand repo');
```

```typescript
await agent.execute('Go to GitHub and find the latest PR on browserbase/stagehand');
```

--------------------------------

### Create Stagehand Agents with TypeScript

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Demonstrates creating Stagehand agents with different configurations, including a basic default agent, an OpenAI agent with specific model and API key, and an Anthropic agent. Requires the '@browserbasehq/stagehand' library.

```typescript
// Basic agent (default)
const agent = stagehand.agent();

// OpenAI agent
const agent = stagehand.agent({
  provider: "openai",
  model: "computer-use-preview",
  instructions: "You are a helpful assistant that can use a web browser.",
  options: { 
    apiKey: process.env.OPENAI_API_KEY 
  }
});

// Anthropic agent
const agent = stagehand.agent({
  provider: "anthropic", 
  model: "claude-sonnet-4-20250514",
  instructions: "You are a helpful assistant that can use a web browser.",
  options: { 
    apiKey: process.env.ANTHROPIC_API_KEY 
  }
});
```

--------------------------------

### Execute Agent Task (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Executes a task using the AI agent. The `execute` method can be called with a simple string instruction or a more detailed `AgentExecuteOptions` object, which allows for controlling parameters like `maxSteps`, `autoScreenshot`, and `waitBetweenActions`.

```typescript
// String instruction
await agent.execute(instruction: string): Promise<AgentResult>

// With options
await agent.execute(options: AgentExecuteOptions): Promise<AgentResult>
```

--------------------------------

### AgentResult JSON Structure

Source: https://docs.stagehand.dev/v3/basics/agent

Illustrates the structure of the `AgentResult` object returned by the `agent().execute()` method. This includes fields like `success`, `message`, `actions`, `completed`, and `usage` statistics.

```json
{
  "success": true,
  "message": "The first name and email fields have been filled successfully with 'John' and 'john@example.com'.",
  "actions": [
    {
      "type": "ariaTree",
      "reasoning": undefined,
      "taskCompleted": true,
      "pageUrl": "https://example.com",
      "timestamp": 1761598722055
    },
    {
      "type": "act",
      "reasoning": undefined,
      "taskCompleted": true,
      "action": "type \"John\" into the First Name textbox",
      "playwrightArguments": {...},
      "pageUrl": "https://example.com",
      "timestamp": 1761598731643
    },
    {
      "type": "close",
      "reasoning": "The first name and email fields have been filled successfully.",
      "taskCompleted": true,
      "taskComplete": true,
      "pageUrl": "https://example.com",
      "timestamp": 1761598732861
    }
  ],
  "completed": true,
  "usage": {
    "input_tokens": 2040,
    "output_tokens": 28,
    "inference_time_ms": 14079
  }
}
```

--------------------------------

### Configure and Execute Computer Use Agent with OpenAI

Source: https://docs.stagehand.dev/v3/basics/agent

Initializes and executes a Computer Use Agent (CUA) configured with an OpenAI model. This snippet requires setting the `OPENAI_API_KEY` environment variable and defines the agent's system prompt, execution instruction, and maximum steps.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "openai/computer-use-preview",
        apiKey: process.env.OPENAI_API_KEY
    },
    systemPrompt: "You are a helpful assistant...",
});

await agent.execute({
    instruction: "Go to Hacker News and find the most controversial post from today, then read the top 3 comments and summarize the debate.",
    maxSteps: 20,
    highlightCursor: true
})
```

--------------------------------

### Analyzing Agent History

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

Shows how to use `stagehand.history` to analyze the actions performed by an agent during a workflow. It initializes Stagehand, navigates to a page, executes an agent instruction, retrieves the history, and logs the counts of different operation types (agent, act, navigate). The history is also saved to a JSON file.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import fs from "fs/promises";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "cache/workflow"
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://example.com");

const agent = stagehand.agent({
  cua: true,
  model: {
    modelName: "google/gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  },
  systemPrompt: "You are a helpful assistant that can use a web browser.",
});

await agent.execute({
  instruction: "Complete the login process",
  maxSteps: 10
});

// Analyze what the agent did
const history = await stagehand.history;

console.log(`\nWorkflow Analysis:`);
console.log(`Total operations: ${history.length}`);

const agentOps = history.filter(e => e.method === 'agent');
const actOps = history.filter(e => e.method === 'act');
const navOps = history.filter(e => e.method === 'navigate');

console.log(`- Agent executions: ${agentOps.length}`);
console.log(`- Act operations: ${actOps.length}`);
console.log(`- Navigate operations: ${navOps.length}`);

// Save for documentation
await fs.writeFile(
  'workflow-analysis.json',
  JSON.stringify(history, null, 2)
);

await stagehand.close();
```

--------------------------------

### Advanced Stagehand Model Configuration with API Key and Base URL (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Illustrates advanced configuration for the Stagehand agent's model, allowing specification of the model name, API key, and a custom base URL for the LLM provider. This is useful for custom proxies or specific API endpoint requirements. It then executes a task to 'Complete the checkout process'.

```typescript
// Using AgentModelConfig for advanced configuration
const agent = stagehand.agent({
  model: {
    modelName: "anthropic/claude-sonnet-4-20250514",
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: "https://custom-proxy.com/v1"
  }
});

const result = await agent.execute("Complete the checkout process");
```

--------------------------------

### Start on Target Page Before Agent Execution

Source: https://docs.stagehand.dev/basics/agent

This example shows the recommended practice of navigating to the target web page using `page.goto()` before executing an agent task. This ensures the agent begins its work on the correct page, improving reliability for tasks like retrieving the latest information from a specific repository.

```typescript
await page.goto('https://github.com/browserbase/stagehand');
await agent.execute('Get me the latest PR on the stagehand repo');


```

--------------------------------

### Configure and Execute Computer Use Agent with Anthropic Claude

Source: https://docs.stagehand.dev/v3/basics/agent

Initializes and executes a Computer Use Agent (CUA) configured with Anthropic's Claude model. This snippet requires setting the `ANTHROPIC_API_KEY` environment variable and specifies the agent's system prompt, the instruction for execution, and the maximum number of steps.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "anthropic/claude-sonnet-4-20250514",
        apiKey: process.env.ANTHROPIC_API_KEY
    },
    systemPrompt: "You are a helpful assistant...",
});

await agent.execute({
    instruction: "Go to Hacker News and find the most controversial post from today, then read the top 3 comments and summarize the debate.",
    maxSteps: 20,
    highlightCursor: true
})
```

--------------------------------

### Initialize StagehandTool and Create Agent (Python)

Source: https://docs.stagehand.dev/integrations/crew-ai/configuration

Demonstrates initializing the StagehandTool with API keys and configuring a CrewAI agent. The StagehandTool enables agents to interact with websites, and the agent is defined with its role, goal, and available tools.

```python
import os
from crewai import Agent, Task, Crew
from crewai_tools import StagehandTool
from stagehand.schemas import AvailableModel

# Get API keys from environment
browserbase_api_key = os.environ.get("BROWSERBASE_API_KEY")
browserbase_project_id = os.environ.get("BROWSERBASE_PROJECT_ID")
model_api_key = os.environ.get("OPENAI_API_KEY")  # or ANTHROPIC_API_KEY

# Initialize the StagehandTool
stagehand_tool = StagehandTool(
    api_key=browserbase_api_key,
    project_id=browserbase_project_id,
    model_api_key=model_api_key,
    model_name=AvailableModel.GPT_4O,  # or AvailableModel.CLAUDE_3_7_SONNET_LATEST
)

# Create an agent with the tool
researcher = Agent(
    role="Web Researcher",
    goal="Find and summarize information from websites",
    backstory="I'm an expert at finding information online.",
    verbose=True,
    tools=[stagehand_tool],
)
```

--------------------------------

### Execute Agent Method

Source: https://docs.stagehand.dev/v2/references/agent

This section explains how to use the `execute` method on an `AgentInstance` to perform tasks. It covers executing with a simple string instruction or with detailed options.

```APIDOC
## Agent Execute Method API

### Description
This method allows you to send instructions to the AI agent and receive results. You can provide a simple string instruction or a more detailed `AgentExecuteOptions` object for finer control over the execution process.

### Method
`agent.execute(instruction: string): Promise<AgentResult>`
`agent.execute(options: AgentExecuteOptions): Promise<AgentResult>`

### Parameters
#### Request Body (`AgentExecuteOptions`)
- **instruction** (`string`) - Required - High-level task description in natural language.
- **maxSteps** (`number`) - Optional - Maximum number of actions the agent can take. Default: `20`.
- **autoScreenshot** (`boolean`) - Optional - Whether to take screenshots before each action. Default: `true`.
- **waitBetweenActions** (`number`) - Optional - Delay in milliseconds between actions. Default: `0`.
- **context** (`string`) - Optional - Additional context or constraints for the agent.

### Request Example (with options)
```json
{
  "instruction": "Find the login button and click it.",
  "maxSteps": 10,
  "autoScreenshot": false,
  "waitBetweenActions": 500,
  "context": "The user is on the homepage."
}
```

### Response
#### Success Response (200) (`AgentResult`)
- **success** (`boolean`) - Whether the task was completed successfully.
- **message** (`string`) - Description of the execution result and status.
- **actions** (`AgentAction[]`) - Array of individual actions taken during execution.
- **completed** (`boolean`) - Whether the agent believes the task is fully complete.
- **metadata** (`Record<string, unknown>`) - Additional execution metadata and debugging information.
- **usage** (`object`) - Token usage and performance metrics (contains `input_tokens`, `output_tokens`, `inference_time_ms`).

#### Response Example
```json
{
  "success": true,
  "message": "Login button clicked successfully.",
  "actions": [
    {
      "action": "find_element",
      "selector": "#login-button",
      "text": "Login"
    },
    {
      "action": "click",
      "selector": "#login-button"
    }
  ],
  "completed": false,
  "metadata": {
    "search_time": 150
  },
  "usage": {
    "input_tokens": 200,
    "output_tokens": 75,
    "inference_time_ms": 250
  }
}
```
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

### Provide Specific Instructions to Agent

Source: https://docs.stagehand.dev/v2/basics/agent

Enhances agent task completion by providing detailed and specific instructions. Vague instructions can lead to irrelevant or incomplete results.

```typescript
await agent.execute("Find Italian restaurants in Brooklyn that are open after 10pm and have outdoor seating");
```

```typescript
await agent.execute("Find a restaurant");
```

--------------------------------

### Example AgentResult JSON Response

Source: https://docs.stagehand.dev/v3/references/agent

Illustrates a typical JSON response conforming to the AgentResult interface. It shows a successful task completion with details on the actions performed and token usage.

```json
{
  "success": true,
  "message": "Task completed successfully",
  "actions": [
    {
      "type": "act",
      "instruction": "click the submit button",
      "reasoning": "User requested to submit the form",
      "taskCompleted": false
    },
    {
      "type": "observe",
      "instruction": "check if submission was successful",
      "taskCompleted": true
    }
  ],
  "completed": true,
  "metadata": {
    "steps_taken": 2
  },
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 340,
    "inference_time_ms": 2500
  }
}
```

--------------------------------

### Initialize Agent with Exa Integration (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/agent

Initializes a Stagehand agent with OpenAI's 'computer-use-preview' model and integrates with Exa.ai for web search capabilities. It requires API keys for both OpenAI and Exa, and custom instructions guide the agent to use web search for current information before browsing.

```typescript
const agent = stagehand.agent({
    provider: "openai",
    model: "computer-use-preview",
    integrations: [
      `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`,
    ],
    instructions: `You have access to web search through Exa. Use it to find current information before browsing.`,
    options: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  await agent.execute("Search for the best headphones of 2025 and go through checkout for the top recommendation");
```

--------------------------------

### AgentResult Interface Definition (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Defines the structure of the result returned by the agent's `execute` method. It includes a `success` status, a descriptive `message`, an array of `actions` performed, a `completed` flag, optional `metadata`, and `usage` statistics for tokens and inference time.

```typescript
interface AgentResult {
  success: boolean;
  message: string;
  actions: AgentAction[];
  completed: boolean;
  metadata?: Record<string, unknown>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    inference_time_ms: number;
  };
}
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

### Stagehand Multi-Page Operations (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Demonstrates how to handle multiple pages within Stagehand. This snippet shows how to get an existing page and create a new page using `stagehand.context.newPage()`. It then navigates to a specific URL on the new page and executes an agent task on that page.

```typescript
const page1 = stagehand.context.pages()[0];
const page2 = await stagehand.context.newPage();

const agent = stagehand.agent();

// Execute on specific page
await page2.goto("https://example.com/dashboard");
const result = await agent.execute({
  instruction: "Export the data table",
  page: page2
});
```

--------------------------------

### AgentInstance Interface Definition (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Represents an instance of an AI agent capable of executing tasks. The primary method is `execute`, which takes either a string instruction or an `AgentExecuteOptions` object and returns a `Promise<AgentResult>`.

```typescript
interface AgentInstance {
  execute: (instructionOrOptions: string | AgentExecuteOptions) => Promise<AgentResult>;
}
```

--------------------------------

### AgentConfig Interface Definition (TypeScript)

Source: https://docs.stagehand.dev/v2/references/agent

Defines the configuration options for creating an AI agent. It includes settings for the AI provider (e.g., 'openai', 'anthropic'), specific model names, system instructions, provider-specific options, MCP integrations, and custom tool definitions.

```typescript
interface AgentConfig {
  provider?: AgentProviderType;  // "openai" | "anthropic"
  model?: string;
  instructions?: string;
  options?: Record<string, unknown>;
  integrations?: (Client | string)[];
  tools?: ToolSet;
}
```

--------------------------------

### Create a Computer Use Agent (Google Gemini)

Source: https://docs.stagehand.dev/basics/agent

This code snippet shows how to initialize a Stagehand agent configured for computer use with Google's Gemini model. It requires specifying `cua: true`, the model name, an API key from environment variables, and an optional system prompt. The agent can then execute detailed instructions with specific configurations like `maxSteps` and `highlightCursor`.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "google/gemini-2.5-computer-use-preview-10-2025",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    },
    systemPrompt: "You are a helpful assistant...",
});

await agent.execute({
    instruction: "Go to Hacker News and find the most controversial post from today, then read the top 3 comments and summarize the debate.",
    maxSteps: 20,
    highlightCursor: true
})

```

--------------------------------

### Poor Agent Instructions Example (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/mcp-integrations

This TypeScript code snippet presents an example of poorly defined agent instructions. The instructions are vague and lack specific details about the agent's capabilities or how to use them, which can lead to inefficient or incorrect agent behavior.

```typescript
instructions: "You can search and save data."
```

--------------------------------

### Execute Computer Use Agent Task with Anthropic Claude

Source: https://docs.stagehand.dev/v3/best-practices/computer-use

Configures and executes a Computer Use Agent using Anthropic's Claude model. This example demonstrates setting up the agent with Anthropic's specific model name and API key, along with a system prompt. The `execute` method is then called with a detailed instruction and step limit, ensuring controlled agent behavior.

```typescript
await page.goto("https://www.google.com/");
const agent = stagehand.agent({
    cua: true,
    model: {
        modelName: "anthropic/claude-sonnet-4-20250514",
        apiKey: process.env.ANTHROPIC_API_KEY
    },
    systemPrompt: "You are a helpful assistant...",
});

await agent.execute({
    instruction: "Go to Hacker News and find the most controversial post from today, then read the top 3 comments and summarize the debate.",
    maxSteps: 20,
    highlightCursor: true
})
```

--------------------------------

### Initialize Stagehand and Execute Basic Task (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Demonstrates the basic initialization of Stagehand with Browserbase environment and execution of a simple agent task. It requires Browserbase API key and Project ID to be set as environment variables. The output includes the agent's message, completion status, and the number of actions taken.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

// Initialize with Browserbase (API key and project ID from environment variables)
// Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in your environment
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  model: "anthropic/claude-sonnet-4-20250514"
});
await stagehand.init();

const page = stagehand.context.pages()[0];
// Create agent with default configuration
const agent = stagehand.agent();

// Navigate to a page
await page.goto("https://www.google.com");

// Execute a task
const result = await agent.execute("Search for 'Stagehand automation' and click the first result");

console.log(result.message);
console.log(`Completed: ${result.completed}`);
console.log(`Actions taken: ${result.actions.length}`);
```

--------------------------------

### Initialize Stagehand Agent with Google Computer Use Model (TypeScript)

Source: https://docs.stagehand.dev/v3/best-practices/computer-use

Initializes a Stagehand agent using a Google computer use model. Requires the GOOGLE_GENERATIVE_AI_API_KEY environment variable to be set.

```typescript
const agent = stagehand.agent({
    cua: true,
    model: "google/gemini-2.5-computer-use-preview-10-2025",
    // GOOGLE_GENERATIVE_AI_API_KEY is auto-loaded - set in your .env
});
```

--------------------------------

### Execute Basic Agent Task (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/agent

Demonstrates the basic usage of the agent to execute a high-level task. This function takes a natural language command and automates the browser actions required to fulfill it. No explicit configuration is shown here, implying default settings.

```typescript
agent.execute("apply for a job at browserbase")
```