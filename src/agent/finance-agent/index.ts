import { StateGraph, START } from "@langchain/langgraph";
import { FinanceAnnotation } from "./types";
import { callFinanceTools } from "./nodes/tools";

const builder = new StateGraph(FinanceAnnotation)
  .addNode("agent", callFinanceTools)
  .addEdge(START, "agent");

export const financeGraph = builder.compile();
financeGraph.name = "Finance Agent";
