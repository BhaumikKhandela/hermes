import { tool } from "@langchain/core/tools";
import z from "zod";

export const transferToBuilderTool = tool(
  async ({ context }) => {
    console.log("[transferToBuilderTool] called with context:", context.substring(0, 200));
    return ` thinking__TRANSFER_TO_BUILDER__ + ${context} response`;
  },
  {
    name: "transferToBuilder",
    description: `Transfer control to AgentBuilder after the plan is approved.
Call this only after the user approves the plan.
The context should include:
- Plan filename (plan-[projectId].json)
- Brief summary of what needs to be built

Example:
 thinking__TRANSFER_TO_BUILDER__ + plan-abc123.json - Build a 3-agent competitor research workflow
 response`,
    schema: z.object({
      context: z.string().describe("Context to pass to AgentBuilder - include plan filename and summary"),
    }),
  },
);
