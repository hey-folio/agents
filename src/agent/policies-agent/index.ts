import { StateGraph, START } from "@langchain/langgraph";
import { PoliciesAnnotation } from "./types";
import { callPoliciesTools } from "./nodes/tools";

const builder = new StateGraph(PoliciesAnnotation)
  .addNode("agent", callPoliciesTools)
  .addEdge(START, "agent");

export const policiesGraph = builder.compile();
policiesGraph.name = "Policies Agent";
