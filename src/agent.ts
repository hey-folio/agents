import { tool, createAgent, createMiddleware } from "langchain";
import { MemorySaver, getCurrentTaskInput } from "@langchain/langgraph";
import { z } from "zod";
import type { ToolRuntime } from "@langchain/core/tools";
import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { tasksAgent } from "./agents/tasksAgent.js";
import { generalAgent } from "./agents/generalAgent.js";
import { agentContextSchema } from "./context.js";
import { defaultModel, suggestionModel, titleModel } from "./lib/models.js";

// Type alias for tool runtime with our context schema
type AgentToolRuntime = ToolRuntime<unknown, typeof agentContextSchema>;

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
 * Title Generation Middleware
 *
 * Automatically generates a descriptive title for new Folio conversations.
 * Runs in the afterAgent hook on the first exchange (1 human message + AI response).
 * Returns the title as part of state (same pattern as suggestions).
 */
const titleGenerationMiddleware = createMiddleware({
  name: "TitleGenerator",
  stateSchema: z.object({
    title: z.string().optional(),
  }),
  afterAgent: async (state: { messages: BaseMessage[] }) => {
    try {
      // Only run on first exchange (user message + assistant response)
      const humanMessages = state.messages.filter(HumanMessage.isInstance);
      const aiMessages = state.messages.filter(AIMessage.isInstance);

      // Only generate title on first user message getting first response
      if (humanMessages.length !== 1 || aiMessages.length === 0) {
        return {};
      }

      // Extract the first user message content
      const firstMessage = humanMessages[0];
      const userContent = typeof firstMessage.content === "string"
        ? firstMessage.content
        : JSON.stringify(firstMessage.content);

      // Generate title from the first message
      const result = await titleModel.invoke(
        `Generate a short, descriptive title (3-6 words) for a conversation that starts with this message:

"${userContent.slice(0, 500)}"

Guidelines:
- Title should describe the topic or intent
- Keep it concise and professional
- Do NOT use quotes or special characters
- Do NOT include "Chat about" or similar prefixes
- Examples: "Marketing Strategy Review", "Bug Fix for Login", "Weekend Trip Planning"`
      );

      console.log(`[TitleGenerator] Generated title: ${result.title}`);

      // Return title as state (frontend will update channel name)
      return { title: result.title };
    } catch (error) {
      console.error("[TitleGenerator] Error:", error);
      return {};
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
    const personId = configurable?.personId as string | undefined;

    if (!tenantId || !userId || !personId) {
      return JSON.stringify({
        result: "Error: Agent context not configured. Please ensure tenantId, userId, and personId are passed.",
        subagentMessages: [],
      });
    }

    // Get conversation context using LangChain pattern
    // Access full thread messages from the config
    const currentMessages = getCurrentTaskInput<{ messages: BaseMessage[] }>(runtime?.config).messages;

    // Find the original user message for context
    const originalUserMessage = currentMessages?.find(HumanMessage.isInstance);

    // Build enriched prompt following LangChain pattern
    const enrichedRequest = `
You are assisting with the following user inquiry:

${originalUserMessage?.content || "No context available"}

You are tasked with the following sub-request:

${request}
    `.trim();

    // Invoke tasks agent with enriched request that includes known task IDs
    const result = await tasksAgent.invoke(
      { messages: [{ role: "user", content: enrichedRequest }] },
      { configurable: { tenantId, userId, personId } }
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

    // Extract ALL __ui__ components from subagent tool results
    // Task tools return JSON with { text, __ui__ } structure
    // Multiple tools may each emit UI (e.g., list_tasks + propose_task_update)
    const uiComponents: Array<{ name: string; props: Record<string, unknown> }> = [];
    for (const msg of subagentMessages) {
      if (msg.type === "tool_result") {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed && typeof parsed === "object" && parsed.__ui__) {
            uiComponents.push(parsed.__ui__);
          }
        } catch {
          // Not JSON, skip
        }
      }
    }

    // Return structured response with subagent messages and ALL UI components
    return JSON.stringify({
      result: responseText,
      subagentMessages,
      subagent: "tasks",
      __ui__: uiComponents.length > 0 ? uiComponents : undefined,
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
export const agent: ReturnType<typeof createAgent> = createAgent({
  model: defaultModel,
  tools: [manageTasks, handleGeneral],
  checkpointer,
  middleware: [suggestionMiddleware, titleGenerationMiddleware],
  systemPrompt: `You are a helpful supervisor assistant that routes user requests to specialized agents.

You have two capabilities:
1. manage_tasks - For anything related to task management (listing tasks, creating tasks, etc.)
2. handle_general - For all other questions and conversations

Routing guidelines:
- If the user mentions tasks, todos, to-do items, or anything about managing work items -> use manage_tasks
- For general questions, conversations, or anything else -> use handle_general

IMPORTANT - Pass task IDs when known:

The sub-agent does NOT have conversation history. When you've already shown tasks to the user (via search/list), you MUST pass task IDs for subsequent operations.

For DELETE/UPDATE operations on known tasks:
- Look at previous tool results to find the task ID
- Pass: "Delete task with ID 'j578ffqm...' (title: '2026 Marketing Proposal')"
- Or: "Update task with ID 'abc123': set priority to high"

Example flow:
1. User: "show 2026 tasks" → you call manage_tasks, results show task IDs in the response
2. User: "delete the marketing one" → you pass: "Delete task with ID 'j578ffqm5qs784q7xzzd60aq997xcay9' (2026 Marketing Proposal)"
3. Sub-agent uses the ID directly without re-searching

For CREATE operations with explicit details:
- Pass: "Create the task: title='X', description='Y', status='todo', priority='high', label='feature'"

For MODIFYING a pending form:
- Include ALL current form values + the change
- Pass: "Propose task with: title='X', description='Y', status='Z', label='W', priority='V'"

Always route the user's request to the appropriate tool.

CRITICAL - UI components already show the data:
When the tool result includes __ui__ (TaskTable, TaskEditForm, etc.), the UI will render a rich visualization.
- Do NOT repeat the data in text/markdown - no tables, no bullet lists of fields
- Instead, give a brief conversational summary
- Examples:
  - TaskTable shown → "You have 3 tasks. 'Review Ferrari proposal' is due tomorrow."
  - TaskEditForm shown → "Here's the form - review and submit when ready."
  - For list_tasks: mention count and highlight 1-2 important items (due soon, high priority)
- Keep responses to 1-2 sentences max when UI is shown`,
});
