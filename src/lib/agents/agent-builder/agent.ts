// FIXED: Added mandatory execution steps to HumanMessage, fixed streaming to capture tool messages,
// and updated basePrompt to enforce actual tool calls (not just descriptions).

import { tool, createAgent, createMiddleware } from "langchain";
import {
  SystemMessage,
  ToolMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { summarizationMiddleware } from "langchain";

import { filesystemTools } from "../shared/tools/fsTools";
import { basePrompt } from "./prompts/prompt";
import { todoListTools } from "../shared/tools/todoTools";
import { toolMonitoringMiddleware } from "../shared/middlewares/toolMonitoring";
import { think_tool } from "../shared/tools/thinkTool";
import { saveAgentTreeTool } from "./tools/saveAgentTree";
import { LLM } from "@/lib/llm/LLM";

export async function createBuilderAgent(
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
        `,
    tools: [
      ...filesystemTools,
      ...todoListTools,
      think_tool,
      saveAgentTreeTool,
    ] as const,
    middleware: [
      summarizationMiddleware({
        model: LLM.getInstance("cerebras"), // Fast summarization
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
        Follow these steps EXACTLY. You MUST call the actual tools — do NOT describe what you will do without calling them.

        <user_instructions>
        ${userInput}
        </user_instructions>

        Execution steps (call every tool, do not skip any):

        1. Call \`read_file\` to load the plan from \`working-agent-folder/plan-[projectId].json\`
        2. Call \`write_todos\` to create a task list
        3. Call \`read_todos\` to get the task IDs
        4. Call \`update_todos\` with task ID of the first task and status \`"in_progress"\` to mark it as started
        5. Build the agent tree JSON (use the node-tree format, not flat plan format) and call \`write_file\` to save it to \`working-agent-folder/agent-tree-${projectId}.json\`
        6. Call \`update_todos\` with the task IDs to mark each task \`"completed"\`
        7. Call \`save_agent_tree\` with \`working-agent-folder/agent-tree-${projectId}.json\` to persist to database
        8. Call \`write_todos\` with an empty array \`[]\` to clear the task list when all steps are done

        Important:
        - The agent tree JSON must have the agents defined in the plan with their exact tool assignments.
        - Do NOT ask clarifying questions — the plan has all the details you need.
        - Read the plan file first before doing anything else.
        - After completing each step, proceed immediately to the next — do not stop after step 2.`),
      ],
    },
      {
        streamMode: "messages",
        configurable: {
          ...config?.configurable,
          userId,
          projectId,
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
          manager_name: "agentBuilder",
          content: text,
        });
      }
    }
  }

  return fullContent;
}
