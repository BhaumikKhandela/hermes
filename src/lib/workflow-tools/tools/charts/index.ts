import { tool } from "@langchain/core/tools";
import type { ToolFactory } from "../../types";
import { chartSchema } from "./schema";
import * as H from "./handlers";

export const handlerMap: Record<string, Function> = {
  generate: H.handleGenerate,
};

export { chartSchema };

export const createChartTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = chartSchema.parse(input);
      const action = parsed.action || config?.action || "generate";
      const handler = handlerMap[action];
      if (!handler) throw new Error(`Chart tool: unknown action "${action}".`);
      const result = await handler(parsed, config);
      return JSON.stringify(result);
    },
    {
      name: "chart",
      description:
        "Generate pie, line, bar, doughnut, radar, polar area, and bubble charts. Provide data, labels, colors, and title. Returns a QuickChart image URL and markdown tag.",
      schema: chartSchema,
    },
  );
};
