import { Annotation } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import {
  UIMessage,
  RemoveUIMessage,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";

export const OperationsAnnotation = Annotation.Root({
  messages: MessagesAnnotation.spec["messages"],
  ui: Annotation<
    UIMessage[],
    UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]
  >({
    default: () => [],
    reducer: uiMessageReducer,
  }),
  context: Annotation<Record<string, unknown> | undefined>,
  timestamp: Annotation<number>,
});

export type OperationsState = typeof OperationsAnnotation.State;
export type OperationsUpdate = typeof OperationsAnnotation.Update;
