/**
 * UI Component Type Definitions for Agent UI
 *
 * Maps component names to their prop types for type-safe UI emission
 * using typedUi from LangGraph SDK.
 */

import type { Task } from "../lib/convex.js";

/**
 * Map of component names to their expected props.
 * Used with typedUi<UIComponentMap> for type-safe UI emission.
 */
export interface UIComponentMap {
  /**
   * Display-only: Shows a table of tasks
   */
  TaskTable: {
    tasks: Task[];
  };

  /**
   * Display-only: Shows a single task card
   */
  TaskCard: {
    task: Task;
  };

  /**
   * Interactive: Form for creating or editing a task
   * Used during human-in-the-loop interrupts
   */
  TaskEditForm: {
    task: Partial<Task>;
    mode: "create" | "edit";
  };

  /**
   * Interactive: Confirmation dialog for deleting a task
   * Used during human-in-the-loop interrupts
   */
  TaskConfirmDelete: {
    task: Task;
  };
}

/**
 * Union type of all component names
 */
export type UIComponentName = keyof UIComponentMap;
