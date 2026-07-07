import { createAgent } from "langchain";

import { PLANNER_SYSTEM_PROMPT } from "./prompts/prompt";
import { toolMonitoringMiddleware } from "../shared/middlewares/toolMonitoring";
import { think_tool } from "../shared/tools/thinkTool";
import { filesystemTools } from "../shared/tools/fsTools";
import { todoListTools } from "../shared/tools/todoTools";
import { createTaskTool } from "./tools/taskTools";
import {
  listRegisteredToolsTool,
  askMCQTool,
  createPlanDocTool,
  presentPlanTool,
  editPlanTool,
  readPlanFileTool,
  updatePlanStatusTool,
} from "./tools/plannerTools";
import { transferToBuilderTool } from "./tools/transferToBuilderTool";
import { LLM } from "@/lib/llm/LLM";

export async function createPlannerAgent({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const model = LLM.getInstance("cerebras");

  const subagentConfigs = {
    tools: [...filesystemTools],
  };

  const agent = createAgent({
    model,
    systemPrompt: PLANNER_SYSTEM_PROMPT,
    tools: [
      listRegisteredToolsTool,
      askMCQTool,
      createPlanDocTool,
      presentPlanTool,
      editPlanTool,
      readPlanFileTool,
      updatePlanStatusTool,
      think_tool,
      ...filesystemTools,
      ...todoListTools,
      createTaskTool(model, subagentConfigs),
      transferToBuilderTool,
    ] as const,
    middleware: [toolMonitoringMiddleware],
    name: "planner-agent",
  });

  async function streamPlanner(inputText: string, config: any) {
    const agentStream = await agent.stream(
      {
        messages: [{ role: "user", content: inputText }],
      },
      {
        streamMode: "messages",
        configurable: {
          ...config?.configurable,
          userId,
          projectId,
          writer: config?.configurable?.writer ?? config.writer,
        },
      },
    );

    let fullContent = "";

    for await (const [messageChunk, metadata] of agentStream) {
      if (messageChunk.content) {
        const text = messageChunk.content;
        fullContent += text;

        if (messageChunk?.type === "ai") {
          config.writer({
            manager_name: "planner",
            content: text,
          });
        }
      }
    }

    return fullContent;
  }

  return {
    streamPlanner,
  };
}
