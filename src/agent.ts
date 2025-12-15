import { tool, createAgent, createMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import type { ToolRuntime } from "@langchain/core/tools";
import { AIMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { tasksAgent } from "./agents/tasksAgent.js";
import { generalAgent } from "./agents/generalAgent.js";
import { agentContextSchema } from "./context.js";

// Type alias for tool runtime with our context schema
type AgentToolRuntime = ToolRuntime<unknown, typeof agentContextSchema>;

// Schema for structured suggestion output
const SuggestionsSchema = z.object({
  suggestions: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2-4 brief follow-up suggestions the user might ask next"),
});

// Model with structured output for suggestion generation
const suggestionModel = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  maxTokens: 200,
}).withStructuredOutput(SuggestionsSchema);

// Checkpointer for state persistence (required by LangSmith Studio)
const checkpointer = new MemorySaver();

/**
 * Suggestion Middleware
 *
 * Generates 2-4 contextual follow-up suggestions after the agent completes.
 * Runs in the afterAgent hook to avoid blocking the main conversation.
 */
const suggestionMiddleware = createMiddleware({
  name: "SuggestionGenerator",
  stateSchema: z.object({
    suggestions: z.array(z.string()).default([]),
  }),
  afterAgent: async (state: { messages: BaseMessage[] }) => {
    try {
      // Format last 6 messages for context
      const context = state.messages
        .slice(-6)
        .filter((m) => m.getType() === "human" || m.getType() === "ai")
        .map((m) => {
          const role = m.getType() === "human" ? "User" : "Assistant";
          const content =
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content);
          return `${role}: ${content}`;
        })
        .join("\n");

      const result = await suggestionModel.invoke(
        `Based on this conversation, generate 2-4 brief follow-up suggestions the user might ask next.

Conversation:
${context}

Guidelines:
- Keep each suggestion SHORT (5-10 words max)
- Make them relevant to what was discussed
- For task discussions: suggest task actions ("Show my tasks", "Mark it as done")
- For general topics: suggest related questions
- Never repeat what the user already asked`
      );

      return { suggestions: result.suggestions };
    } catch {
      return { suggestions: [] };
    }
  },
});

/**
 * Supervisor Agent Pattern Implementation
 *
 * This file implements the supervisor pattern from the LangChain tutorial:
 * https://docs.langchain.com/oss/javascript/langchain/supervisor
 *
 * Architecture:
 * - Bottom layer: Task tools (list_tasks, create_task)
 * - Middle layer: Sub-agents (tasksAgent, generalAgent) accepting natural language
 * - Top layer: Supervisor routing to high-level capabilities
 */

// Helper to extract subagent tool calls and results from messages
interface SubagentToolCall {
  type: "tool_call";
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

interface SubagentToolResult {
  type: "tool_result";
  name: string;
  content: string;
  toolCallId?: string;
}

type SubagentMessage = SubagentToolCall | SubagentToolResult;

function extractSubagentMessages(
  messages: BaseMessage[]
): SubagentMessage[] {
  const subagentMessages: SubagentMessage[] = [];

  for (const msg of messages) {
    // Extract tool calls from AI messages using proper type guards
    if (msg instanceof AIMessage && msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        subagentMessages.push({
          type: "tool_call",
          name: tc.name,
          args: tc.args as Record<string, unknown>,
          id: tc.id,
        });
      }
    }

    // Extract tool results using proper type guards
    if (msg instanceof ToolMessage) {
      subagentMessages.push({
        type: "tool_result",
        name: msg.name || "unknown",
        content:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
        toolCallId: msg.tool_call_id,
      });
    }
  }

  return subagentMessages;
}

// Wrap the tasks agent as a tool for the supervisor
const manageTasks = tool(
  async ({ request }, runtime?: AgentToolRuntime) => {
    // Get tenant context from config.configurable
    const configurable = runtime?.config?.configurable as Record<string, unknown> | undefined;
    const tenantId = configurable?.tenantId as string | undefined;
    const userId = configurable?.userId as string | undefined;

    if (!tenantId || !userId) {
      return JSON.stringify({
        result: "Error: Agent context not configured. Please ensure tenantId and userId are passed.",
        subagentMessages: [],
      });
    }

    // Invoke tasks agent with config passed through
    const result = await tasksAgent.invoke(
      { messages: [{ role: "user", content: request }] },
      { configurable: { tenantId, userId } }
    );

    // Extract the last message content from the agent's response
    const lastMessage = result.messages[result.messages.length - 1];
    const responseText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Extract subagent tool calls and results (excluding the initial user message)
    const subagentMessages = extractSubagentMessages(
      result.messages.slice(1, -1) // Exclude first (user) and last (final response)
    );

    // Return structured response with subagent messages
    return JSON.stringify({
      result: responseText,
      subagentMessages,
      subagent: "tasks",
    });
  },
  {
    name: "manage_tasks",
    description: `Handle task management requests using natural language.

Use this tool when the user wants to:
- View, list, or check their tasks
- Create, add, or make a new task
- Anything related to task management

Input: A natural language request about tasks
Output: The result of the task operation`,
    schema: z.object({
      request: z.string().describe("Natural language task management request"),
    }),
  }
);

// Wrap the general agent as a tool for the supervisor
const handleGeneral = tool(
  async ({ request }) => {
    const result = await generalAgent.invoke({
      messages: [{ role: "user", content: request }],
    });

    // Extract the last message content from the agent's response
    const lastMessage = result.messages[result.messages.length - 1];
    const responseText =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Extract subagent tool calls and results (excluding the initial user message)
    const subagentMessages = extractSubagentMessages(
      result.messages.slice(1, -1) // Exclude first (user) and last (final response)
    );

    // Return structured response with subagent messages
    return JSON.stringify({
      result: responseText,
      subagentMessages,
      subagent: "general",
    });
  },
  {
    name: "handle_general",
    description: `Handle general questions and conversations.

Use this tool when the user:
- Asks general knowledge questions
- Wants to have a conversation
- Needs help with anything NOT related to task management

Input: A natural language question or statement
Output: A helpful response`,
    schema: z.object({
      request: z.string().describe("Natural language question or request"),
    }),
  }
);

/**
 * Supervisor Agent
 *
 * Routes user requests to the appropriate sub-agent:
 * - Task-related requests -> manageTasks -> tasksAgent
 * - Everything else -> handleGeneral -> generalAgent
 */
export const agent = createAgent({
  model: "claude-haiku-4-5-20251001",
  tools: [manageTasks, handleGeneral],
  checkpointer,
  middleware: [suggestionMiddleware],
  systemPrompt: `You are a helpful supervisor assistant that routes user requests to specialized agents.

You have two capabilities:
1. manage_tasks - For anything related to task management (listing tasks, creating tasks, etc.)
2. handle_general - For all other questions and conversations

Routing guidelines:
- If the user mentions tasks, todos, to-do items, or anything about managing work items -> use manage_tasks
- For general questions, conversations, or anything else -> use handle_general

Always route the user's request to the appropriate tool. Pass the user's request naturally to the tool.
After receiving the result, provide a clear response to the user.`,
});
