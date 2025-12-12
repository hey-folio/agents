# agents

LangGraph-based AI agents with Convex integration for persistent task management.

## Overview

This repository contains AI agents built with LangGraph that interact with a Convex database for persistent storage. The agents are designed to be invoked from a Next.js web application with proper tenant isolation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB REPO                                 │
│  ┌──────────┐ tenantId  ┌─────────────────────────────────────┐ │
│  │ Next.js  │ + userId  │            AGENTS REPO              │ │
│  │ Frontend │──────────▶│                                     │ │
│  └──────────┘           │  ┌───────────┐                      │ │
│                         │  │   Agent   │                      │ │
│                         │  │   Tools   │                      │ │
│                         │  └─────┬─────┘                      │ │
│                         └────────┼────────────────────────────┘ │
│                                  │                              │
│                    CONVEX_DEPLOY_KEY + tenantId + userId        │
│                                  │                              │
│                                  ▼                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 CONVEX (convex/ folder)                   │  │
│  │  ┌─────────────────┐      ┌─────────────────┐             │  │
│  │  │ agent/tasks.ts  │      │    tasks.ts     │             │  │
│  │  │ (internal funcs │      │ (web frontend)  │             │  │
│  │  │  for agent)     │      │                 │             │  │
│  │  └────────┬────────┘      └─────────────────┘             │  │
│  │           │                        │                      │  │
│  │           └────────────┬───────────┘                      │  │
│  │                        ▼                                  │  │
│  │           ┌─────────────────────────┐                     │  │
│  │           │      tasks table        │                     │  │
│  │           │  (shared by web+agent)  │                     │  │
│  │           └─────────────────────────┘                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### Environment Variables

Create a `.env` file with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...

# LangSmith Configuration (optional, for tracing)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=your-project

# Convex Configuration (required for task management)
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=dev:your-deployment|eyJ...
```

### Getting Convex Credentials

1. Go to your Convex dashboard
2. Select your deployment
3. Navigate to Settings > Deploy Keys
4. Copy the deployment URL and deploy key

### Installation

```bash
pnpm install
```

## Usage

### Setting Agent Context

Before invoking any agent that uses task tools, you must set the agent context with the tenant and user IDs:

```typescript
import { setAgentContext, clearAgentContext } from "./tools/taskTools.js";

// Set context before agent invocation
setAgentContext({
  tenantId: "jh78c8wxc9x5f3xzf4xf",  // Convex tenant ID
  userId: "kd92d7wxc9x5f3xzf4xg",     // Convex user ID
});

// Run your agent
const result = await tasksAgent.invoke({ ... });

// Clean up after agent completes
clearAgentContext();
```

### Available Agents

#### Tasks Agent

Handles task management operations:
- **list_tasks** - List all tasks for the tenant
- **get_task** - Get details of a specific task
- **create_task** - Create a new task
- **update_task** - Update task properties
- **delete_task** - Delete a task

```typescript
import { tasksAgent } from "./agents/tasksAgent.js";

const result = await tasksAgent.invoke({
  messages: [{ role: "user", content: "Create a task to review the PR" }],
});
```

## Security Model

### Tenant Isolation

All agent operations are scoped to a specific tenant. The security model works as follows:

1. **Client passes IDs**: The web application passes `tenantId` and `userId` to the agent
2. **Deploy key authentication**: Agent uses Convex deploy key for admin-level access
3. **Server-side validation**: Convex validates:
   - Tenant exists and is active
   - User exists and is active
   - User is an active member of the tenant

### Why This Is Secure

- **Convex IDs are UUIDs**: IDs like `jh78c8wxc9x5f3xzf4xf` are practically unguessable
- **Multi-layer validation**: Both tenant AND user must exist AND be related
- **No direct database access**: Agent goes through Convex functions with enforcement

### ID Validation

The Convex `resolveAgentContext()` function performs three checks:

```typescript
// 1. Tenant must exist and be active
const tenant = await ctx.db.get(args.tenantId);
if (!tenant || tenant.status !== "active") throw new Error("...");

// 2. User must exist and be active
const user = await ctx.db.get(args.userId);
if (!user || user.status !== "active") throw new Error("...");

// 3. User must be an active member of the tenant
const tenantUser = await ctx.db.query("tenantUsers")
  .withIndex("by_tenant_and_user", ...)
  .unique();
if (!tenantUser || tenantUser.status !== "active") throw new Error("...");
```

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Running the Agent

```bash
npx tsx src/index.ts
```

## Convex Integration Details

### HTTP API

The agent communicates with Convex via HTTP API using admin authentication:

```
POST https://your-deployment.convex.cloud/api/query
POST https://your-deployment.convex.cloud/api/mutation

Headers:
  Content-Type: application/json
  Authorization: Convex <deploy_key>

Body:
  {
    "path": "agent/tasks:list",
    "args": { "tenantId": "...", "userId": "..." },
    "format": "json"
  }
```

### Internal Functions

Agent-specific Convex functions are in `convex/agent/tasks.ts`:
- `agent/tasks:list` - List tasks (internal query)
- `agent/tasks:get` - Get single task (internal query)
- `agent/tasks:create` - Create task (internal mutation)
- `agent/tasks:update` - Update task (internal mutation)
- `agent/tasks:remove` - Delete task (internal mutation)

These are separate from the web frontend functions to allow different auth patterns.
