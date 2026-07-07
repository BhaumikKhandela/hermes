// KNOWN ISSUE: Memory Agent does not transfer complex build requests quickly enough.
// It responds with full architecture blueprints and asks questions before initiating __TRANSFER_TO_PLANNER__.
// Fix: Add explicit transfer triggers to MEMORY_AGENT_SYSTEM_PROMPT in prompts.ts, e.g.
// "If the user asks to build/create/implement → transfer to Assistant-2 immediately without answering."

import path from "node:path";
import { createAgent, createMiddleware, HumanMessage } from "langchain";
import { MemoryManager } from "./MemoryManager";
import { ContextAssembler } from "./ContextAssembler";
import { buildFileSystemTools } from "./tools/memoryFSTools";
import { MEMORY_AGENT_SYSTEM_PROMPT } from "./prompts/prompts";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { retrieveRelevantLTMTool } from "./tools/retrieveLTMTool";
import { toolMonitoringMiddleware } from "./middleware/toolMonitoringMiddleware";
import { transferTool } from "./tools/transferTool";

export async function createMemoryAgent({
  memoryRoot = path.resolve(process.cwd(), "public", "memory"),
  model,
  modelContextLimit = 3000,
  userId = "",
  projectId = "",
}: {
  model: BaseChatModel;
  userId?: string;
  projectId?: string;
  memoryRoot?: string;
  modelContextLimit?: number;
}) {
  const memoryManager = new MemoryManager(memoryRoot, { userId, projectId });

  await memoryManager.init();

  const contextAssembler = new ContextAssembler(
    memoryManager,
    modelContextLimit,
    { userId, projectId },
  );

  const { writeLTMTool } = buildFileSystemTools(memoryRoot, { userId });

  const agent = createAgent({
    model,
    tools: [writeLTMTool, retrieveRelevantLTMTool, transferTool],
    systemPrompt: MEMORY_AGENT_SYSTEM_PROMPT,
    middleware: [toolMonitoringMiddleware],
  });

  async function streamAgent(userInput: string) {
    await memoryManager.logInteraction("User", userInput, new Date());
    const assembled = await contextAssembler.assemble(userInput, {});

    const stream = await agent.stream(
      { messages: [{ role: "user", content: assembled.prompt }] },
      {
        streamMode: "updates",
        configurable: {
          userId,
          projectId,
        },
      },
    );

    return stream;
  }

  async function streamAgentV1(userInput: string, config: any) {
    await memoryManager.logInteraction("User", userInput, new Date());

    const assembled = await contextAssembler.assemble(userInput, {});

    const agentStream = await agent.stream(
      { messages: [{ role: "user", content: assembled.prompt }] },
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

        config.writer({
          manager_name: "memoryManager",
          content: text,
        });
      }
    }

    await memoryManager.logInteraction("Assistant-1", fullContent, new Date());

    return { fullContent, context: assembled.PlannerContext };
  }

  async function logLastAIMsg(fullAssistantText: string) {
    await memoryManager.logInteraction(
      "Assistant-1",
      fullAssistantText,
      new Date(),
    );
  }

  return {
    streamAgent,
    streamAgentV1,
    logLastAIMsg,
  };
}
