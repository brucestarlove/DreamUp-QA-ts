### Run Stagehand Evals CLI Commands

Source: https://docs.stagehand.dev/v2/configuration/evals

Execute various commands using the Stagehand Evals CLI to run evaluations. This includes running all evals, specific categories, individual evals, listing available evals, and configuring defaults.

```bash
# Run all evals
evals run all

# Run specific category
evals run act
evals run extract
evals run observe
evals run agent

# Run specific eval
evals run extract/extract_text

# List available evals
evals list
evals list --detailed

# Configure defaults
evals config
evals config set env browserbase
evals config set trials 5
```

--------------------------------

### Run All and Specific Evals using Stagehand CLI

Source: https://docs.stagehand.dev/v3/basics/evals

Examples of running all available evals, specific categories of evals (act, extract, observe, agent), or a single named eval. This demonstrates basic evaluation execution.

```bash
# Run all evals
evals run all

# Run specific category
evals run act
evals run extract
evals run observe
evals run agent

# Run specific eval
evals run extract/extract_text
```

--------------------------------

### List Available Evals with Stagehand CLI

Source: https://docs.stagehand.dev/v3/basics/evals

Commands to list all available evals, with an option to display detailed information. This helps users understand the scope of available evaluations.

```bash
# List available evals
evals list
evals list --detailed
```

--------------------------------

### Running Custom and Deterministic Evals with 'evals run'

Source: https://docs.stagehand.dev/v2/configuration/evals

These bash commands demonstrate how to execute custom evaluations and deterministic tests. You can run a specific custom evaluation, an entire category of custom evaluations, or deterministic end-to-end tests. Options include specifying the environment, timeout, and model to use.

```bash
# Test your custom evaluation
evals run custom_task_name

# Run the entire custom category
evals run custom

# Run with specific settings
evals run custom_task_name -e browserbase -t 5 -m gpt-4o

# Run deterministic evals
npm run e2e
```

--------------------------------

### Running External Benchmarks with 'evals run'

Source: https://docs.stagehand.dev/v2/configuration/evals

This section demonstrates how to run various industry-standard benchmarks using the 'evals run' command. It supports filtering by difficulty and category, and specifies parameters like sample size and iteration count. These commands are essential for performance testing and evaluation.

```bash
# WebBench with filters
evals run benchmark:webbench -l 10 -f difficulty=easy -f category=READ

# GAIA benchmark
evals run b:gaia -s 100 -l 25 -f level=1

# WebVoyager
evals run b:webvoyager -l 50

# OnlineMind2Web
evals run b:onlineMind2Web

# OSWorld
evals run b:osworld -f source=Mind2Web
```

--------------------------------

### Run Pre-defined Stagehand Evals

Source: https://docs.stagehand.dev/v3/basics/evals

These commands execute pre-configured evaluations for various projects like WebVoyager, OnlineMind2Web, and OSWorld. The `-l` flag specifies the number of runs, and `-f` allows for passing specific parameters.

```bash
evals run b:webvoyager -l 50

evals run b:onlineMind2Web

evals run b:osworld -f source=Mind2Web
```

--------------------------------

### Verify Stagehand Evals CLI Installation

Source: https://docs.stagehand.dev/v2/configuration/evals

Verify that the Stagehand Evals CLI has been installed correctly by running the 'help' command.

```bash
evals help
```

--------------------------------

### Install and Build Stagehand Evals CLI

Source: https://docs.stagehand.dev/v3/basics/evals

Steps to install dependencies and build the Stagehand Evals CLI from the project's root directory. This is a prerequisite for running any evals commands.

```bash
# From the stagehand root directory
pnpm install
pnpm run build:cli
```

--------------------------------

### Run Custom Stagehand Evals

Source: https://docs.stagehand.dev/v3/basics/evals

Commands to execute custom evaluations created with Stagehand. These include running a specific custom task, running all tasks within a category, or running with specific parameters like the browser base, target iterations, and model.

```bash
# Test your custom evaluation
evals run custom_task_name

# Run the entire custom category
evals run custom

# Run with specific settings
evals run custom_task_name -e browserbase -t 5 -m gpt-4o
```

--------------------------------

### Build Stagehand Evals CLI

Source: https://docs.stagehand.dev/v2/configuration/evals

Build the Stagehand Evals CLI after installing dependencies. This command compiles the CLI for use.

```bash
pnpm run build:cli
```

--------------------------------

### Updating 'evals/evals.config.json' for Custom Evaluations

Source: https://docs.stagehand.dev/v2/configuration/evals

This JSON snippet illustrates how to add a newly created custom evaluation to the project's configuration file. It shows how to map the custom evaluation's name to specific categories within the `evals.config.json` file, allowing it to be run alongside other evaluations.

```json
{
  "categories": {
    "custom": ["custom_task_name"],
    "existing_category": ["custom_task_name"]
  }
}
```

--------------------------------

### Install Stagehand Evals CLI Dependencies

Source: https://docs.stagehand.dev/v2/configuration/evals

Install necessary dependencies for the Stagehand Evals CLI from the project's root directory using pnpm.

```bash
# From the stagehand root directory
pnpm install
```

--------------------------------

### Configure Stagehand Evals CLI Defaults

Source: https://docs.stagehand.dev/v3/basics/evals

Commands to configure default settings for the Stagehand Evals CLI, such as the environment, number of trials, and default providers. This allows for customized evaluation runs.

```bash
# Configure defaults
evals config
evals config set env browserbase
evals config set trials 5
```

--------------------------------

### Creating a Custom Evaluation Task in TypeScript

Source: https://docs.stagehand.dev/v2/configuration/evals

This snippet shows how to define a custom evaluation task using TypeScript. It includes defining the task's name, description, setup steps, the core task logic involving page interactions and data extraction, validation logic, test cases, and scoring criteria like exact match, timeout, and retries.

```typescript
import { EvalTask } from '../types';

export const customEvalTask: EvalTask = {
  name: 'custom_task_name',
  description: 'Test specific automation workflow',
  
  // Test setup
  setup: async ({ page }) => {
    await page.goto('https://example.com');
  },
  
  // The actual test
  task: async ({ stagehand, page }) => {
    // Your automation logic
    await page.act({ action: 'click the login button' });
    const result = await page.extract({
      instruction: 'Get the user name',
      schema: { username: 'string' }
    });
    return result;
  },
  
  // Validation
  validate: (result, expected) => {
    return result.username === expected.username;
  },
  
  // Test cases
  testCases: [
    {
      input: { /* test input */ },
      expected: { username: 'john_doe' }
    }
  ],
  
  // Evaluation criteria
  scoring: {
    exactMatch: true,
    timeout: 30000,
    retries: 2
  }
};
```

--------------------------------

### Create a Custom Evaluation Task in TypeScript

Source: https://docs.stagehand.dev/v3/basics/evals

Defines a custom evaluation task using TypeScript. It includes setup steps, the core task logic involving Stagehand for automation and data extraction, validation logic, test cases, and scoring criteria such as exact match, timeout, and retries.

```typescript
import { EvalTask } from '../types';

export const customEvalTask: EvalTask = {
  name: 'custom_task_name',
  description: 'Test specific automation workflow',
  
  // Test setup
  setup: async ({ page }) => {
    await page.goto('https://example.com');
  },
  
  // The actual test
  task: async ({ stagehand, page }) => {
    // Your automation logic
    await stagehand.act({ action: 'click the login button' });
    const result = await stagehand.extract({
      instruction: 'Get the user name',
      schema: { username: 'string' }
    });
    return result;
  },
  
  // Validation
  validate: (result, expected) => {
    return result.username === expected.username;
  },
  
  // Test cases
  testCases: [
    {
      input: { /* test input */ },
      expected: { username: 'john_doe' }
    }
  ],
  
  // Evaluation criteria
  scoring: {
    exactMatch: true,
    timeout: 30000,
    retries: 2
  }
};
```

--------------------------------

### Run External Benchmarks using Stagehand CLI

Source: https://docs.stagehand.dev/v3/basics/evals

Examples of running industry-standard external benchmarks like WebBench and GAIA using the Stagehand CLI. Includes options for filtering and setting specific parameters for the benchmarks.

```bash
# WebBench with filters
evals run benchmark:webbench -l 10 -f difficulty=easy -f category=READ

# GAIA benchmark
evals run b:gaia -s 100 -l 25 -f level=1
```

--------------------------------

### Run AI-based Evals (npm)

Source: https://docs.stagehand.dev/v2/best-practices/contributing

Command to run AI-based end-to-end tests using combinations of `act`, `extract`, and `observe`. This is part of the evaluation process for contributions, especially those modifying core functionalities.

```bash
npm run evals category combination
```

--------------------------------

### Evaluate JavaScript with page.evaluate()

Source: https://docs.stagehand.dev/v3/references/page

The `evaluate()` method executes JavaScript code within the page's context. It can accept either a string expression or a function, along with an optional argument. The return value must be JSON-serializable.

```typescript
await page.evaluate<R, Arg>(
  pageFunctionOrExpression: string | ((arg: Arg) => R | Promise<R>),
  arg?: Arg
): Promise<R>
```

--------------------------------

### Evaluating JavaScript in Browser Context with Stagehand

Source: https://docs.stagehand.dev/v3/references/page

Illustrates how to execute JavaScript code within the browser's context using Stagehand's `evaluate` method. This includes evaluating simple expressions, executing functions with arguments, and handling asynchronous operations like fetching data.

```typescript
// Execute JavaScript expression
const pageHeight = await page.evaluate("document.body.scrollHeight");
console.log("Page height:", pageHeight);

// Execute function with arguments
const result = await page.evaluate((selector) => {
  const element = document.querySelector(selector);
  return element ? element.textContent : null;
}, "h1");
console.log("H1 text:", result);

// Async function evaluation
const data = await page.evaluate(async () => {
  const response = await fetch("/api/data");
  return response.json();
});
```

--------------------------------

### Evaluation API

Source: https://docs.stagehand.dev/v3/references/page

APIs for evaluating JavaScript code within the page's execution context.

```APIDOC
## evaluate()

### Description
Evaluate JavaScript code in the page context.

### Method
Not applicable (function within a class)

### Endpoint
Not applicable (method within a class)

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```javascript
// Example usage within a page context
const result = await page.evaluate('window.location.href');
console.log(result);
```

### Response
#### Success Response (200)
- **Result** (any) - The result of the evaluation (must be JSON-serializable).

#### Response Example
```json
{
  "evaluation_result": "http://example.com"
}
```
```

--------------------------------

### Example Replay Output for Agent Actions (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/build-agent

Provides a concrete example of a Stagehand script generated by the `replay` function, demonstrating how an agent's actions to find stock prices are translated into Playwright and Stagehand commands. This script includes navigation, filling a search bar, and extracting information, with a focus on utilizing Playwright first for efficiency.

```typescript
import { Page, BrowserContext, Stagehand } from "@browserbasehq/stagehand";

export async function main({
  page,
  context,
  stagehand,
}: {
  page: Page; // Playwright Page with act, extract, and observe methods
  context: BrowserContext; // Playwright BrowserContext
  stagehand: Stagehand; // Stagehand instance
}) {
  await page.goto("https://www.google.com");

  // Replay will default to Playwright first to avoid unnecessary LLM calls!
  // If the Playwright action fails, Stagehand AI will take over and self-heal
  await page.act({
    description: "The search combobox where users can type their queries.",
    method: "fill",
    arguments: ["NVDA stock price"],
    selector:
      "xpath=/html/body[1]/div[1]/div[3]/form[1]/div[1]/div[1]/div[1]/div[1]/div[2]/textarea[1]",
  });
  await page.extract(
    "the displayed NVDA stock price in the search suggestions",
  );
  await stagehand.close();
}
```

--------------------------------

### Prompt-only Extraction (Python)

Source: https://docs.stagehand.dev/v2/basics/extract

Demonstrates calling the `extract` function with just a natural language prompt in Python, yielding a string result.

```python
result = await page.extract("extract the name of the repository")
```

--------------------------------

### Prompt-only Extraction (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/extract

Illustrates using the `extract` function with only a natural language prompt in TypeScript, resulting in a simple string output.

```typescript
const result = await page.extract("extract the name of the repository");
```

--------------------------------

### Run End-to-End Playwright Tests (npm)

Source: https://docs.stagehand.dev/v2/best-practices/contributing

Command to execute deterministic end-to-end tests using Playwright. These tests ensure the integrity of basic Playwright functionality for `stagehand.page` and `stagehand.context`, and compatibility with the Browserbase API.

```bash
npm run e2e
```

--------------------------------

### Stagehand with Variables

Source: https://docs.stagehand.dev/v3/references/act

Illustrates how to use variables within Stagehand actions for dynamic input.

```APIDOC
## Stagehand with Variables

### Description
This example demonstrates how to pass variables to the `stagehand.act()` method, allowing for dynamic input into web forms or other interactive elements. These variables are not shared with LLM providers.

### Method
Not Applicable (Code Example)

### Endpoint
Not Applicable (Code Example)

### Parameters
Not Applicable (Code Example)

### Request Example
Not Applicable (Code Example)

### Response
Not Applicable (Code Example)

### Code Example
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
```

--------------------------------

### Example Stagehand Metrics Output (JSON)

Source: https://docs.stagehand.dev/configuration/observability

Provides an example of the JSON output for the Stagehand metrics object after running automation tasks. This illustrates the values for prompt tokens, completion tokens, and inference time for each operation and cumulative totals.

```javascript
const metrics = await stagehand.metrics;
console.log(metrics);

// {
//   actPromptTokens: 4011,
//   actCompletionTokens: 51,
//   actInferenceTimeMs: 1688,
//   extractPromptTokens: 4200,
//   extractCompletionTokens: 243,
//   extractInferenceTimeMs: 4297,
//   observePromptTokens: 347,
//   observeCompletionTokens: 43,
//   observeInferenceTimeMs: 903,
//   agentPromptTokens: 0,
//   agentCompletionTokens: 0,
//   agentInferenceTimeMs: 0,
//   totalPromptTokens: 8558,
//   totalCompletionTokens: 337,
//   totalInferenceTimeMs: 6888
// }

```

--------------------------------

### Simple String Extraction

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Demonstrates extracting simple text content from a web page using a descriptive instruction. This method returns a string.

```python
sign_in_button_text = await page.extract("extract the sign in button text")
```

--------------------------------

### Extract Data with Natural Language Prompt (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

This snippet demonstrates the basic usage of the `extract()` function with a natural language prompt to retrieve specific information from a webpage. It returns a promise that resolves to the extracted data.

```typescript
await stagehand.extract("extract the name of the repository");
```

```typescript
const result = await stagehand.extract("extract the product details");
```

--------------------------------

### URL Extraction with Stagehand (TypeScript)

Source: https://docs.stagehand.dev/v3/first-steps/ai-rules

Extracts URLs from a page, utilizing Zod's `z.string().url()` for validation. This is useful for collecting navigation links or other web addresses.

```typescript
const { links } = await stagehand.extract(
  "extract all navigation links",
  z.object({
    links: z.array(z.string().url()),
  }),
);
```

--------------------------------

### Extract Apartment Listings with Context (Python)

Source: https://docs.stagehand.dev/v2/basics/extract

Extracts apartment listings with address, price, and square footage using Pydantic models for structured data extraction in Python. This approach defines data structures to ensure accurate data retrieval.

```python
from pydantic import BaseModel, Field

class Apartment(BaseModel):
 address: str = Field(..., description="the address of the apartment")
 price: str = Field(..., description="the price of the apartment")
 square_feet: str = Field(..., description="the square footage of the apartment")

class Apartments(BaseModel):
 list_of_apartments: list[Apartment]

apartments = await page.extract(
    "Extract ALL the apartment listings and their details as a list. For each apartment, include: the address of the apartment, the price of the apartment, and the square footage of the apartment",
    schema=Apartments
)

```

--------------------------------

### Extract Page Text (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/extract

Shows how to call the `extract` function without any parameters in TypeScript to retrieve the entire page's text content as a string.

```typescript
const pageText = await page.extract();
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

### Execute Agent Tasks

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Shows how to execute tasks using Stagehand agents, including simple commands and complex multi-step tasks with options like maximum steps, auto-screenshotting, and wait times between actions.

```python
# Simple task
result = await agent.execute("Play a game of 2048")

# Complex multi-step task with options
result = await agent.execute(
    instruction="Apply for the first engineer position with mock data",
    max_steps=20,
    auto_screenshot=True,
    wait_between_actions=1000  # milliseconds
)
```

--------------------------------

### Agent Execution with Success Criteria (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Highlights the importance of including clear success criteria in the `agent.execute` method's instructions in TypeScript. This allows the agent to verify task completion accurately.

```typescript
// Good - Clear success criteria
await agent.execute({
  instruction: "Add 3 smartphone cases to cart and confirm the cart shows exactly 3 items with total price",
  maxSteps: 20
});

// Bad - No validation
await agent.execute("Add some items to cart");
```

--------------------------------

### Agent Execution with Success Criteria (Python)

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Demonstrates in Python how to define explicit success criteria within the `agent.execute` instructions. This ensures the agent can confirm the task has been completed successfully and according to requirements.

```python
# Good - Clear success criteria
await agent.execute(
  instruction="Add 3 smartphone cases to cart and confirm the cart shows exactly 3 items with total price",
  max_steps=20
)

# Bad - No validation
await agent.execute("Add some items to cart")
```

--------------------------------

### Stagehand act() Parameter: Variables Example (TypeScript)

Source: https://docs.stagehand.dev/v3/references/act

Illustrates how to use the `variables` option within `stagehand.act()` for parameter substitution in instructions. This is particularly useful for handling sensitive data like passwords or API keys securely.

```typescript
await stagehand.act("type %password% into the password field", {
  variables: { password: process.env.USER_PASSWORD }
});
```

--------------------------------

### Extract with No Parameters (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

This code snippet shows how to call `extract()` without any parameters. In this mode, it returns the accessibility tree representation of the page without applying any LLM processing, providing raw page structure information.

```typescript
const result = await stagehand.extract();
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

### Extract Contact Us Page Link (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

Extracts the URL for the 'contact us' page. It uses `z.string().url()` to ensure the extracted value is a valid URL. This example demonstrates extracting single string values, specifically URLs.

```typescript
const contactLink = await stagehand.extract(
  "extract the link to the 'contact us' page",
  z.string().url() // note the usage of z.string().url() for URL validation
);

console.log("the link to the contact us page is: ", contactLink);
```

--------------------------------

### Extract Navigation Links with URL Validation using Stagehand

Source: https://docs.stagehand.dev/v3/references/extract

This code snippet illustrates how to extract navigation links from a web page, ensuring that the extracted URLs are valid using Zod's `.url()` validator. The `stagehand.extract` function is used with a schema that defines an array of objects, each containing link text and a validated URL.

```typescript
import { z } from 'zod';

// Schema definition
const NavigationSchema = z.object({
  links: z.array(z.object({
    text: z.string(),
    url: z.string().url()  // URL validation
  }))
});

// Extraction with v3 API
const links = await stagehand.extract(
  "extract navigation links",
  NavigationSchema
);
```

--------------------------------

### Perform Actions with Stagehand Page `act` Method

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Demonstrates using the `act` method on a Stagehand Page object to perform actions. This includes direct string instructions and using variables for dynamic form filling.

```typescript
await page.act("Click the sign in button");
```

```typescript
await page.act({
  action: `Enter the following information:
    Name: %name%
    Email: %email%
    Phone: %phone%`,
  variables: {
    name: "John Doe",
    email: "john@example.com", 
    phone: "+1-555-0123"
  }
});
```

--------------------------------

### Stagehand act() - Element Types vs. Colors (TypeScript, Python)

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Illustrates how to use element types and descriptive text for Stagehand prompts instead of visual attributes like color. This improves robustness as element appearances can change.

```typescript
// Good - Element types and descriptive text
await page.act("click the 'Sign In' button");
await page.act("type into the email input field");

// Bad - Color-based descriptions
await page.act("click the blue button");
await page.act("type into the white input");
```

```python
# Good - Element types and descriptive text
await page.act("click the 'Sign In' button")
await page.act("type into the email input field")

# Bad - Color-based descriptions
await page.act("click the blue button")
await page.act("type into the white input")
```

--------------------------------

### Validate with Observe Before Extracting (Python)

Source: https://docs.stagehand.dev/v2/basics/extract

Combines `page.observe()` to understand page structure with targeted extraction instructions to ensure consistent and accurate results. Helps in debugging inconsistent extraction outputs.

```python
# First observe to understand the page structure
elements = await page.observe("find all product listings")
print("Found elements:", [e.description for e in elements])

# Then extract with specific targeting
products = await page.extract(
    "extract name and price from each product listing shown on the page",
    schema=ProductSchema
)
```

--------------------------------

### Agent Execution Best Practices

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Provides best practices for agent execution, emphasizing specific instructions, breaking down complex tasks, and using error handling. It contrasts good, specific instructions with vague ones.

```python
# Good: Specific instructions
await agent.execute("Navigate to products page and filter by 'Electronics'")

# Avoid: Vague instructions
await agent.execute("Do some stuff on this page")
```

--------------------------------

### Schema Best Practices: TypeScript

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Demonstrates using descriptive field names, correct types (string, number, boolean), and detailed descriptions within a TypeScript schema for accurate data extraction with Stagehand. It contrasts good practices with common mistakes like generic names and incorrect types.

```typescript
// Good - Descriptive names, correct types, and helpful descriptions
  const productData = await page.extract({
    instruction: "Extract product information",
    schema: z.object({
      productTitle: z.string().describe("The main product name displayed on the page"),
      priceInDollars: z.number().describe("Current selling price as a number, without currency symbol"),
      isInStock: z.boolean().describe("Whether the product is available for purchase")
    })
  });

  // Bad - Generic names, wrong types, no descriptions
  const data = await page.extract({
    instruction: "Get product details", 
    schema: z.object({
      name: z.string(), // Too generic, no context
      price: z.string(), // Should be number
      stock: z.string() // Should be boolean, no context
    })
  });
```

--------------------------------

### Replay Agent Actions to Stagehand Script (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/build-agent

Generates a replayable Stagehand script from an agent's execution history. This function iterates through agent actions (like 'act', 'extract', 'goto') and translates them into Stagehand commands, saving the output to 'replay.ts' and formatting it with Prettier. It utilizes Node.js 'child_process' and 'fs/promises'.

```typescript
import { AgentAction, AgentResult } from "@browserbasehq/stagehand";
import { exec } from "child_process";
import fs from "fs/promises";

export async function replay(result: AgentResult) {
  const history = result.actions;
  const replay = history
    .map((action: AgentAction) => {
      switch (action.type) {
        case "act":
          if (!action.playwrightArguments) {
            throw new Error("No playwright arguments provided");
          }
          return `await page.act(${JSON.stringify(
            action.playwrightArguments
          )})`;
        case "extract":
          return `await page.extract("${action.parameters}")`;
        case "goto":
          return `await page.goto("${action.parameters}")`;
        case "wait":
          return `await page.waitForTimeout(${parseInt(
            action.parameters as string
          )})`;
        case "navback":
          return `await page.goBack()`;
        case "refresh":
          return `await page.reload()`;
        case "close":
          return `await stagehand.close()`;
        default:
          return `await stagehand.oops()`;
      }
    })
    .join("\n");

  console.log("Replay:");
  const boilerplate = `
  import { Page, BrowserContext, Stagehand } from "@browserbasehq/stagehand";

  export async function main(stagehand: Stagehand) {
      const page = stagehand.page
  	${replay}
  }
    `;
  await fs.writeFile("replay.ts", boilerplate);

  // Format the replay file with prettier
  await new Promise((resolve, reject) => {
    exec(
      "npx prettier --write replay.ts",
      (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error(`Error formatting replay.ts: ${error}`);
          reject(error);
          return;
        }
        resolve(stdout);
      }
    );
  });
}
```

--------------------------------

### Stagehand act() - Protecting Sensitive Data (TypeScript, Python)

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Demonstrates secure methods for handling sensitive data in Stagehand prompts using variables. This prevents secrets from being exposed in logs or prompts.

```typescript
// Good - Secure approach
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

// Bad - Insecure approach
await page.act("type 'mySecretPassword123' into the password field");
```

```python
import os

# Good - Secure approach
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

# Bad - Insecure approach
await page.act("type 'mySecretPassword123' into the password field")
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

### Extract Repository Name (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/extract

Demonstrates a basic usage of the `extract` function in TypeScript to extract a specific piece of information, the repository name, from a webpage.

```typescript
page.extract("extract the name of the repository");
```

--------------------------------

### Extract Apartment Listings with Details (TypeScript)

Source: https://docs.stagehand.dev/v3/basics/extract

Extracts all apartment listings, including their address, price, and square footage, using a Zod array of objects schema. This function relies on the `stagehand.extract` method and Zod for schema definition.

```typescript
const apartments = await stagehand.extract(
  "Extract ALL the apartment listings and their details, including address, price, and square feet.",
  z.array(
    z.object({
      address: z.string().describe("the address of the apartment"),
      price: z.string().describe("the price of the apartment"),
      square_feet: z.string().describe("the square footage of the apartment"),
    })
  )
);
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

### Extract Data with Stagehand Page `extract` Method

Source: https://docs.stagehand.dev/v2/first-steps/ai-rules

Shows how to extract data from a web page using the `extract` method. Examples cover simple string extraction, structured extraction with Zod schemas, and extracting multiple items into an array.

```typescript
const signInButtonText = await page.extract("extract the sign in button text");
```

```typescript
import { z } from "zod/v3";

const data = await page.extract({
  instruction: "extract the sign in button text",
  schema: z.object({
    text: z.string(),
  }),
});
```

```typescript
import { z } from "zod/v3";

const data = await page.extract({
  instruction: "extract the text inside all buttons",
  schema: z.object({
    buttons: z.array(z.string()),
  })
});
```

--------------------------------

### Extract Page Text (Python)

Source: https://docs.stagehand.dev/v2/basics/extract

Illustrates calling the `extract` function with no parameters in Python to obtain the full text content of the page.

```python
pageText = await page.extract()
```

--------------------------------

### Validate with Observe Before Extracting (TypeScript)

Source: https://docs.stagehand.dev/v2/basics/extract

Combines `page.observe()` to understand page structure with targeted extraction instructions to ensure consistent and accurate results. Helps in debugging inconsistent extraction outputs.

```typescript
// First observe to understand the page structure
const elements = await page.observe("find all product listings");
console.log("Found elements:", elements.map(e => e.description));

// Then extract with specific targeting
const products = await page.extract({
  instruction: "extract name and price from each product listing shown on the page",
  schema: z.object({
    products: z.array(z.object({
      name: z.string().describe("the product title or name"),
      price: z.string().describe("the price as displayed, including currency")
    }))
  })
});
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

### Simple Data Extraction with Stagehand (TypeScript)

Source: https://docs.stagehand.dev/v3/first-steps/ai-rules

Extracts simple string data from a page using a natural language instruction without requiring a predefined schema. Returns a default object with an 'extraction' field or allows direct destructuring.

```typescript
// Extract returns a default object with 'extraction' field
const result = await stagehand.extract("extract the sign in button text");

console.log(result);
// Output: { extraction: "Sign in" }

// Or destructure directly
const { extraction } = await stagehand.extract(
  "extract the sign in button text",
);
console.log(extraction); // "Sign in"
```

--------------------------------

### Setting Step Limits for Agent Tasks (TypeScript)

Source: https://docs.stagehand.dev/v2/best-practices/prompting-best-practices

Demonstrates how to set appropriate `maxSteps` for the `agent.execute` method in TypeScript based on task complexity. Simple tasks require fewer steps, while complex research tasks need more.

```typescript
// Simple task - fewer steps
await agent.execute({
  instruction: "Subscribe to the newsletter with email 'user@example.com'",
  maxSteps: 10
});

// Complex task - more steps  
await agent.execute({
  instruction: "Research and compare 5 project management tools with pricing and features",
  maxSteps: 50
});
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

### Parse Auxiliary Data Helper Function

Source: https://docs.stagehand.dev/v3/configuration/logging

This JavaScript helper function, 'parseAuxiliary', takes an optional 'auxiliary' object from a log line. It iterates through the entries, parsing JSON values if the type is 'object', and returns a flat record. This is useful for making auxiliary log data easier to process and filter.

```javascript
function parseAuxiliary(aux?: LogLine['auxiliary']): Record<string, any> {
  if (!aux) return {};
  const parsed: Record<string, any> = {};
  for (const [key, entry] of Object.entries(aux)) {
    parsed[key] = entry.type === 'object'
      ? JSON.parse(entry.value)
      : entry.value;
  }
  return parsed;
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
