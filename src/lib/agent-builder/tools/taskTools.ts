import { tool, createAgent, createMiddleware } from "langchain";
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { toolMonitoringMiddleware } from "../middlewares/toolMonitoring";
import { DEFAULT_SUBAGENT_PROMPT, getTaskToolDescription } from "../prompts/agent-builder-prompt";
import { RunnableConfig } from "@langchain/core/runnables";

const taskToolDescription = getTaskToolDescription();

// The Task Tool: This is where spawing happens.

export const createTaskTool = (model: any, config: any = {}) => {
  return tool(async ({ sub_agent, task }, toolConfig: RunnableConfig & { writer?: Function }) => {
    if (!task || !sub_agent) {
      return "Please provide subName and with Task that will be executed";
    }

    const subagent = createAgent({
      model,
      tools: [...config.tools],
      systemPrompt: `${DEFAULT_SUBAGENT_PROMPT}\n\n
                
                Once you finish the research you should only return the name of the file where data is stored.
                
                \n\nTask: ${task}`,
      middleware: [toolMonitoringMiddleware],
    });

    const subagentStream = await subagent.stream(
      { messages: [new HumanMessage(task)] },
      { streamMode: "messages", ...toolConfig },
    );

    let finalContent = "";

    for await (const [messageChunk, metadata] of subagentStream) {
      if (messageChunk?.type !== "ai") continue;
      if (messageChunk.content) {
        toolConfig.writer?.({
          subagent_name: sub_agent,
          content: messageChunk.content,
        });

        finalContent += messageChunk.content;
      }
    }

    return finalContent;
  },
{
    name: "task",
    description: taskToolDescription,
    schema: z.object({
        sub_agent: z.string().describe("The name must be unique for each spawn sub-agent"),
        task: z.string().describe("Highly detailed instructions for the subagent")
    })
})
};
