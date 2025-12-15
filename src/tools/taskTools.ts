/**
 * Task Tools for LangGraph Agent
 *
 * These tools connect to Convex for persistent task storage.
 * Context (tenantId, userId) is accessed via runtime.context using LangChain v1's contextSchema.
 */

import { tool } from "langchain";
import { z } from "zod";
import type { ToolRuntime } from "@langchain/core/tools";
import {
  listTasks as convexListTasks,
  getTask as convexGetTask,
  createTask as convexCreateTask,
  updateTask as convexUpdateTask,
  removeTask as convexRemoveTask,
  type Task,
} from "../lib/convex.js";
import { agentContextSchema, type AgentContext } from "../context.js";

// Type alias for the tool runtime
type AgentToolRuntime = ToolRuntime<unknown, typeof agentContextSchema>;

/**
 * Extract tenant context from runtime.config.configurable.
 * Returns null if context is missing.
 */
function getContextFromRuntime(runtime?: AgentToolRuntime): AgentContext | null {
  const configurable = runtime?.config?.configurable as Record<string, unknown> | undefined;
  const tenantId = configurable?.tenantId as string | undefined;
  const userId = configurable?.userId as string | undefined;

  if (!tenantId || !userId) {
    return null;
  }

  return { tenantId, userId };
}

/**
 * Format a task for display
 */
function formatTask(task: Task): string {
  const lines = [
    `- [${task._id}] ${task.title} (${task.status})`,
    `  Label: ${task.label} | Priority: ${task.priority}`,
  ];
  if (task.description) {
    lines.push(`  Description: ${task.description}`);
  }
  return lines.join("\n");
}

/**
 * List all tasks for the current tenant
 */
export const listTasks = tool(
  async (_input: Record<string, never>, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      const tasks = await convexListTasks({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      });

      if (tasks.length === 0) {
        return "No tasks found. The task list is empty.";
      }

      const taskList = tasks.map(formatTask).join("\n\n");
      return `Found ${tasks.length} task(s):\n\n${taskList}`;
    } catch (error) {
      return `Error listing tasks: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "list_tasks",
    description:
      "List all tasks in the task management system. Returns all tasks with their IDs, titles, descriptions, status, labels, and priorities.",
    schema: z.object({}),
  }
);

/**
 * Get a single task by ID
 */
export const getTask = tool(
  async ({ id }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      const task = await convexGetTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        id,
      });

      if (!task) {
        return `Task not found with ID: ${id}`;
      }

      return `Task details:\n${formatTask(task)}`;
    } catch (error) {
      return `Error getting task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "get_task",
    description: "Get details of a specific task by its ID.",
    schema: z.object({
      id: z.string().describe("The ID of the task to retrieve"),
    }),
  }
);

/**
 * Create a new task
 */
export const createTask = tool(
  async ({ title, description, status, label, priority }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      const taskId = await convexCreateTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        title,
        description,
        status: status || "backlog",
        label: label || "feature",
        priority: priority || "medium",
      });

      return `Task created successfully!\n- ID: ${taskId}\n- Title: ${title}\n- Status: ${status || "backlog"}\n- Label: ${label || "feature"}\n- Priority: ${priority || "medium"}${description ? `\n- Description: ${description}` : ""}`;
    } catch (error) {
      return `Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "create_task",
    description:
      "Create a new task in the task management system. Requires a title. Optional: description, status (backlog/todo/in-progress/done/canceled), label (bug/feature/documentation), priority (low/medium/high).",
    schema: z.object({
      title: z.string().describe("The title of the task"),
      description: z
        .string()
        .optional()
        .describe("A detailed description of what needs to be done"),
      status: z
        .enum(["backlog", "todo", "in-progress", "done", "canceled"])
        .optional()
        .describe("The status of the task (default: backlog)"),
      label: z
        .enum(["bug", "feature", "documentation"])
        .optional()
        .describe("The label/category of the task (default: feature)"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("The priority of the task (default: medium)"),
    }),
  }
);

/**
 * Update an existing task
 */
export const updateTask = tool(
  async ({ id, title, description, status, label, priority }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      await convexUpdateTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        id,
        title,
        description,
        status,
        label,
        priority,
      });

      const updates: string[] = [];
      if (title) updates.push(`Title: ${title}`);
      if (description) updates.push(`Description: ${description}`);
      if (status) updates.push(`Status: ${status}`);
      if (label) updates.push(`Label: ${label}`);
      if (priority) updates.push(`Priority: ${priority}`);

      return `Task ${id} updated successfully!\nUpdated fields:\n- ${updates.join("\n- ")}`;
    } catch (error) {
      return `Error updating task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "update_task",
    description:
      "Update an existing task. Provide the task ID and any fields to update.",
    schema: z.object({
      id: z.string().describe("The ID of the task to update"),
      title: z.string().optional().describe("New title for the task"),
      description: z
        .string()
        .optional()
        .describe("New description for the task"),
      status: z
        .enum(["backlog", "todo", "in-progress", "done", "canceled"])
        .optional()
        .describe("New status for the task"),
      label: z
        .enum(["bug", "feature", "documentation"])
        .optional()
        .describe("New label for the task"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority for the task"),
    }),
  }
);

/**
 * Delete a task
 */
export const deleteTask = tool(
  async ({ id }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      await convexRemoveTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        id,
      });

      return `Task ${id} deleted successfully.`;
    } catch (error) {
      return `Error deleting task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "delete_task",
    description: "Delete a task by its ID. This action cannot be undone.",
    schema: z.object({
      id: z.string().describe("The ID of the task to delete"),
    }),
  }
);

/**
 * All task tools for use in agents
 */
export const taskTools = [
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
];
