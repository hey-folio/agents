import { v4 as uuidv4 } from "uuid";
import { AIMessage } from "@langchain/langgraph-sdk";
import { EmailAgentState, EmailAgentUpdate } from "../types";

export async function sendEmail(
  _state: EmailAgentState,
): Promise<EmailAgentUpdate> {
  // Should yield a gen ui component rendering a 'sent' email.
  const tmpAiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "Successfully sent email.",
  };
  return {
    messages: [tmpAiMessage],
  };
}
