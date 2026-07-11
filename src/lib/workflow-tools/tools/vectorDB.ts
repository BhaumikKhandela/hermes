import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";
import { ToolFactory } from "../types";

const vectorDBSchema = z.object({
  action: z
    .enum(["query", "upsert", "delete"])
    .describe("Operation to perform"),
  vector: z
    .union([z.array(z.number()), z.string()])
    .optional()
    .describe("Query or upsert vector as number array or JSON string"),
  id: z
    .string()
    .optional()
    .describe("Vector ID (required for upsert and deleteById)"),
  namespace: z
    .string()
    .optional()
    .describe("Pinecone namespace"),
  topK: z
    .number()
    .optional()
    .describe("Number of results to return (default: 5)"),
  filter: z
    .any()
    .optional()
    .describe("Metadata filter for query or deleteMany"),
  includeMetadata: z
    .boolean()
    .optional()
    .describe("Whether to include metadata in query results (default: true)"),
  metadata: z
    .any()
    .optional()
    .describe("Metadata object to attach on upsert"),
  deleteAll: z
    .boolean()
    .optional()
    .describe("Delete all vectors in the namespace (used with delete action)"),
});

const partialVectorDBSchema = vectorDBSchema.partial();

type VecInput = z.input<typeof partialVectorDBSchema>;

function parseVector(v: any): number[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  throw new Error("vector must be a number array or valid JSON array string");
}

export const createVectorDBTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";
  const indexName = config?.indexName || "";

  return tool(
    async (input: VecInput) => {
      if (!apiKey || !indexName) {
        return "Vector DB tool is not configured. Double-click the node and provide API Key and Index Name.";
      }

      const parsed = partialVectorDBSchema.parse(input);
      const action = parsed.action || config?.action || "query";
      const namespace = parsed.namespace || config?.namespace || "";
      const vector = parsed.vector || config?.vector;
      const id = parsed.id || config?.id;
      const topK = parsed.topK || config?.topK || 5;
      const filter = parsed.filter || config?.filter;
      const includeMetadata = parsed.includeMetadata ?? config?.includeMetadata ?? true;
      const metadata = parsed.metadata || config?.metadata;
      const deleteAll = parsed.deleteAll ?? config?.deleteAll ?? false;

      const pinecone = new Pinecone({ apiKey });
      const index = pinecone.index(indexName);
      const ns = namespace || undefined;

      switch (action) {
        case "query": {
          if (!vector) {
            return "vector is required for query. Provide it as a tool argument or configure it in the node settings.";
          }
          const parsedVector = parseVector(vector);
          const result = await index.query({
            vector: parsedVector,
            topK,
            includeMetadata,
            namespace: ns,
            ...(filter ? { filter } : {}),
          });
          return JSON.stringify(result.matches);
        }

        case "upsert": {
          if (!vector || !id) {
            return "vector and id are required for upsert. Provide them as tool arguments or configure them in the node settings.";
          }
          const parsedVector = parseVector(vector);
          const record: { id: string; values: number[]; metadata?: any } = {
            id,
            values: parsedVector,
          };
          if (metadata) {
            record.metadata = metadata;
          }
          await index.upsert({
            records: [record],
            namespace: ns,
          });
          return `Upserted vector with id: ${id}`;
        }

        case "delete": {
          if (deleteAll) {
            await index.deleteAll({ namespace: ns });
            return `Deleted all vectors${namespace ? ` in namespace "${namespace}"` : ""}.`;
          }
          if (filter) {
            await index.deleteMany({ filter, namespace: ns });
            return `Deleted vectors matching filter${namespace ? ` in namespace "${namespace}"` : ""}.`;
          }
          if (!id) {
            return "id, filter, or deleteAll is required for delete. Provide one as a tool argument or configure it in the node settings.";
          }
          await index.deleteOne({ id, namespace: ns });
          return `Deleted vector with id: ${id}`;
        }

        default:
          return `Unknown action: ${action}. Use query, upsert, or delete.`;
      }
    },
    {
      name: "vectorDB",
      description:
        "Query, upsert, or delete vectors in a Pinecone index. Supports metadata filtering on query, metadata attachment on upsert, and delete by ID, by filter, or delete all. Falls back to configured values when arguments are omitted.",
      schema: partialVectorDBSchema,
    },
  );
};
