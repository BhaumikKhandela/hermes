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

export async function theAgentBuilder(
  userInput: string,
  config: any,
  { projectId, userId }: { projectId: string; userId: string },
) {
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
      messages: [
        new HumanMessage(`
        Before Start working on any Task : I want you to follow these steps:
        <user_instructions>
        step 1.First Identify the right skill to use in skills folder and follow all skill instructions step by step.
        You should read every folders or file for specific skill you want to use.

        OBLIGATIONS
        - Do not Ignore skill instructions instead you should execute them step by step.
          eg: If user ask you about extracting data from pdf you should read the pdf skill.md
              THEN start working user Task based on the pdf skill.md instructions
        - you must Execute step by step all skill instructions based on the ongoing Task.
        - analyze the skill.md carefull take into account every details

        If you donot identify the rigth skill to use just take control of that
        step 2. Before creating a TodoList identify if a Task if complex or need multi-step
        step 3. Breaking down a Task by Creating a TodoList
        step 4. you must update the todo List when a Task is completed
            Rules:
            step 1: use ls to list file name
            step 2: read it, identify the task to update
        step 5. you should not work alone it better to spawn subAgent to be efficient for complex inputs
        step 6. This is about Research, When researcher subAgent or subAgent finish , DO NOT read the research files immediately.
        Only read Research files during the synthesis phase.
        step 7. About sandbox once you or subagents finish working , you should export files to working-agent-folder folder.
        userInput: ${userInput}
        </user_instructions>`),
      ],
    },
    {
      streamMode: "messages",
      configurable: {
        userId,
        projectId,
      },
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
