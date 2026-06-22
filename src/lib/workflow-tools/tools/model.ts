import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLLMClient } from "./createLLMClient";
import type { ToolFactory } from "../types";

export const createModelTool: ToolFactory = (config) => {
  const provider = config?.provider || "openai";
  const apiKey = config?.apiKey || "";
  const modelName = config?.modelName || "";

  return tool(
    async ({ prompt, system }) => {
      if (!apiKey) {
        return "Model tool is not configured. Double-click the node and add an API key credential.";
      }

      const llm = await createLLMClient({ provider, modelName, apiKey });
      const messages = system
        ? [new SystemMessage(system), new HumanMessage(prompt)]
        : [new HumanMessage(prompt)];
      const response = await llm.invoke(messages);
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    },
    {
      name: "model",
      description:
        "Call an LLM model with a prompt and optional system instruction. Use this for reasoning, analysis, and text generation.",
      schema: z.object({
        prompt: z.string().describe("The prompt to send to the model"),
        system: z
          .string()
          .optional()
          .describe("Optional system prompt for context"),
      }),
    },
  );
};
