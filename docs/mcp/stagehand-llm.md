### Environment Variables Setup for LLM API Keys

Source: https://docs.stagehand.dev/v2/configuration/models

Configure essential API keys for various LLM providers to enable Stagehand to connect and utilize their services. Ensure you choose and set up keys for one or more providers based on your needs.

```bash
# Choose one or more providers
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
GROQ_API_KEY=your_groq_key_here
```

--------------------------------

### LLM Request File Structure (JSON)

Source: https://docs.stagehand.dev/v3/configuration/logging

This JSON structure represents a typical LLM request saved to a file when 'logInferenceToFile' is enabled. It includes the model call type, messages (system and user prompts), and the DOM content passed to the LLM.

```json
{
  "modelCall": "act",
  "messages": [
    {
      "role": "system",
      "content": "You are a browser automation assistant. You have access to these actions:\n- click\n- type\n- scroll\n..."
    },
    {
      "role": "user",
      "content": "Click the sign in button\n\nDOM:\n<html>\n  <body>\n    <button id=\"btn-1\">Sign In</button>\n    <button id=\"btn-2\">Sign Up</button>\n  </body>\n</html>"
    }
  ]
}
```

--------------------------------

### LLM Response File Structure (JSON)

Source: https://docs.stagehand.dev/v3/configuration/logging

This JSON structure shows an example of an LLM response saved to a file. It typically includes the model response type, the raw response from the LLM (e.g., selector, method, reasoning), and potentially other metadata.

```json
{
  "modelResponse": "act",
  "rawResponse": {
    "selector": "#btn-1",
    "method": "click",
    "reasoning": "Found sign in button with ID btn-1"
  }
}
```

--------------------------------

### Example LLM Inference Response File Structure

Source: https://docs.stagehand.dev/configuration/logging

Illustrates the format of a file containing the LLM's output, including the model response, selector, method, and reasoning.

```json
{
  "modelResponse": "act",
  "rawResponse": {
    "selector": "#btn-1",
    "method": "click",
    "reasoning": "Found sign in button with ID btn-1"
  }
}

```

--------------------------------

### Integrate Stagehand with custom LLM via Vercel AI SDK (TypeScript)

Source: https://docs.stagehand.dev/v2/configuration/models

Initializes Stagehand using a custom LLM client based on the Vercel AI SDK, specifically for Amazon Bedrock with the Claude-3-7-Sonnet model. This demonstrates integrating external LLM providers that support structured outputs.

```typescript
// Install/import the provider you want to use.
// For example, to use OpenAI, import `openai` from @ai-sdk/openai
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { AISdkClient } from "./external_clients/aisdk";

const stagehand = new Stagehand({
  llmClient: new AISdkClient({
	model: bedrock("anthropic.claude-3-7-sonnet-20250219-v1:0"),
  }),
});
```

--------------------------------

### Example LLM Inference Call File Structure

Source: https://docs.stagehand.dev/configuration/logging

Demonstrates the structure of a file containing a complete LLM request, including the model call, system messages, user messages, and the DOM context.

```json
{
  "modelCall": "act",
  "messages": [
    {
      "role": "system",
      "content": "You are a browser automation assistant. You have access to these actions:\n- click\n- type\n- scroll\n..."
    },
    {
      "role": "user",
      "content": "Click the sign in button\n\nDOM:\n<html>\n  <body>\n    <button id=\"btn-1\">Sign In</button>\n    <button id=\"btn-2\">Sign Up</button>\n  </body>\n</html>"
    }
  ]
}

```

--------------------------------

### Example LLM Inference Summary File Structure

Source: https://docs.stagehand.dev/configuration/logging

Shows the structure of a summary file that aggregates LLM calls with metrics such as timestamps, input/output files, token counts, and inference time.

```json
{
  "act_summary": [
    {
      "act_inference_type": "act",
      "timestamp": "20250127_123456",
      "LLM_input_file": "20250127_123456_act_call.txt",
      "LLM_output_file": "20250127_123456_act_response.txt",
      "prompt_tokens": 3451,
      "completion_tokens": 45,
      "inference_time_ms": 951
    },
    {
      "act_inference_type": "act",
      "timestamp": "20250127_123501",
      "LLM_input_file": "20250127_123501_act_call.txt",
      "LLM_output_file": "20250127_123501_act_response.txt",
      "prompt_tokens": 2890,
      "completion_tokens": 38,
      "inference_time_ms": 823
    }
  ]
}

```

--------------------------------

### Log LLM Inference JSON Example

Source: https://docs.stagehand.dev/v2/configuration/logging

This JSON log structure captures details of a completed LLM inference. It specifies the category, a message indicating completion, the log level, and auxiliary data such as the model used, token counts (prompt and completion), and execution time. This helps in monitoring and analyzing LLM performance.

```json
{
  "category": "llm",
  "message": "inference completed", 
  "level": 1,
  "auxiliary": {
    "model": "gpt-4o",
    "tokens": {"prompt": 3451, "completion": 45},
    "executionTime": {"value": "951", "unit": "ms"}
  }
}
```

--------------------------------

### Extract Data with Custom LLM Models

Source: https://docs.stagehand.dev/v3/references/extract

This snippet shows how to extract data using custom LLM models with Stagehand. It includes examples of specifying models by string name or by providing a custom configuration object with API keys. This allows for flexibility in choosing different LLM providers and models.

```typescript
import {
  z
} from 'zod';

const DataSchema = z.object({
  title: z.string(),
  content: z.string()
});

// Using string format
const data1 = await stagehand.extract(
  "extract article data",
  DataSchema,
  { model: "openai/gpt-5-mini" }
);

// Using object format with custom configuration
const data2 = await stagehand.extract(
  "extract article data",
  DataSchema,
  {
    model: {
      modelName: "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY
    }
  }
);

```

--------------------------------

### LLM Inference Summary File Structure (JSON)

Source: https://docs.stagehand.dev/v3/configuration/logging

This JSON object represents an aggregate summary of LLM inferences, often saved to a file like 'act_summary.json'. It lists individual inference records, including timestamps, associated input/output files, token counts, and inference times.

```json
{
  "act_summary": [
    {
      "act_inference_type": "act",
      "timestamp": "20250127_123456",
      "LLM_input_file": "20250127_123456_act_call.txt",
      "LLM_output_file": "20250127_123456_act_response.txt",
      "prompt_tokens": 3451,
      "completion_tokens": 45,
      "inference_time_ms": 951
    },
    {
      "act_inference_type": "act",
      "timestamp": "20250127_123501",
      "LLM_input_file": "20250127_123501_act_call.txt",
      "LLM_output_file": "20250127_123501_act_response.txt",
      "prompt_tokens": 2890,
      "completion_tokens": 38,
      "inference_time_ms": 823
    }
  ]
}
```

--------------------------------

### Enable LLM Inference Logging to File

Source: https://docs.stagehand.dev/configuration/logging

Configures Stagehand for local development to log complete LLM request and response dumps to disk for offline analysis. This feature creates timestamped files in the './inference_summary/' directory.

```javascript
const stagehand = new Stagehand({
  env: "LOCAL",
  verbose: 2,
  logInferenceToFile: true,  // Writes files to ./inference_summary/
});

```

--------------------------------

### Enable LLM Inference Logging to File

Source: https://docs.stagehand.dev/v3/configuration/logging

This example demonstrates initializing Stagehand for local development with a higher verbosity level and enabling the 'logInferenceToFile' option. This setting causes all LLM requests and responses to be saved to disk for debugging purposes.

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  verbose: 2,
  logInferenceToFile: true  // Writes files to ./inference_summary/
});
```

--------------------------------

### Enable LLM Inference Logging to File

Source: https://docs.stagehand.dev/v2/configuration/logging

This snippet shows how to configure Stagehand to log detailed information about all LLM interactions directly to files. Setting the `logInferenceToFile` (TypeScript) or `log_inference_to_file` (Python) option to `true` will create an `inference_summary/` directory to store these logs. The function takes Stagehand configuration options as input.

```TypeScript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  logInferenceToFile: true,  // Creates inference_summary/ directory
  verbose: 2
});
```

```Python
stagehand = Stagehand(
    env="BROWSERBASE",
    log_inference_to_file=True,  # Creates inference_summary/ directory
    verbose=2
)
```

--------------------------------

### Cache Observed Actions to Reduce Model Costs

Source: https://docs.stagehand.dev/v2/basics/act

Optimize LLM usage and ensure consistent execution by caching observed actions. This prevents repeated LLM calls for the same instructions. Actions are stored in a map and retrieved if already observed.

```typescript
// Cost-optimized actions with caching
const actionCache = new Map();

const getCachedAction = async (instruction: string) => {
  if (actionCache.has(instruction)) {
    return actionCache.get(instruction);
  }
  
  const [action] = await page.observe(instruction);
  actionCache.set(instruction, action);
  return action;
};

// Reuse cached actions
const loginAction = await getCachedAction("click the login button");
await page.act(loginAction);
```

```python
# Cost-optimized actions with caching
action_cache = {}

async def get_cached_action(instruction: str):
    if instruction in action_cache:
        return action_cache[instruction]
    
    results = await page.observe(instruction)
    if results:
        action = results[0]
        action_cache[instruction] = action
        return action
    
    return None

# Reuse cached actions
login_action = await get_cached_action("click the login button")
if login_action:
    await page.act(login_action)
```

--------------------------------

### Configure Browserbase and LLM API Keys (Shell)

Source: https://docs.stagehand.dev/integrations/crew-ai/configuration

Sets up essential API keys as environment variables for Browserbase and a chosen Large Language Model (LLM) like OpenAI or Anthropic. These keys are required for authentication and operation of the tools.

```bash
BROWSERBASE_API_KEY="your-browserbase-api-key"
BROWSERBASE_PROJECT_ID="your-browserbase-project-id"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

--------------------------------

### Intelligent Model Switching in TypeScript and Python

Source: https://docs.stagehand.dev/v2/best-practices/cost-optimization

Automatically fall back to cheaper LLM models for simpler tasks. This function iterates through a list of models from least to most expensive, attempting to execute a prompt with each until successful.

```TypeScript
// Use models from least to most expensive based on task complexity
// See stagehand.dev/evals for performance comparisons
async function smartAct(page: Page, prompt: string) {
  const models = ["cheaper-model", "premium-model"];
  
  for (const model of models) {
    try {
      const stagehand = new Stagehand({ modelName: model });
      await stagehand.init();
      const [action] = await stagehand.page.observe(prompt);
      await stagehand.page.act(action);
      return;
    } catch (error) {
      console.log(`Falling back to ${model}...`);
    }
  }
}
```

```Python
# Use models from least to most expensive based on task complexity
# See stagehand.dev/evals for performance comparisons
async def smart_act(page, prompt: str):
    models = ["cheaper-model", "premium-model"]
    
    for model in models:
        try:
            stagehand = Stagehand(model_name=model)
            await stagehand.init()
            actions = await stagehand.page.observe(prompt)
            action = actions[0]
            await stagehand.page.act(action)
            return
        except Exception:
            print(f"Falling back to {model}...")
```

--------------------------------

### Advanced Configuration for Extract (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

This example illustrates advanced configuration options for the `extract()` function, allowing customization of the LLM model, request timeout, and the scope of the extraction using a CSS or XPath selector.

```typescript
const result = await stagehand.extract("extract the repository name", {
  model: "anthropic/claude-sonnet-4-5",
  timeout: 30000,
  selector: "//header" // Focus on specific area
});
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

### Intelligent Model Switching with Stagehand

Source: https://docs.stagehand.dev/best-practices/cost-optimization

Implements a strategy to automatically fall back to cheaper LLM models for simpler tasks. It iterates through a list of models from least to most expensive, attempting inference and falling back on errors.

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

### Initialize Stagehand with OpenAI GPT-4 (TypeScript & Python)

Source: https://docs.stagehand.dev/v2/configuration/models

Initializes the Stagehand client with the OpenAI GPT-4.1 model. Requires an OpenAI API key set in the environment variables. Supports both TypeScript and Python.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  modelName: "openai/gpt-4.1",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

```python
import os
from stagehand import Stagehand

stagehand = Stagehand(
    model_name="openai/gpt-4.1",
    model_api_key=os.getenv("OPENAI_API_KEY")
)
```

--------------------------------

### Install Vercel AI SDK packages for Amazon Bedrock (npm, pnpm, yarn)

Source: https://docs.stagehand.dev/v2/configuration/models

Installs the necessary Vercel AI SDK packages, including the core `ai` package and the `@ai-sdk/amazon-bedrock` provider. This enables integration with Amazon Bedrock through Stagehand.

```bash
npm install ai @ai-sdk/amazon-bedrock
```

```bash
pnpm install ai @ai-sdk/amazon-bedrock
```

```bash
yarn add ai @ai-sdk/amazon-bedrock
```

--------------------------------

### Enable Automatic Caching with Stagehand

Source: https://docs.stagehand.dev/best-practices/cost-optimization

Demonstrates how to enable automatic action caching by specifying a `cacheDir` when initializing Stagehand. This eliminates redundant LLM calls, reducing costs on subsequent runs.

```javascript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "action-cache", // Enable automatic caching
});

await stagehand.init();

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached action (no LLM cost)
await stagehand.act("Click the sign in button");

```

--------------------------------

### Stagehand Custom LLM Model Configuration

Source: https://docs.stagehand.dev/v3/references/observe

Illustrates how to configure Stagehand to use specific Large Language Models (LLMs) for element observation. It covers using a string format for model names and an object format for custom configurations, including API keys and timeouts.

```typescript
// Using string format model
const elements = await stagehand.observe("find important call-to-action buttons", {
  model: "openai/gpt-4o",
  timeout: 45000
});

// Using object format with custom configuration
const actions = await stagehand.observe("find navigation links", {
  model: {
    modelName: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  timeout: 30000
});
```

--------------------------------

### Stagehand Action with Variables

Source: https://docs.stagehand.dev/v3/references/act

Demonstrates how to use variables within Stagehand actions. These variables are local to the action and not shared with LLM providers. It shows typing into fields and then clicking a login button.

```typescript
// Variables are NOT shared with LLM providers
await stagehand.act("type %username% into the email field", {
  variables: { username: "user@example.com" }
});

await stagehand.act("type %password% into the password field", {
  variables: { password: process.env.USER_PASSWORD }
});

await stagehand.act("click the login button");
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

### Execute High-Level Task with Stagehand Agent

Source: https://docs.stagehand.dev/v3/basics/agent

Demonstrates the basic usage of the `agent().execute()` method to perform a high-level task. This is a simplified example that doesn't specify LLM provider or advanced configurations.

```typescript
await agent.execute("apply for a job at browserbase")
```

--------------------------------

### Optimize Multi-Step Actions with Observe - Python

Source: https://docs.stagehand.dev/v2/best-practices/speed-optimization

Reduces LLM calls by planning multiple actions with a single `observe()` call and executing them sequentially. This is significantly faster than individual `act()` calls, making it ideal for multi-step workflows.

```python
await page.act("Fill name field")        # LLM call #1
await page.act("Fill email field")       # LLM call #2  
await page.act("Select country dropdown") # LLM call #3

form_fields = await page.observe("Find all form fields to fill")

for field in form_fields:
    await page.act(field) # No LLM calls!
```

--------------------------------

### Initialize Stagehand with Google Gemini (TypeScript & Python)

Source: https://docs.stagehand.dev/v2/configuration/models

Initializes the Stagehand client with the Google Gemini 2.5 Flash model. Requires a Google API key set in the environment variables. Supports both TypeScript and Python.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  modelName: "google/gemini-2.5-flash",
  modelClientOptions: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});
```

```python
import os
from stagehand import Stagehand

stagehand = Stagehand(
    model_name="google/gemini-2.5-flash",
    model_api_key=os.getenv("GOOGLE_API_KEY")
)
```

--------------------------------

### Initialize Stagehand with Anthropic Claude-3 Sonnet (TypeScript & Python)

Source: https://docs.stagehand.dev/v2/configuration/models

Initializes the Stagehand client with the Anthropic Claude-3-7-Sonnet model. Requires an Anthropic API key set in the environment variables. Supports both TypeScript and Python.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  modelName: "anthropic/claude-3-7-sonnet-latest",
  modelClientOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
});
```

```python
import os
from stagehand import Stagehand

stagehand = Stagehand(
    model_name="anthropic/claude-3-7-sonnet-latest",
    model_api_key=os.getenv("ANTHROPIC_API_KEY")
)
```

--------------------------------

### Optimize Multi-Step Actions with Observe - TypeScript

Source: https://docs.stagehand.dev/v2/best-practices/speed-optimization

Reduces LLM calls by planning multiple actions with a single `observe()` call and executing them sequentially. This is significantly faster than individual `act()` calls, making it ideal for multi-step workflows.

```typescript
await page.act("Fill name field");        // LLM call #1
await page.act("Fill email field");       // LLM call #2
await page.act("Select country dropdown"); // LLM call #3

const formFields = await page.observe("Find all form fields to fill");

for (const field of formFields) {
  await page.act(field); // No LLM calls!
}
```

--------------------------------

### Monitor Token Usage and Estimate Costs

Source: https://docs.stagehand.dev/v3/best-practices/cost-optimization

Track LLM token usage to monitor spending and identify optimization opportunities. This code snippet accesses Stagehand's metrics to calculate total tokens and estimate the associated cost based on a per-token rate.

```typescript
// Monitor token usage
const metrics = await stagehand.metrics;
console.log(`Total tokens: ${metrics.totalPromptTokens + metrics.totalCompletionTokens}`);
console.log(`Estimated cost: $${(metrics.totalPromptTokens + metrics.totalCompletionTokens) * 0.00001}`);
```

--------------------------------

### Build LangGraph Agents with Stagehand Tools (JavaScript)

Source: https://docs.stagehand.dev/integrations/langchain/configuration

Shows how to integrate Stagehand tools into a LangGraph agent for creating complex automation workflows. It involves creating an LLM instance and then initializing a React agent with the Stagehand toolkit.

```javascript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

// Create an LLM
const llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0,
});

// Create an agent with Stagehand tools
const agent = createReactAgent({
    llm,
    tools: stagehandToolkit.tools,
});

// Execute a complex workflow
const result = await agent.invoke({
    messages: [
        {
            role: "user", 
            content: "Go to example.com, find the contact form, and extract all the form fields"
        }
    ]
});
```

--------------------------------

### Enable Caching in Stagehand

Source: https://docs.stagehand.dev/v3/best-practices/cost-optimization

Implement automatic action caching by specifying a `cacheDir` when initializing Stagehand. This eliminates redundant LLM calls, reducing costs on subsequent runs by reusing cached actions.

```typescript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "action-cache", // Enable automatic caching
});

await stagehand.init();

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached action (no LLM cost)
await stagehand.act("Click the sign in button");
```

--------------------------------

### Optimize Multi-Step Actions with Observe in TypeScript

Source: https://docs.stagehand.dev/v3/best-practices/speed-optimization

Replace sequential 'act()' calls with a single 'observe()' call to plan multiple actions. This reduces LLM inference, leading to a 2-3x speed improvement for multi-step workflows.

```typescript
await stagehand.act("Fill name field");        // LLM call #1
await stagehand.act("Fill email field");       // LLM call #2
await stagehand.act("Select country dropdown"); // LLM call #3

// Use single observe to plan all form fields - one LLM call
const formFields = await stagehand.observe("Find all form fields to fill");

// Execute all actions without LLM inference
for (const field of formFields) {
  await stagehand.act(field); // No LLM calls!
}
```

--------------------------------

### Secure Automations with Variables

Source: https://docs.stagehand.dev/v3/basics/act

Demonstrates how to use variables for sensitive data like passwords and API keys within Stagehand's `act()` function. Variables are not shared with LLM providers and can be loaded from environment variables, enhancing security.

```typescript
// Variables use %variableName% syntax in the instruction
await stagehand.act("type %username% into the email field", {
  variables: { username: "user@example.com" }
});

await stagehand.act("type %password% into the password field", {
  variables: { password: process.env.USER_PASSWORD }
});

await stagehand.act("click the login button");
```

--------------------------------

### Secure Automations with Variables for Sensitive Data

Source: https://docs.stagehand.dev/v2/basics/act

Protect sensitive information like passwords and API keys by using variables. These variables are not shared with LLM providers. Load sensitive data from environment variables to avoid hardcoding secrets.

```typescript
await page.act({
  action: "enter %username% in the email field",
  variables: {
    username: "user@example.com"
  }
});

await page.act({
  action: "enter %password% in the password field",
  variables: {
    password: process.env.USER_PASSWORD
  }
});
```

```python
# If using Python, set `use_api: true` in your Stagehand configuration

await page.act(
  "enter %username% in the email field",
  variables={
      "username": "user@example.com"
  }
)

await page.act(
  "enter %password% in the password field",
  variables={
      "password": os.environ.get("USER_PASSWORD")
  }
)
```

--------------------------------

### Extract with No Parameters (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

This code snippet shows how to call `extract()` without any parameters. In this mode, it returns the accessibility tree representation of the page without applying any LLM processing, providing raw page structure information.

```typescript
const result = await stagehand.extract();
```

--------------------------------

### Plan then Execute Workflow with observe() and act()

Source: https://docs.stagehand.dev/basics/observe

This example illustrates a best practice: first using observe() to discover all necessary actions (like form fields) and then iterating through them to execute each action using act(). This approach avoids repeated LLM calls, making the process 2-3x faster.

```javascript
const formFields = await stagehand.observe("find all form input fields");

for (const field of formFields) {
  await stagehand.act(field); // No LLM call
}
```

--------------------------------

### Improve Accuracy with Specific Instructions in TypeScript

Source: https://docs.stagehand.dev/basics/observe

This code snippet illustrates how to improve the accuracy of `observe()` by using more specific instructions. It contrasts a general instruction with a context-rich one to guide the LLM towards the desired element.

```typescript
// More specific instructions improve accuracy
// Instead of:
// await stagehand.observe("find the button");

// Use context:
await stagehand.observe("find the red 'Delete' button in the user settings panel");
```

--------------------------------

### Stagehand Performance Comparison: With Auto-Caching (Subsequent Runs)

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

Demonstrates the significant performance improvement on subsequent runs of a Stagehand agent when auto-caching is enabled. These runs are drastically faster and consume zero LLM tokens by reusing the cached results.

```javascript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "cache/workflow" // Reuses cache
});

const result = await agent.execute({
  instruction: "Complete workflow",
  maxSteps: 10
});

// Subsequent runs: ~2-3 seconds, 0 tokens ← 10-100x faster!
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

### Implement Smart Caching in TypeScript and Python

Source: https://docs.stagehand.dev/v2/best-practices/cost-optimization

Cache successful actions to avoid repeated LLM calls and reduce costs. This snippet demonstrates how to cache and retrieve actions using `setCache` and `getCache` functions in both TypeScript and Python.

```TypeScript
// Cache successful actions
const [action] = await page.observe("Click the sign in button");
await setCache("sign_in_button", action);

// Reuse cached action (no LLM cost)
const cachedAction = await getCache("sign_in_button");
if (cachedAction) {
  await page.act(cachedAction);
} else {
  await page.act(action);
}
```

```Python
# Cache successful actions
actions = await page.observe("Click the sign in button")
action = actions[0]
await set_cache("sign_in_button", action)

# Reuse cached action (no LLM cost)
cached_action = await get_cache("sign_in_button")
if cached_action:
    await page.act(cached_action)
else:
    await page.act(action)
```

--------------------------------

### Configure Stagehand Agent with Custom Model and System Prompt (TypeScript)

Source: https://docs.stagehand.dev/v3/references/agent

Shows how to create a Stagehand agent with a custom LLM model and a specific system prompt for tailored behavior. It also demonstrates setting a different execution model for tool usage and executing an instruction with parameters like maxSteps and highlightCursor. This snippet navigates to 'https://example.com'.

```typescript
// Create agent with custom model and system prompt
const agent = stagehand.agent({
  model: "openai/computer-use-preview",
  systemPrompt: "You are a helpful assistant that can navigate websites efficiently. Always verify actions before proceeding.",
  executionModel: "openai/gpt-4o-mini"  // Use faster model for tool execution
});

const page = stagehand.context.pages()[0];
await page.goto("https://example.com");

const result = await agent.execute({
  instruction: "Fill out the contact form with test data",
  maxSteps: 10,
  highlightCursor: true
});
```

--------------------------------

### Extract Apartment Listings with Context (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/extract

Extracts apartment listings with address, price, and square footage using Zod schema for structured data extraction in TypeScript. This method leverages detailed schema definitions to guide the LLM.

```typescript
import { z } from 'zod/v3';

const apartments = await page.extract({
 instruction:
 "Extract ALL the apartment listings and their details, including address, price, and square feet.",
 schema: z.object({
 list_of_apartments: z.array(
 z.object({
 address: z.string().describe("the address of the apartment"),
 price: z.string().describe("the price of the apartment"),
 square_feet: z.string().describe("the square footage of the apartment"),
 }),
 ),
 })
})

```

--------------------------------

### JSON Examples of Log Entries

Source: https://docs.stagehand.dev/v3/configuration/logging

Illustrates log entries in JSON format for various scenarios. These examples show successful actions with execution time, LLM inferences with token counts, and error logs with details like missing elements. They demonstrate the use of the 'auxiliary' field for specific context.

```json
{
  "category": "action",
  "message": "act completed successfully",
  "level": 1,
  "timestamp": "2025-01-27T12:35:00.123Z",
  "auxiliary": {
    "selector": {
      "value": "#btn-submit",
      "type": "string"
    },
    "executionTime": {
      "value": "1250",
      "type": "integer"
    }
  }
}
```

```json
{
  "category": "llm",
  "message": "inference completed",
  "level": 1,
  "timestamp": "2025-01-27T12:34:58.456Z",
  "auxiliary": {
    "model": {
      "value": "gpt-4o",
      "type": "string"
    },
    "promptTokens": {
      "value": "3451",
      "type": "integer"
    },
    "completionTokens": {
      "value": "45",
      "type": "integer"
    }
  }
}
```

```json
{
  "category": "action",
  "message": "action failed: element not found",
  "level": 0,
  "timestamp": "2025-01-27T12:35:05.789Z",
  "auxiliary": {
    "selector": {
      "value": "#missing-btn",
      "type": "string"
    },
    "url": {
      "value": "https://example.com/form",
      "type": "string"
    }
  }
}
```

--------------------------------

### Conduct Multi-site Research using TypeScript

Source: https://docs.stagehand.dev/v2/integrations/langchain/configuration

Shows how to set up a Stagehand agent for conducting research across multiple websites. The agent is instructed to visit specified competitor websites, extract pricing information, compare features and prices, and provide a summary analysis. It relies on an LLM and Stagehand toolkit for its operations.

```typescript
const researchAgent = createReactAgent({
    llm,
    tools: stagehandToolkit.tools,
});

const result = await researchAgent.invoke({
    messages: [{
        role: "user",
        content: `
                Research product pricing by:
                1. Visit competitor1.com and extract pricing info
                2. Visit competitor2.com and extract pricing info  
                3. Compare features and prices
                4. Provide summary analysis
            `
    }]
});
```

--------------------------------

### Extract Data from Website using TypeScript

Source: https://docs.stagehand.dev/v2/integrations/langchain/configuration

Demonstrates how to create a Stagehand agent to extract specific data points like headlines, publication dates, and author names from a given website. The agent is configured with an LLM and Stagehand tools, and the output is formatted as structured JSON.

```typescript
const extractionAgent = createReactAgent({
    llm,
    tools: stagehandToolkit.tools,
});

const result = await extractionAgent.invoke({
    messages: [{
        role: "user",
        content: `
                Go to news-website.com and extract:
                1. All article headlines
                2. Publication dates  
                3. Author names
                Format as structured JSON
            `
    }]
});
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

### Automate Form Submission using TypeScript

Source: https://docs.stagehand.dev/v2/integrations/langchain/configuration

Illustrates the process of creating a Stagehand agent to automate form submissions on a website. The agent navigates to a specified URL, fills in form fields with provided data, submits the form, and confirms the submission status. It utilizes an LLM and Stagehand tools for execution.

```typescript
const formAgent = createReactAgent({
    llm,
    tools: stagehandToolkit.tools,
});

const result = await formAgent.invoke({
    messages: [{
        role: "user", 
        content: `
                Navigate to contact-form.com and:
                1. Fill out the contact form with:
                   - Name: John Doe
                   - Email: john@example.com
                   - Message: Inquiry about services
                2. Submit the form
                3. Confirm submission success
            `
    }]
});
```

--------------------------------

### Cache Observed Actions with TypeScript

Source: https://docs.stagehand.dev/basics/observe

This snippet demonstrates how to cache observed actions using a TypeScript Map to avoid redundant LLM calls. It stores actions based on the instruction and retrieves them from the cache if available, otherwise it calls the `observe` function and caches the result.

```typescript
const actionCache = new Map<string, Action[]>();

async function cachedObserve(instruction: string) {
  if (actionCache.has(instruction)) {
    return actionCache.get(instruction)!;
  }

  const actions = await stagehand.observe(instruction);
  actionCache.set(instruction, actions);
  return actions;
}
```

--------------------------------

### Stagehand Constructor Logging Options

Source: https://docs.stagehand.dev/v3/configuration/logging

This TypeScript code snippet illustrates the logging-related options that can be passed to the Stagehand constructor. It includes verbose level, a custom logger function, disabling Pino, and enabling file logging for LLM inferences.

```typescript
const stagehand = new Stagehand({
  // ... your other configurations (env, model, etc.)

  // Logging options:
  verbose?: 0 | 1 | 2;                   // Log level (default: 1)
  logger?: (line: LogLine) => void;      // External logger function
  disablePino?: boolean;                 // Disable Pino backend (default: false)
  logInferenceToFile?: boolean;          // Save LLM requests to disk (default: false)
});
```

--------------------------------

### Cache Actions with Stagehand's act() Function

Source: https://docs.stagehand.dev/best-practices/caching

This snippet demonstrates how to enable caching for actions performed using the `act()` function in Stagehand. By specifying a `cacheDir` during Stagehand initialization, subsequent calls to `act()` with the same instruction and variables will reuse cached results instead of performing new LLM inferences. This significantly speeds up repeated actions and reduces costs. Variables are also supported with caching.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "act-cache", // Specify a cache directory
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://browserbase.github.io/stagehand-eval-sites/sites/iframe-same-proc-scroll/");

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached action
await stagehand.act("scroll to the bottom of the iframe");

// Variables work with caching too
await stagehand.act("fill the username field with %username%", {
  variables: {
    username: "fakeUsername",
  },
});

```

--------------------------------

### Preview and Act on Actions using `observe` - Python

Source: https://docs.stagehand.dev/v2/best-practices/caching

Leverages the `observe` function to obtain a preview of a desired action. This preview, represented as a dictionary mirroring a Playwright action, can be directly passed to `page.act` for execution without subsequent LLM inference, thereby optimizing performance.

```python
actions = await page.observe("Click the quickstart link")
action_preview = actions[0]

# action_preview is a dictionary version of a Playwright action:
# {
#	"description": "The quickstart link",
#	"method": "click",
#	"selector": "/html/body/div[1]/div[1]/a",
#	"arguments": [],
# }

# NO LLM INFERENCE when calling act on the preview
await page.act(action_preview)
```

--------------------------------

### Enable Basic Auto-Caching with Stagehand Agent

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

This snippet demonstrates how to initialize Stagehand with auto-caching enabled by specifying the `cacheDir` option. It then sets up an agent to execute a task. The first run will involve LLM inference, while subsequent runs will utilize the cache for faster execution. Dependencies include `@browserbasehq/stagehand`. Inputs are agent instructions and configuration; outputs are execution results.

```javascript
import { Stagehand } from "@browserbasehq/stagehand";

// Enable auto-caching
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "agent-cache" // Automatic caching enabled
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

// First run: Uses LLM inference (~20-30 seconds, ~50,000 tokens)
// Subsequent runs: Uses cached actions (~2-3 seconds, 0 tokens)
const result = await agent.execute({
  instruction: "Find the login form, fill in username 'demo' and password 'test123', then click submit",
  maxSteps: 10
});

console.log("Completed:", result.success);
console.log("Actions taken:", result.actions.length);

await stagehand.close();

```

--------------------------------

### Extend Stagehand's LLMClient with Custom Retries

Source: https://docs.stagehand.dev/configuration/models

Demonstrates extending the base `LLMClient` class from Stagehand to implement custom retry logic for chat completion requests. The `CustomRetryClient` overrides the `createChatCompletion` method to add a retry mechanism with a delay between attempts.

```javascript
import { LLMClient } from "@browserbasehq/stagehand";

class CustomRetryClient extends LLMClient {
  async createChatCompletion(options) {
    let retries = 3;
    while (retries > 0) {
      try {
        return await super.createChatCompletion(options);
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise((r) => setTimeout(r, 1000 * (4 - retries)));
      }
    }
  }
}

```

--------------------------------

### Cache Actions with `act()` in TypeScript

Source: https://docs.stagehand.dev/v3/best-practices/caching

Demonstrates how to enable action caching when using the `act()` method in Stagehand. By providing a `cacheDir` during Stagehand initialization, subsequent calls to `act()` with the same instruction and variables will utilize cached results, avoiding redundant LLM inferences. This is beneficial for repetitive actions and improves performance.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "act-cache", // Specify a cache directory
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://browserbase.github.io/stagehand-eval-sites/sites/iframe-same-proc-scroll/");

// First run: uses LLM inference and caches
// Subsequent runs: reuses cached action
await stagehand.act("scroll to the bottom of the iframe");

// Variables work with caching too
await stagehand.act("fill the username field with %username%", {
  variables: {
    username: "fakeUsername",
  },
});
```

--------------------------------

### Preview and Act on Actions using `observe` - TypeScript

Source: https://docs.stagehand.dev/v2/best-practices/caching

Uses the `observe` function to get a preview of a user-intended action. The preview, a JSON-ified Playwright action object, can then be passed to `page.act` to execute it without any additional LLM calls, improving efficiency.

```typescript
const [actionPreview] = await page.observe("Click the quickstart link");

/** actionPreview is a JSON-ified version of a Playwright action:
{
	description: "The quickstart link",
	method: "click",
	selector: "/html/body/div[1]/div[1]/a",
	arguments: [],
}
**/ 

// NO LLM INFERENCE when calling act on the preview
await page.act(actionPreview)
```

--------------------------------

### Compare First Run Exploration vs Subsequent Cached Runs

Source: https://docs.stagehand.dev/best-practices/deterministic-agent

This code snippet illustrates the difference between the first execution of an agent workflow (which involves exploration and LLM inference) and subsequent runs that utilize the cache. It measures and logs the execution time for the first run, highlighting the performance benefits of caching. Dependencies include `@browserbasehq/stagehand` and environment variables for API keys. The input is a search instruction.

```javascript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "cache/github-search" // Enable caching
});

await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://github.com");

const agent = stagehand.agent({
  cua: true,
  model: {
    modelName: "google/gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  },
  systemPrompt: "You are a helpful assistant that can use a web browser.",
});

console.log("First run: Exploring with agent...");
const startTime = Date.now();

const result = await agent.execute({
  instruction: "Search for 'stagehand' and click the first repository result",
  maxSteps: 10
});

const duration = Date.now() - startTime;
console.log(`First run completed in ${duration}ms`);
console.log(`Actions: ${result.actions.length}`);
console.log(`Status: ${result.success}`);

await stagehand.close();

// Output (example):
// First run completed in 25000ms
// Actions: 8
// Status: true

```

--------------------------------

### Enable Basic Auto-Caching with Stagehand Agent

Source: https://docs.stagehand.dev/v3/best-practices/deterministic-agent

Initialize Stagehand with a `cacheDir` to enable automatic caching for agent workflows. The first run will use LLM inference, while subsequent runs will leverage the local cache for faster execution and zero token usage. Ensure the `cacheDir` is specified during Stagehand initialization.

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

// Enable auto-caching
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  cacheDir: "agent-cache" // Automatic caching enabled
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

// First run: Uses LLM inference (~20-30 seconds, ~50,000 tokens)
// Subsequent runs: Uses cached actions (~2-3 seconds, 0 tokens)
const result = await agent.execute({
  instruction: "Find the login form, fill in username 'demo' and password 'test123', then click submit",
  maxSteps: 10
});

console.log("Completed:", result.success);
console.log("Actions taken:", result.actions.length);

await stagehand.close();
```
