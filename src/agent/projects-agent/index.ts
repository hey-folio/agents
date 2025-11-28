import { StateGraph, START } from "@langchain/langgraph";
import { ProjectsAnnotation } from "./types";
import { callProjectsTools } from "./nodes/tools";

const builder = new StateGraph(ProjectsAnnotation)
  .addNode("agent", callProjectsTools)
  .addEdge(START, "agent");

export const projectsGraph = builder.compile();
projectsGraph.name = "Projects Agent";
