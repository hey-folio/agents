import { END, START, StateGraph } from "@langchain/langgraph";
import { EmailAgentAnnotation, EmailAgentState } from "./types";
import { writeEmail } from "./nodes/write-email";
import { interruptNode } from "./nodes/interrupt";
import { sendEmail } from "./nodes/send-email";
import { rewriteEmail } from "./nodes/rewrite-email";

function routeAfterInterrupt(
  state: EmailAgentState,
): typeof END | "sendEmail" | "rewriteEmail" {
  const responseType = state.humanResponse?.type;
  if (!responseType || responseType === "ignore") {
    return END;
  }
  if (responseType === "response") {
    return "rewriteEmail";
  }

  return "sendEmail";
}

function routeAfterWritingEmail(
  state: EmailAgentState,
): typeof END | "interrupt" {
  if (!state.email) {
    return END;
  }
  return "interrupt";
}

const graph = new StateGraph(EmailAgentAnnotation)
  .addNode("writeEmail", writeEmail)
  .addNode("interrupt", interruptNode)
  .addNode("sendEmail", sendEmail)
  .addNode("rewriteEmail", rewriteEmail)
  .addEdge(START, "writeEmail")
  .addConditionalEdges("writeEmail", routeAfterWritingEmail, [END, "interrupt"])
  .addConditionalEdges("interrupt", routeAfterInterrupt, [
    "sendEmail",
    "rewriteEmail",
    END,
  ])
  .addEdge("rewriteEmail", "interrupt")
  .addEdge("sendEmail", END);

export const agent = graph.compile();
agent.name = "Email Assistant Agent";
