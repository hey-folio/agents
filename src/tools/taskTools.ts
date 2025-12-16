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
  searchTasks as convexSearchTasks,
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

      // Return structured response with UI data embedded
      // The client will parse __ui__ and render the component
      return JSON.stringify({
        text: `Found ${tasks.length} task(s).`,
        __ui__: { name: "TaskTable", props: { tasks } },
      });
    } catch (error) {
      return `Error listing tasks: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "list_tasks",
    description:
      "List all tasks in the task management system. Returns all tasks with their IDs, titles, descriptions, status, labels, and priorities. Displays a rich task table to the user.",
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

      // Return structured response with UI data embedded
      return JSON.stringify({
        text: `Task "${task.title}" details.`,
        __ui__: { name: "TaskCard", props: { task } },
      });
    } catch (error) {
      return `Error getting task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "get_task",
    description: "Get details of a specific task by its ID. Displays a rich task card to the user.",
    schema: z.object({
      id: z.string().describe("The ID of the task to retrieve"),
    }),
  }
);

/**
 * Search tasks by title using full-text search.
 * Returns TaskCard if exactly one match, TaskTable if multiple matches.
 */
export const searchTasks = tool(
  async ({ query }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      const tasks = await convexSearchTasks({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        query,
      });

      if (tasks.length === 0) {
        return `No tasks found matching "${query}".`;
      }

      if (tasks.length === 1) {
        // Single match - show TaskCard directly
        return JSON.stringify({
          text: `Found task "${tasks[0].title}".`,
          __ui__: { name: "TaskCard", props: { task: tasks[0] } },
        });
      }

      // Multiple matches - show filtered table
      return JSON.stringify({
        text: `Found ${tasks.length} tasks matching "${query}".`,
        __ui__: { name: "TaskTable", props: { tasks } },
      });
    } catch (error) {
      return `Error searching tasks: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "search_tasks",
    description:
      "Search for tasks by title. Use this when the user asks about a specific task by name. Returns TaskCard if exactly one match, TaskTable if multiple matches.",
    schema: z.object({
      query: z.string().describe("Search term to match against task titles"),
    }),
  }
);

/**
 * Schema for create_task tool (exported for HITL middleware)
 */
export const createTaskSchema = z.object({
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
});

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
        status: status || "todo",
        label: label || "feature",
        priority: priority || "medium",
      });

      // Return UI showing the created task as a card
      return JSON.stringify({
        text: `Task "${title}" created successfully.`,
        __ui__: {
          name: "TaskCard",
          props: {
            task: {
              _id: taskId,
              title,
              description: description || "",
              status: status || "todo",
              label: label || "feature",
              priority: priority || "medium",
            },
            isSaved: true,
          },
        },
      });
    } catch (error) {
      return `Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "create_task",
    description:
      "Create a new task in the task management system. Requires a title. Optional: description, status (backlog/todo/in-progress/done/canceled), label (bug/feature/documentation), priority (low/medium/high).",
    schema: createTaskSchema,
  }
);

/**
 * Schema for update_task tool (exported for HITL middleware)
 */
export const updateTaskSchema = z.object({
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
});

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
    schema: updateTaskSchema,
  }
);

/**
 * Schema for delete_task tool (exported for HITL middleware)
 */
export const deleteTaskSchema = z.object({
  id: z.string().describe("The ID of the task to delete"),
});

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
    schema: deleteTaskSchema,
  }
);

// ============================================================================
// Propose Tools (Conversational Forms)
// These tools emit UI forms instead of executing actions immediately.
// User can edit/submit forms or refine via chat messages.
// ============================================================================

/**
 * Propose a new task - shows editable form instead of creating immediately
 */
export const proposeTask = tool(
  async ({ title, description, status, label, priority }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    const formId = crypto.randomUUID();

    return JSON.stringify({
      text: `Ready to create task "${title}".`,
      __ui__: {
        name: "TaskEditForm",
        props: {
          formId,
          mode: "create",
          initialValues: {
            title,
            description: description || "",
            status: status || "todo",
            label: label || "feature",
            priority: priority || "medium",
          },
        },
      },
    });
  },
  {
    name: "propose_task",
    description:
      "Show an editable form to create a new task. The user can review, edit fields, and confirm before creation. Use this instead of create_task when the user asks to add/create a task.",
    schema: createTaskSchema,
  }
);

/**
 * Propose updating a task - shows editable form with current values
 */
export const proposeTaskUpdate = tool(
  async ({ id, title, description, status, label, priority }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      // Fetch current task to merge with proposed changes
      const task = await convexGetTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        id,
      });

      if (!task) {
        return `Task not found with ID: ${id}`;
      }

      const formId = crypto.randomUUID();

      return JSON.stringify({
        text: `Ready to update task "${task.title}".`,
        __ui__: {
          name: "TaskEditForm",
          props: {
            formId,
            mode: "edit",
            taskId: id,
            initialValues: {
              title: title ?? task.title,
              description: description ?? task.description ?? "",
              status: status ?? task.status,
              label: label ?? task.label,
              priority: priority ?? task.priority,
            },
          },
        },
      });
    } catch (error) {
      return `Error getting task for update: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "propose_task_update",
    description:
      "Show an editable form to update an existing task. Pre-fills current values merged with proposed changes. Use this instead of update_task when the user asks to edit/update a task.",
    schema: updateTaskSchema,
  }
);

/**
 * Propose deleting a task - shows confirmation UI
 */
export const proposeTaskDelete = tool(
  async ({ id }, runtime?: AgentToolRuntime) => {
    const ctx = getContextFromRuntime(runtime);
    if (!ctx) {
      return "Error: Agent context not configured. Ensure tenantId and userId are passed in context.";
    }

    try {
      // Fetch task to show title in confirmation
      const task = await convexGetTask({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        id,
      });

      if (!task) {
        return `Task not found with ID: ${id}`;
      }

      const formId = crypto.randomUUID();

      return JSON.stringify({
        text: `Confirm deletion of "${task.title}".`,
        __ui__: {
          name: "TaskDeleteConfirm",
          props: {
            formId,
            taskId: id,
            taskTitle: task.title,
          },
        },
      });
    } catch (error) {
      return `Error getting task for deletion: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "propose_task_delete",
    description:
      "Show a confirmation dialog to delete a task. Use this instead of delete_task when the user asks to delete/remove a task.",
    schema: deleteTaskSchema,
  }
);

/**
 * All task tools for use in agents
 * Note: Direct tools (create_task, update_task, delete_task) are kept for programmatic use
 * but agents should prefer propose_ tools for user interactions
 */
export const taskTools = [
  listTasks,
  getTask,
  searchTasks,
  createTask,
  updateTask,
  deleteTask,
  proposeTask,
  proposeTaskUpdate,
  proposeTaskDelete,
];
