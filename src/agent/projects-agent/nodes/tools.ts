import { ProjectsState, ProjectsUpdate } from "../types";
import { ChatAnthropic } from "@langchain/anthropic";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../../agent-uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { findToolCall } from "../../find-tool-call";
import { jsonStore } from "../../operations-team/utils/json-store";
import {
  Task,
  Project,
  TimesheetEntry,
  TaskStatusSchema,
  TaskPrioritySchema,
  Employee,
} from "../../operations-team/types";

// Tool schemas
const listTasksSchema = z.object({
  projectId: z.string().optional().describe("Filter by project ID"),
  status: TaskStatusSchema.optional().describe("Filter by task status"),
  assigneeId: z.string().optional().describe("Filter by assignee ID"),
});

const createTaskSchema = z.object({
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  projectId: z.string().describe("Project ID this task belongs to"),
  priority: TaskPrioritySchema.describe("Task priority"),
  assigneeId: z.string().optional().describe("ID of person to assign task to"),
  estimatedHours: z.number().optional().describe("Estimated hours to complete"),
  dueDate: z.string().optional().describe("Due date (YYYY-MM-DD)"),
});

const updateTaskSchema = z.object({
  taskId: z.string().describe("ID of task to update"),
  status: TaskStatusSchema.optional().describe("New status"),
  priority: TaskPrioritySchema.optional().describe("New priority"),
  assigneeId: z.string().optional().describe("New assignee ID"),
});

const getProjectOverviewSchema = z.object({
  projectId: z.string().describe("Project ID to get overview for"),
});

const listProjectsSchema = z.object({
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional().describe("Filter by project status"),
});

const submitTimeEntrySchema = z.object({
  date: z.string().describe("Date of work (YYYY-MM-DD)"),
  projectId: z.string().describe("Project ID"),
  taskId: z.string().optional().describe("Task ID if applicable"),
  hours: z.number().describe("Hours worked"),
  description: z.string().optional().describe("Work description"),
  billable: z.boolean().default(true).describe("Is this billable time"),
});

const getTimesheetSummarySchema = z.object({
  startDate: z.string().describe("Period start date"),
  endDate: z.string().describe("Period end date"),
  employeeId: z.string().optional().describe("Filter by employee"),
  projectId: z.string().optional().describe("Filter by project"),
});

const PROJECTS_TOOLS = [
  {
    name: "list-tasks",
    description: "List tasks, optionally filtered by project, status, or assignee. Use to show task board or task list.",
    schema: listTasksSchema,
  },
  {
    name: "create-task",
    description: "Create a new task in a project. Use when someone wants to add or create a task.",
    schema: createTaskSchema,
  },
  {
    name: "update-task",
    description: "Update a task's status, priority, or assignee. Use to move tasks between columns or reassign.",
    schema: updateTaskSchema,
  },
  {
    name: "get-project-overview",
    description: "Get detailed project overview including progress, team, and recent activity.",
    schema: getProjectOverviewSchema,
  },
  {
    name: "list-projects",
    description: "List all projects, optionally filtered by status.",
    schema: listProjectsSchema,
  },
  {
    name: "submit-time-entry",
    description: "Log time worked on a project. Use when someone wants to track or log their hours.",
    schema: submitTimeEntrySchema,
  },
  {
    name: "get-timesheet-summary",
    description: "Get timesheet summary for a period. Use to view time tracking reports or weekly timesheets.",
    schema: getTimesheetSummarySchema,
  },
];

const llm = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  temperature: 0,
});

export async function callProjectsTools(
  state: ProjectsState,
  config: LangGraphRunnableConfig
): Promise<ProjectsUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = await llm.bindTools(PROJECTS_TOOLS).invoke([
    {
      role: "system",
      content: `You are a project management assistant for a digital design agency. You help with:
- Managing tasks and projects (create, update, track progress)
- Viewing project status and team allocation
- Logging and reviewing timesheets

Be helpful and concise. The current user is "emp-003" (Emily Rodriguez) unless specified otherwise.
Today's date is ${new Date().toISOString().split("T")[0]}.

Available projects:
- proj-001: TechStart Brand Refresh
- proj-002: GreenLife E-commerce Platform
- proj-003: FinanceHub Mobile App
- proj-004: Artisan Coffee Website Redesign`,
    },
    ...state.messages,
  ]);

  // Handle list-tasks
  const listTasksCall = message.tool_calls?.find(
    findToolCall("list-tasks")<typeof listTasksSchema>
  );

  if (listTasksCall) {
    let tasks = jsonStore.read<Task>("tasks");

    if (listTasksCall.args.projectId) {
      tasks = tasks.filter((t) => t.projectId === listTasksCall.args.projectId);
    }
    if (listTasksCall.args.status) {
      tasks = tasks.filter((t) => t.status === listTasksCall.args.status);
    }
    if (listTasksCall.args.assigneeId) {
      tasks = tasks.filter((t) => t.assigneeId === listTasksCall.args.assigneeId);
    }

    // Get project name for context
    const projectId = listTasksCall.args.projectId;
    const project = projectId ? jsonStore.findById<Project>("projects", projectId) : null;

    // Map tasks to the UI component format (filter out backlog status for board view)
    const mappedTasks = tasks
      .filter((t) => t.status !== "backlog")
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        projectName: t.projectName,
        assigneeId: t.assigneeId,
        assigneeName: t.assigneeName,
        status: t.status as "todo" | "in_progress" | "review" | "done",
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
      }));

    ui.push(
      {
        name: "task-board",
        props: {
          tasks: mappedTasks,
          projectName: project?.name,
        },
      },
      { message }
    );
  }

  // Handle create-task
  const createTaskCall = message.tool_calls?.find(
    findToolCall("create-task")<typeof createTaskSchema>
  );

  if (createTaskCall) {
    const projects = jsonStore.read<Project>("projects");
    const employees = jsonStore.read<Employee>("employees");

    ui.push(
      {
        name: "task-form",
        props: {
          toolCallId: createTaskCall.id ?? "",
          projects: projects.map((p) => ({ id: p.id, name: p.name })),
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
          defaultProjectId: createTaskCall.args.projectId,
        },
      },
      { message }
    );
  }

  // Handle get-project-overview
  const projectOverviewCall = message.tool_calls?.find(
    findToolCall("get-project-overview")<typeof getProjectOverviewSchema>
  );

  if (projectOverviewCall) {
    const project = jsonStore.findById<Project>("projects", projectOverviewCall.args.projectId);
    const tasks = jsonStore.filter<Task>("tasks", (t) => t.projectId === projectOverviewCall.args.projectId);
    const timesheets = jsonStore.filter<TimesheetEntry>(
      "timesheets",
      (t) => t.projectId === projectOverviewCall.args.projectId
    );

    if (project) {
      const taskStats = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo" || t.status === "backlog").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        review: tasks.filter((t) => t.status === "review").length,
        done: tasks.filter((t) => t.status === "done").length,
      };

      const hoursLogged = timesheets.reduce((sum, t) => sum + t.hours, 0);
      const hoursEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

      // Map project to expected format
      const mappedProject = {
        id: project.id,
        name: project.name,
        description: project.description || "",
        status: project.status,
        clientName: project.clientName || "Internal",
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget || 0,
        spent: project.spent,
        teamMembers: project.teamMembers.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
        })),
      };

      ui.push(
        {
          name: "project-overview",
          props: {
            project: mappedProject,
            taskStats,
            hoursLogged,
            hoursEstimated,
          },
        },
        { message }
      );
    }
  }

  // Handle list-projects
  const listProjectsCall = message.tool_calls?.find(
    findToolCall("list-projects")<typeof listProjectsSchema>
  );

  if (listProjectsCall) {
    let projects = jsonStore.read<Project>("projects");
    const allTasks = jsonStore.read<Task>("tasks");

    if (listProjectsCall.args.status) {
      projects = projects.filter((p) => p.status === listProjectsCall.args.status);
    }

    // Map projects to expected format
    const mappedProjects = projects.map((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId === p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        status: p.status,
        clientName: p.clientName || "Internal",
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget || 0,
        spent: p.spent,
        teamCount: p.teamMembers.length,
        taskCount: projectTasks.length,
        completedTaskCount: projectTasks.filter((t) => t.status === "done").length,
      };
    });

    ui.push(
      {
        name: "project-list",
        props: {
          projects: mappedProjects,
        },
      },
      { message }
    );
  }

  // Handle submit-time-entry
  const submitTimeCall = message.tool_calls?.find(
    findToolCall("submit-time-entry")<typeof submitTimeEntrySchema>
  );

  if (submitTimeCall) {
    const projects = jsonStore.read<Project>("projects");
    const allTasks = jsonStore.read<Task>("tasks");
    const projectTasks = allTasks.filter((t) =>
      projects.some((p) => p.id === t.projectId)
    );

    ui.push(
      {
        name: "timesheet-entry",
        props: {
          toolCallId: submitTimeCall.id ?? "",
          projects: projects.map((p) => ({ id: p.id, name: p.name })),
          tasks: projectTasks.map((t) => ({ id: t.id, title: t.title, projectId: t.projectId })),
          employeeId: "emp-003", // Default current user
          suggestedDate: submitTimeCall.args.date,
        },
      },
      { message }
    );
  }

  // Handle get-timesheet-summary
  const timesheetSummaryCall = message.tool_calls?.find(
    findToolCall("get-timesheet-summary")<typeof getTimesheetSummarySchema>
  );

  if (timesheetSummaryCall) {
    const entries = jsonStore.filter<TimesheetEntry>("timesheets", (t) => {
      const date = new Date(t.date);
      const start = new Date(timesheetSummaryCall.args.startDate);
      const end = new Date(timesheetSummaryCall.args.endDate);

      if (date < start || date > end) return false;
      if (timesheetSummaryCall.args.employeeId && t.employeeId !== timesheetSummaryCall.args.employeeId) return false;
      if (timesheetSummaryCall.args.projectId && t.projectId !== timesheetSummaryCall.args.projectId) return false;

      return true;
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    // Group by project for breakdown
    const projectHours: Record<string, number> = {};
    entries.forEach((e) => {
      projectHours[e.projectName] = (projectHours[e.projectName] || 0) + e.hours;
    });

    const projectBreakdown = Object.entries(projectHours).map(([name, hours]) => ({
      projectId: entries.find((e) => e.projectName === name)?.projectId || "",
      projectName: name,
      hours,
      percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0,
    }));

    // Map entries to expected format
    const mappedEntries = entries.map((e) => ({
      id: e.id,
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      projectId: e.projectId,
      projectName: e.projectName,
      taskId: e.taskId,
      taskName: e.taskName,
      date: e.date,
      hours: e.hours,
      description: e.description,
      status: e.status,
    }));

    ui.push(
      {
        name: "timesheet-summary",
        props: {
          periodStart: timesheetSummaryCall.args.startDate,
          periodEnd: timesheetSummaryCall.args.endDate,
          entries: mappedEntries,
          totalHours,
          projectBreakdown,
        },
      },
      { message }
    );
  }

  return {
    messages: [message],
    ui: ui.items,
    timestamp: Date.now(),
  };
}
