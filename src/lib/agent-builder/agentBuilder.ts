import { tool, createAgent, createMiddleware } from "langchain";
import {
  SystemMessage,
  ToolMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { summarizationMiddleware } from "langchain";
import { LLM } from "../llm/LLM";
import { filesystemTools } from "./tools/fsTools";
import { basePrompt, TASK_SYSTEM_PROMPT } from "./prompts/agent-builder-prompt";
import { todoListTools } from "./tools/todoTools";
import { createTaskTool } from "./tools/taskTools";
import { toolMonitoringMiddleware } from "./middlewares/toolMonitoring";
import { think_tool } from "./tools/thinkTool";
import { saveAgentTreeTool } from "./tools/saveAgentTree";

const model = LLM.getInstance("cerebras");

const subagentConfigs = {
  tools: [...filesystemTools, saveAgentTreeTool],
};

export async function theAgentBuilder(userInput: string, config: any) {
  // For the Main Manager Agent
  const agent = createAgent({
    model: LLM.getInstance("cerebras"),
    systemPrompt: `
        <system>
        ${basePrompt}
        \n\n
        ${TASK_SYSTEM_PROMPT}
        `,
    tools: [
      ...filesystemTools,
      ...todoListTools,
      think_tool,
      saveAgentTreeTool,
      createTaskTool(model, subagentConfigs),
    ] as const,
    middleware: [
      summarizationMiddleware({
        model: LLM.getInstance("gpt4o_mini"), // Fast summarization
        trigger: [
          { tokens: 8000, messages: 15 }, // Only summarize when context is actually heavy
          { tokens: 10000 }, // Absolute ceiling for safety
        ],
        keep: { messages: 20 }, // Keep enough history to preserve Tool Call/Response pairs
      }),
      toolMonitoringMiddleware,
    ],
  });

  const agentStream = await agent.stream(
    {
      messages: [new HumanMessage(`userInput: ${userInput}`)],
    },
    {
      streamMode: "messages",
    },
  );

  let fullContent = "";

  for await (const [messageChunk, metadata] of agentStream) {
    if (messageChunk?.type !== "ai") continue;

    if (messageChunk.content) {
      const text = messageChunk.content;
      fullContent += text;

      config.writer({
        manager_name: "agentBuilder",
        content: text,
      });
    }
  }

  return fullContent;
}
