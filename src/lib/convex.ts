/**
 * Convex HTTP Client Setup
 *
 * Makes HTTP requests to Convex internal functions using admin auth (deploy key).
 * Uses the Convex HTTP API with `Authorization: Convex <deploy_key>` header.
 *
 * Required environment variables:
 * - CONVEX_URL: The Convex deployment URL (e.g., https://xxx.convex.cloud)
 * - CONVEX_DEPLOY_KEY: The admin deploy key for authentication
 *
 * @see https://docs.convex.dev/http-api/
 * @see https://docs.convex.dev/functions/internal-functions
 */

// Validate environment variables
const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL environment variable is required");
}

if (!CONVEX_DEPLOY_KEY) {
  throw new Error("CONVEX_DEPLOY_KEY environment variable is required");
}

/**
 * Make a request to a Convex internal function using admin auth.
 *
 * @param functionPath - The function path (e.g., "agent/tasks:list")
 * @param args - The arguments to pass to the function
 * @param type - The function type ("query" or "mutation")
 */
async function convexRequest<T>(
  functionPath: string,
  args: Record<string, unknown>,
  type: "query" | "mutation"
): Promise<T> {
  const url = `${CONVEX_URL}/api/${type}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${CONVEX_DEPLOY_KEY}`,
    },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Convex ${type} failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  // Convex returns { status: "success", value: ... } or { status: "error", errorMessage: ... }
  if (result.status === "error") {
    throw new Error(`Convex error: ${result.errorMessage}`);
  }

  return result.value as T;
}

/**
 * Type definitions for the internal agent functions.
 * These match the functions defined in convex/agent/tasks.ts in the web repo.
 */

// Task type as returned by Convex
export interface Task {
  _id: string;
  _creationTime: number;
  tenantId: string;
  title: string;
  description?: string;
  status: string;
  label: string;
  priority: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Args for agent functions (all require tenantId and userId)
export interface AgentTaskListArgs {
  tenantId: string;
  userId: string;
}

export interface AgentTaskGetArgs {
  tenantId: string;
  userId: string;
  id: string;
}

export interface AgentTaskCreateArgs {
  tenantId: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  label: string;
  priority: string;
}

export interface AgentTaskUpdateArgs {
  tenantId: string;
  userId: string;
  id: string;
  title?: string;
  description?: string;
  status?: string;
  label?: string;
  priority?: string;
}

export interface AgentTaskRemoveArgs {
  tenantId: string;
  userId: string;
  id: string;
}

export interface AgentTaskSearchArgs {
  tenantId: string;
  userId: string;
  query: string;
}

/**
 * Helper functions to call the internal agent task functions.
 */

export async function listTasks(args: AgentTaskListArgs): Promise<Task[]> {
  return convexRequest<Task[]>(
    "agent/tasks:list",
    args as unknown as Record<string, unknown>,
    "query"
  );
}

export async function getTask(args: AgentTaskGetArgs): Promise<Task | null> {
  return convexRequest<Task | null>(
    "agent/tasks:get",
    args as unknown as Record<string, unknown>,
    "query"
  );
}

export async function createTask(args: AgentTaskCreateArgs): Promise<string> {
  return convexRequest<string>(
    "agent/tasks:create",
    args as unknown as Record<string, unknown>,
    "mutation"
  );
}

export async function updateTask(args: AgentTaskUpdateArgs): Promise<null> {
  return convexRequest<null>(
    "agent/tasks:update",
    args as unknown as Record<string, unknown>,
    "mutation"
  );
}

export async function removeTask(args: AgentTaskRemoveArgs): Promise<null> {
  return convexRequest<null>(
    "agent/tasks:remove",
    args as unknown as Record<string, unknown>,
    "mutation"
  );
}

export async function searchTasks(args: AgentTaskSearchArgs): Promise<Task[]> {
  return convexRequest<Task[]>(
    "agent/tasks:search",
    args as unknown as Record<string, unknown>,
    "query"
  );
}

