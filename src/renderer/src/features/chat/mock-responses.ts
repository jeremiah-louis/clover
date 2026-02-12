interface MockResponse {
  keywords: string[]
  content: string
  streamDelayMs?: number
}

const MOCK_RESPONSES: MockResponse[] = [
  {
    keywords: ["code", "function", "typescript", "javascript", "react", "hook"],
    content: `Here's a custom React hook for managing async operations with loading and error states:

\`\`\`typescript
import { useState, useCallback } from "react"

interface AsyncState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  })

  const execute = useCallback(async (promise: Promise<T>) => {
    setState({ data: null, error: null, isLoading: true })
    try {
      const data = await promise
      setState({ data, error: null, isLoading: false })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setState({ data: null, error: message, isLoading: false })
      throw err
    }
  }, [])

  return { ...state, execute }
}
\`\`\`

**Key design decisions:**

- The generic \`T\` keeps return types fully typed
- \`useCallback\` ensures \`execute\` is referentially stable
- Error handling extracts the message string, keeping the state serializable
- The hook re-throws so callers can optionally \`catch\` as well`,
  },
  {
    keywords: ["python", "script", "data", "pandas"],
    content: `Here's a clean data processing pipeline using Python:

\`\`\`python
import pandas as pd
from pathlib import Path

def process_sales_data(filepath: str) -> pd.DataFrame:
    """Clean and aggregate sales data by region."""
    df = pd.read_csv(filepath, parse_dates=["date"])

    # Drop rows with missing revenue
    df = df.dropna(subset=["revenue"])

    # Normalize region names
    df["region"] = df["region"].str.strip().str.title()

    # Aggregate by region and month
    df["month"] = df["date"].dt.to_period("M")
    summary = (
        df.groupby(["region", "month"])
        .agg(total_revenue=("revenue", "sum"), order_count=("id", "count"))
        .reset_index()
    )

    return summary

if __name__ == "__main__":
    result = process_sales_data("sales_2024.csv")
    print(result.head(10))
\`\`\`

This handles the common pitfalls: missing data, inconsistent casing, and date parsing. The \`groupby\` + \`agg\` pattern is the idiomatic way to summarize in pandas.`,
  },
  {
    keywords: ["diagram", "flow", "process", "architecture", "mermaid"],
    content: `Here's the system architecture as a diagram:

\`\`\`mermaid
graph TD
    A[User Input] --> B{Validate}
    B -->|Valid| C[Send to API]
    B -->|Invalid| D[Show Error]
    C --> E{Response Type}
    E -->|Stream| F[Stream Tokens]
    E -->|Error| G[Handle Error]
    F --> H[Render Markdown]
    H --> I[Ready for Input]
    G --> J{Retryable?}
    J -->|Yes| C
    J -->|No| D
    D --> I
\`\`\`

The flow follows a state machine pattern where each node represents a discrete phase. The key decision points are **validation** (before sending) and **response handling** (stream vs error). Retryable errors loop back to the API call, while terminal errors surface to the user.`,
  },
  {
    keywords: ["compare", "table", "versus", "vs", "difference", "which"],
    content: `Here's a comparison to help you decide:

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Performance | Fast | Moderate | Very Fast |
| Bundle Size | 12kb | 45kb | 8kb |
| TypeScript | Native | Partial | Native |
| Learning Curve | Low | Medium | Medium |
| Community | Large | Large | Growing |
| SSR Support | Yes | Yes | No |

**Recommendation:** If bundle size and performance are your priority, **Option C** is the best fit. If you need SSR and a mature ecosystem, go with **Option A**.

Key considerations:
- **Option A** has the largest community and most tutorials
- **Option B** offers the most built-in features but at a size cost
- **Option C** is the newest but gaining traction quickly

> The best choice depends on your specific constraints. There is no universally "right" answer here.`,
  },
  {
    keywords: ["help", "what", "how", "explain", "tell me"],
    content: `I can help with a wide range of tasks. Here are some things I'm good at:

- **Writing & editing** -- drafting emails, documents, or creative content
- **Code assistance** -- writing, reviewing, or debugging code in any language
- **Analysis** -- breaking down complex problems, comparing options, summarizing data
- **Research** -- finding information and synthesizing it into clear explanations
- **Brainstorming** -- generating ideas, exploring possibilities, mapping out approaches

Just describe what you're working on and I'll jump in. I work best when you give me specific context about your situation.`,
  },
  {
    keywords: ["error", "fail", "bug"],
    content: "__ERROR__",
  },
  {
    keywords: ["list", "steps", "guide", "tutorial", "setup"],
    content: `## Getting Started

Follow these steps to set up your development environment:

### 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure environment variables

Create a \`.env.local\` file in the project root:

\`\`\`bash
DATABASE_URL="postgresql://localhost:5432/mydb"
API_KEY="your-api-key-here"
NODE_ENV="development"
\`\`\`

### 3. Initialize the database

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 4. Start the dev server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at \`http://localhost:3000\`.

> **Note:** Make sure you have Node.js 18+ and PostgreSQL running locally before starting.

That's it -- you should be up and running. Let me know if you hit any issues.`,
  },
]

const FALLBACK_RESPONSE: MockResponse = {
  keywords: [],
  content: `That's an interesting question. Let me think through this.

There are a few angles to consider here:

1. **Context matters** -- the right approach depends heavily on your specific situation and constraints
2. **Start simple** -- begin with the most straightforward solution and iterate from there
3. **Measure first** -- before optimizing, make sure you understand where the actual bottlenecks are

Would you like me to dive deeper into any particular aspect of this? I can provide more specific guidance if you share more details about what you're working on.`,
}

export function selectMockResponse(userMessage: string): MockResponse {
  const lower = userMessage.toLowerCase()
  const matched = MOCK_RESPONSES.find((r) => r.keywords.some((kw) => lower.includes(kw)))
  return matched ?? FALLBACK_RESPONSE
}

export function isErrorResponse(response: MockResponse): boolean {
  return response.content === "__ERROR__"
}
