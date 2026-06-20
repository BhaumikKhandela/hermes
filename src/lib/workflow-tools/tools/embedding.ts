import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { CohereEmbeddings } from "@langchain/cohere";
import { ToolFactory } from "../types";

export const createEmbeddingTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || process.env.COHERE_API_KEY;

  if (!apiKey) {
    throw new Error("Cohere embeddings require COHERE_API_KEY env var");
  }

  const embeddings = new CohereEmbeddings({
    apiKey,
    model: config?.model || "embed-english-v3.0",
  });

  return tool(
    async ({ text }) => {
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
