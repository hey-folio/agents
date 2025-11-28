import { PoliciesState, PoliciesUpdate } from "../types";
import { ChatAnthropic } from "@langchain/anthropic";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../../agent-uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { findToolCall } from "../../find-tool-call";
import { jsonStore } from "../../operations-team/utils/json-store";
import { Policy, PolicyCategorySchema } from "../../operations-team/types";

// Tool schemas
const searchPoliciesSchema = z.object({
  query: z.string().describe("Search query - keywords to look for in policies"),
  category: PolicyCategorySchema.optional().describe("Filter by policy category"),
});

const getPolicySchema = z.object({
  policyId: z.string().describe("ID of the policy to retrieve"),
});

const listPoliciesByCategorySchema = z.object({
  category: PolicyCategorySchema.describe("Policy category to list"),
});

const answerPolicyQuestionSchema = z.object({
  question: z.string().describe("The policy-related question to answer"),
});

const POLICIES_TOOLS = [
  {
    name: "search-policies",
    description: "Search for policies by keyword or topic. Use when someone asks about a policy or has a general question.",
    schema: searchPoliciesSchema,
  },
  {
    name: "get-policy",
    description: "Get the full content of a specific policy by ID.",
    schema: getPolicySchema,
  },
  {
    name: "list-policies-by-category",
    description: "List all policies in a specific category (expense, travel, time_off, remote_work, equipment, conduct, security, benefits, general).",
    schema: listPoliciesByCategorySchema,
  },
  {
    name: "answer-policy-question",
    description: "Answer a specific question about company policies. Searches relevant policies and provides an answer with citations.",
    schema: answerPolicyQuestionSchema,
  },
];

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-20250514",
  temperature: 0,
});

// Simple keyword matching for policy search
function searchInPolicy(policy: Policy, query: string): number {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  let score = 0;

  // Check title
  if (policy.title.toLowerCase().includes(queryLower)) score += 10;

  // Check keywords
  policy.keywords.forEach((keyword) => {
    if (keyword.toLowerCase().includes(queryLower)) score += 5;
    queryTerms.forEach((term) => {
      if (keyword.toLowerCase().includes(term)) score += 2;
    });
  });

  // Check summary
  if (policy.summary.toLowerCase().includes(queryLower)) score += 3;

  // Check section content
  policy.sections.forEach((section) => {
    if (section.title.toLowerCase().includes(queryLower)) score += 3;
    if (section.content.toLowerCase().includes(queryLower)) score += 2;
    queryTerms.forEach((term) => {
      if (section.content.toLowerCase().includes(term)) score += 1;
    });
  });

  return score;
}

// Find relevant sections for a query
function findRelevantSections(policy: Policy, query: string): string[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);
  const relevantSections: string[] = [];

  policy.sections.forEach((section) => {
    const contentLower = section.content.toLowerCase();
    const titleLower = section.title.toLowerCase();

    const isRelevant =
      titleLower.includes(queryLower) ||
      contentLower.includes(queryLower) ||
      queryTerms.some((term) => contentLower.includes(term) || titleLower.includes(term));

    if (isRelevant) {
      relevantSections.push(section.id);
    }
  });

  return relevantSections;
}

export async function callPoliciesTools(
  state: PoliciesState,
  config: LangGraphRunnableConfig
): Promise<PoliciesUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = await llm.bindTools(POLICIES_TOOLS).invoke([
    {
      role: "system",
      content: `You are a helpful HR and operations assistant for a digital design agency. You help employees find and understand company policies.

Your main job is to:
- Search for relevant policies based on questions
- Provide clear answers with policy citations
- Help navigate the policy documentation

Available policy categories: expense, travel, time_off, remote_work, equipment, conduct, security, benefits, general

When someone asks a question, use the search-policies or answer-policy-question tool to find relevant information. Be helpful, accurate, and cite your sources.`,
    },
    ...state.messages,
  ]);

  // Handle search-policies
  const searchCall = message.tool_calls?.find(
    findToolCall("search-policies")<typeof searchPoliciesSchema>
  );

  if (searchCall) {
    let policies = jsonStore.read<Policy>("policies");

    // Filter by category if provided
    if (searchCall.args.category) {
      policies = policies.filter((p) => p.category === searchCall.args.category);
    }

    // Score and sort by relevance
    const scoredPolicies = policies
      .map((p) => ({
        policy: p,
        score: searchInPolicy(p, searchCall.args.query),
        relevantSections: findRelevantSections(p, searchCall.args.query),
      }))
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    ui.push(
      {
        name: "policy-search-results",
        props: {
          query: searchCall.args.query,
          results: scoredPolicies.map((sp) => ({
            ...sp.policy,
            relevantSections: sp.relevantSections,
          })),
        },
      },
      { message }
    );
  }

  // Handle get-policy
  const getPolicyCall = message.tool_calls?.find(
    findToolCall("get-policy")<typeof getPolicySchema>
  );

  if (getPolicyCall) {
    const policy = jsonStore.findById<Policy>("policies", getPolicyCall.args.policyId);

    if (policy) {
      ui.push(
        {
          name: "policy-viewer",
          props: {
            policy,
          },
        },
        { message }
      );
    }
  }

  // Handle list-policies-by-category
  const listByCategoryCall = message.tool_calls?.find(
    findToolCall("list-policies-by-category")<typeof listPoliciesByCategorySchema>
  );

  if (listByCategoryCall) {
    const policies = jsonStore.filter<Policy>(
      "policies",
      (p) => p.category === listByCategoryCall.args.category
    );

    ui.push(
      {
        name: "policy-list",
        props: {
          category: listByCategoryCall.args.category,
          policies,
        },
      },
      { message }
    );
  }

  // Handle answer-policy-question
  const answerCall = message.tool_calls?.find(
    findToolCall("answer-policy-question")<typeof answerPolicyQuestionSchema>
  );

  if (answerCall) {
    const policies = jsonStore.read<Policy>("policies");

    // Score and find relevant policies
    const scoredPolicies = policies
      .map((p) => ({
        policy: p,
        score: searchInPolicy(p, answerCall.args.question),
        relevantSections: findRelevantSections(p, answerCall.args.question),
      }))
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Build sources for the answer
    const sources = scoredPolicies.map((sp) => {
      const relevantContent = sp.policy.sections
        .filter((s) => sp.relevantSections.includes(s.id))
        .map((s) => ({
          sectionTitle: s.title,
          content: s.content,
        }));

      return {
        policyId: sp.policy.id,
        policyTitle: sp.policy.title,
        category: sp.policy.category,
        sections: relevantContent.length > 0 ? relevantContent : [{ sectionTitle: "Overview", content: sp.policy.summary }],
      };
    });

    ui.push(
      {
        name: "policy-qa",
        props: {
          question: answerCall.args.question,
          sources,
          confidence: scoredPolicies.length > 0 ? Math.min(100, scoredPolicies[0].score * 10) : 0,
        },
      },
      { message }
    );
  }

  return {
    messages: [message],
    ui: ui.items,
    timestamp: Date.now(),
  };
}
