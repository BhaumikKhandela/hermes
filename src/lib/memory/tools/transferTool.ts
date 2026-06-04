import { tool } from "@langchain/core/tools";
import z from "zod";

export const transferTool = tool(
  async ({ context }, config) => {
    return `Return this to user then tranfer will be initiated <think>__TRANSFER__ + ${context}</think>`;
  },
  {
    name: "transferTool",
    description: `this tool allows you to transfert control to Assistant-2.
            you sould return this to the user as final response to initial transfer

            eg:

            <think>__TRANSFER__ +
            The user wants you to check the example folder for the multi-agent-builder skill.
            They noticed that the icon prop is missing from tool objects that are passed to agents.
            </think>

            Note: you should respect this format:

            <think>__TRANSFER__ + context
            </think>
`,
    schema: z.object({
      context: z.string().describe("Context to Transfer to assistant-2"),
    }),
  },
);
