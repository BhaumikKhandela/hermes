import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { CohereEmbeddings } from "@langchain/cohere";
import { ToolFactory } from "../types";

export const createEmbeddingTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async ({ text }) => {
      if (!apiKey) {
        return "Embedding tool is not configured. Double-click the node and provide a Cohere API Key.";
      }

      const embeddings = new CohereEmbeddings({
        apiKey,
        model: config?.model || "embed-english-v3.0",
      });

      const vector = await embeddings.embedQuery(text);
      return JSON.stringify(vector);
    },
    {
      name: "embedding",
      description:
        "Convert text into a vector embedding using Cohere. Returns a JSON array of floats.",
      schema: z.object({
        text: z.string().describe("Text to embed"),
      }),
    },
  );
};
