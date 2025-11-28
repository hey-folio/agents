import { StateGraph, START, END } from "@langchain/langgraph";
import { financeGraph } from "../finance-agent";
import { operationsGraph } from "../operations-agent";
import { projectsGraph } from "../projects-agent";
import { policiesGraph } from "../policies-agent";
import {
  SupervisorAnnotation,
  SupervisorState,
  SupervisorZodConfiguration,
} from "./types";
import { generalInput } from "./nodes/general-input";
import { router } from "./nodes/router";

export const ALL_TOOL_DESCRIPTIONS = `- financeAgent: handles expense submissions, approvals, financial reporting, and budget tracking. Use for expense reports, reimbursements, financial summaries, and spending analysis.
- operationsAgent: manages travel bookings (flights, hotels), meeting scheduling, and operational logistics. Use for booking trips, scheduling meetings, and viewing travel itineraries.
- projectsAgent: handles project management, task tracking, timesheets, and team workload. Use for creating/updating tasks, logging time, viewing project status, and managing assignments.
- policiesAgent: provides information about company policies including expenses, travel, time off, remote work, equipment, conduct, security, and benefits. Use for policy questions and HR-related inquiries.`;

function handleRoute(
  state: SupervisorState,
):
  | "financeAgent"
  | "operationsAgent"
  | "projectsAgent"
  | "policiesAgent"
  | "generalInput" {
  return state.next;
}

const builder = new StateGraph(SupervisorAnnotation, SupervisorZodConfiguration)
  .addNode("router", router)
  .addNode("financeAgent", financeGraph)
  .addNode("operationsAgent", operationsGraph)
  .addNode("projectsAgent", projectsGraph)
  .addNode("policiesAgent", policiesGraph)
  .addNode("generalInput", generalInput)
  .addConditionalEdges("router", handleRoute, [
    "financeAgent",
    "operationsAgent",
    "projectsAgent",
    "policiesAgent",
    "generalInput",
  ])
  .addEdge(START, "router")
  .addEdge("financeAgent", END)
  .addEdge("operationsAgent", END)
  .addEdge("projectsAgent", END)
  .addEdge("policiesAgent", END)
  .addEdge("generalInput", END);

export const graph = builder.compile();
graph.name = "Operations Team Agent";
