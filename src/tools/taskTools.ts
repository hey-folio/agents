import { tool } from "langchain";
import { z } from "zod";

// In-memory task store
interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

const taskStore: Task[] = [];

/**
 * List all tasks in the store
 */
export const listTasks = tool(
  async () => {
    if (taskStore.length === 0) {
      return "No tasks found. The task list is empty.";
    }

    const taskList = taskStore
      .map(
        (task) =>
          `- [${task.id}] ${task.title} (${task.status})\n  ${task.description}`
      )
      .join("\n\n");

    return `Found ${taskStore.length} task(s):\n\n${taskList}`;
  },
  {
    name: "list_tasks",
    description:
      "List all tasks in the task management system. Returns all tasks with their IDs, titles, descriptions, and status.",
    schema: z.object({}),
  }
);

/**
 * Create a new task
 */
export const createTask = tool(
  async ({ title, description }) => {
    const id = `task-${Date.now()}`;
    const newTask: Task = {
      id,
      title,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    taskStore.push(newTask);

    return `Task created successfully!\n- ID: ${id}\n- Title: ${title}\n- Description: ${description}\n- Status: pending`;
  },
  {
    name: "create_task",
    description:
      "Create a new task in the task management system. Requires a title and description for the task.",
    schema: z.object({
      title: z.string().describe("The title of the task"),
      description: z
        .string()
        .describe("A detailed description of what needs to be done"),
    }),
  }
);

// Export the store for testing purposes
export { taskStore };
