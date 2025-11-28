import { StateGraph, START } from "@langchain/langgraph";
import { OperationsAnnotation } from "./types";
import { callOperationsTools } from "./nodes/tools";

const builder = new StateGraph(OperationsAnnotation)
  .addNode("agent", callOperationsTools)
  .addEdge(START, "agent");

export const operationsGraph = builder.compile();
operationsGraph.name = "Operations Agent";
