import { ChatOpenAI } from "@langchain/openai";
// import { ChatAnthropic } from "@langchain/anthropic";  // Available for switching
import { z } from "zod";

/**
 * Central model configuration
 *
 * To switch providers, change MODEL_NAME and update model classes.
 */
export const MODEL_NAME = "gpt-4.1";

// Default model instance for agents
export const defaultModel = new ChatOpenAI({
  model: MODEL_NAME,
});

// Schema for structured suggestion output
const SuggestionsSchema = z.object({
  suggestions: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("2-4 brief follow-up suggestions the user might ask next"),
});

// Pre-configured model instance for structured output (suggestions)
export const suggestionModel = new ChatOpenAI({
  model: MODEL_NAME,
  maxTokens: 200,
}).withStructuredOutput(SuggestionsSchema);

// Schema for structured title output
const TitleSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(50)
    .describe("A short, descriptive title (3-6 words) for the conversation"),
});

// Pre-configured model instance for structured output (chat title generation)
export const titleModel = new ChatOpenAI({
  model: MODEL_NAME,
  maxTokens: 50,
}).withStructuredOutput(TitleSchema);
