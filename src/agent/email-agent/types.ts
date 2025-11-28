import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";
import { HumanResponse } from "@langchain/langgraph/prebuilt";

export type Email = {
  subject: string;
  body: string;
  to: string;
};

export const EmailAgentAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  email: Annotation<Email | undefined>(),
  humanResponse: Annotation<HumanResponse | undefined>(),
});

export type EmailAgentState = typeof EmailAgentAnnotation.State;
export type EmailAgentUpdate = typeof EmailAgentAnnotation.Update;
