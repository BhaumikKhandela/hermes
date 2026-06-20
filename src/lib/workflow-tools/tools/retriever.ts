import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { ToolFactory } from "../types";

export const createRetrieverTool: ToolFactory = (config) => {
  const pineconeApiKey =
    config?.pineconeApiKey || process.env.PINECONE_API_KEY || "";
  const cohereApiKey =
    config?.cohereApiKey || process.env.COHERE_API_KEY || "";
  const indexName = config?.indexName || process.env.PINECONE_INDEX || "";

  if (!pineconeApiKey || !cohereApiKey || !indexName) {
    throw new Error(
      "Retriever requires PINECONE_API_KEY, COHERE_API_KEY, and PINECONE_INDEX env vars",
    );
  }

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
  const index = pinecone.index(indexName);
  const embeddings = new CohereEmbeddings({
    apiKey: cohereApiKey,
    model: "embed-english-v3.0",
  });

  return tool(
    async ({ query, namespace, topK }) => {
      const vector = await embeddings.embedQuery(query);
      const result = await index.namespace(namespace || "").query({
        vector,
        topK: topK || 5,
        includeMetadata: true,
      });

      if (!result.matches?.length) {
        return "No relevant documents found.";
      }

      return result.matches
        .map(
          (match, i) =>
            `[${i + 1}] Score: ${(match.score || 0).toFixed(3)}\n${match.metadata?.text || "No text"}\n`,
        )
        .join("\n");
    },
    {
      name: "retriever",
      description:
        "Retrieve relevant documents from a vector database using semantic search. Embeds the query and returns ranked results.",
      schema: z.object({
        query: z.string().describe("Search query"),
        namespace: z.string().optional().describe("Pinecone namespace"),
        topK: z
          .number()
          .optional()
          .describe("Number of results (default: 5)"),
      }),
    },
  );
};
