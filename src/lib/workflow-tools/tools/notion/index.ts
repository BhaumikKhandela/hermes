import { tool } from "@langchain/core/tools";
import { ToolFactory } from "../../types";
import { partialNotionSchema } from "./schema";
import { handleQuery, handleCreate, handleUpdate, handleRetrieve, handleAppend } from "./handler";

export { partialNotionSchema };

export const createNotionTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = partialNotionSchema.parse(input);
      const action = parsed.action || config?.action || "query";

      let result;
      switch (action) {
        case "query":
          result = await handleQuery(parsed, config);
          break;
        case "create":
          result = await handleCreate(parsed, config);
          break;
        case "update":
          result = await handleUpdate(parsed, config);
          break;
        case "retrieve":
          result = await handleRetrieve(parsed, config);
          break;
        case "append":
          result = await handleAppend(parsed, config);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return JSON.stringify(result);
    },
    {
      name: "notion",
      description:
        "Query, create, update, retrieve, or append content to Notion pages and databases using the 2026-03-11 API. Falls back to configured values when arguments are omitted.",
      schema: partialNotionSchema,
    },
  );
};
