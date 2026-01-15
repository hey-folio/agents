/**
 * Agent Context Schema
 *
 * Defines the runtime context available to all agents and tools.
 * Uses LangChain v1's contextSchema pattern for type-safe context access.
 */

import { z } from "zod";

/**
 * Context schema for multi-tenant agent operations.
 * Passed via `context` parameter when invoking agents.
 */
export const agentContextSchema = z.object({
  tenantId: z.string().describe("The tenant ID for multi-tenant isolation"),
  userId: z.string().describe("The user ID making the request"),
  personId: z.string().describe("The person ID for people features"),
});

export type AgentContext = z.infer<typeof agentContextSchema>;
