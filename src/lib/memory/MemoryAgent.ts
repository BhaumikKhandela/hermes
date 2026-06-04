import path from "node:path";
import { createAgent, createMiddleware, HumanMessage } from "langchain";
import { MemoryManager } from "./MemoryManager";
import { ContextAssembler } from "./ContextAssembler";
import { buildFileSystemTools } from "./tools/memoryFSTools";
import { MEMORY_AGENT_SYSTEM_PROMPT } from "./prompts/prompts";
import type { ChatCerebras } from "@langchain/cerebras";
import type { ChatFireworks } from "@langchain/community/chat_models/fireworks";
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
  model: ChatCerebras | ChatFireworks;
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

  async function logLastAIMsg(fullAssistantText: string) {
    await memoryManager.logInteraction(
      "Assistant-1",
      fullAssistantText,
      new Date(),
    );
  }

  return {
    streamAgent,
    logLastAIMsg,
  };
}
