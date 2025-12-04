import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { ALL_TOOL_DESCRIPTIONS } from "../index";
import { SupervisorState, SupervisorUpdate } from "../types";
import { formatMessages } from "@/agent/utils/format-messages";

export async function router(
  state: SupervisorState,
): Promise<Partial<SupervisorUpdate>> {
  const routerDescription = `The route to take based on the user's input.
${ALL_TOOL_DESCRIPTIONS}
- generalInput: handles all other cases where the above agents don't apply
`;
  const routerSchema = z.object({
    route: z
      .enum([
        "financeAgent",
        "operationsAgent",
        "projectsAgent",
        "policiesAgent",
        "generalInput",
      ])
      .describe(routerDescription),
  });
  const routerTool = {
    name: "router",
    description: "A tool to route the user's query to the appropriate agent.",
    schema: routerSchema,
  };

  const llm = new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    temperature: 0,
  })
    .bindTools([routerTool], { tool_choice: { type: "tool", name: "router" } })
    .withConfig({ tags: ["langsmith:nostream"] });

  const prompt = `You're a highly helpful AI assistant for a digital design agency's operations team. Your job is to route the user's query to the appropriate specialized agent.

Available agents:
- financeAgent: For expense submissions, approvals, financial reports, budgets
- operationsAgent: For travel bookings, meetings, scheduling
- projectsAgent: For tasks, projects, timesheets, assignments
- policiesAgent: For company policy questions and HR inquiries
- generalInput: For general questions and anything not covered above

Analyze the user's input and choose the most appropriate agent.`;

  const allMessagesButLast = state.messages.slice(0, -1);
  const lastMessage = state.messages.at(-1);

  const formattedPreviousMessages = formatMessages(allMessagesButLast);
  const formattedLastMessage = lastMessage ? formatMessages([lastMessage]) : "";

  const humanMessage = `Here is the full conversation, excluding the most recent message:

${formattedPreviousMessages}

Here is the most recent message:

${formattedLastMessage}

Please pick the proper route based on the most recent message, in the context of the entire conversation.`;

  const response = await llm.invoke([
    { role: "system", content: prompt },
    { role: "user", content: humanMessage },
  ]);

  const toolCall = response.tool_calls?.[0]?.args as
    | z.infer<typeof routerSchema>
    | undefined;
  if (!toolCall) {
    throw new Error("No tool call found in response");
  }

  return {
    next: toolCall.route,
  };
}
