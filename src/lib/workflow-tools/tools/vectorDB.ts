import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";
import { ToolFactory } from "../types";

export const createVectorDBTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || process.env.PINECONE_API_KEY || "";
  const indexName = config?.indexName || process.env.PINECONE_INDEX || "";

  if (!apiKey || !indexName) {
    throw new Error(
      "Vector DB requires PINECONE_API_KEY and PINECONE_INDEX env vars",
    );
  }

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index(indexName);

  return tool(
    async ({ action, vector, id, namespace, topK }) => {
      const ns = namespace || "";

      switch (action) {
        case "query": {
          if (!vector) {
            return "vector is required for query";
          }
          const parsedVector =
            typeof vector === "string" ? JSON.parse(vector) : vector;
          const result = await index.query({
            vector: parsedVector,
            topK: topK || 5,
            includeMetadata: true,
            namespace: ns || undefined,
          });
          return JSON.stringify(result.matches);
        }
        case "upsert": {
          if (!vector || !id) {
            return "vector and id are required for upsert";
          }
          const parsedVector =
            typeof vector === "string" ? JSON.parse(vector) : vector;
          await index.upsert({
            records: [
              {
                id,
                values: parsedVector,
                metadata: { text: config?.text || "" },
              },
            ],
            namespace: ns || undefined,
          });
          return `Upserted vector with id: ${id}`;
        }
        case "delete": {
          if (!id) {
            return "id is required for delete";
          }
          await index.deleteOne({ id, namespace: ns || undefined });
          return `Deleted vector with id: ${id}`;
        }
        default:
          return `Unknown action: ${action}. Use query, upsert, or delete.`;
      }
    },
    {
      name: "vectorDB",
      description:
        "Query, upsert, or delete vectors in a Pinecone index.",
      schema: z.object({
        action: z
          .enum(["query", "upsert", "delete"])
          .describe("Operation to perform"),
        vector: z
          .any()
          .optional()
          .describe(
            "Vector as array of numbers or JSON string (required for query and upsert)",
          ),
        id: z
          .string()
          .optional()
          .describe("Vector ID (required for upsert and delete)"),
        namespace: z.string().optional().describe("Pinecone namespace"),
        topK: z
          .number()
          .optional()
          .describe("Number of results (default: 5)"),
      }),
    },
  );
};
