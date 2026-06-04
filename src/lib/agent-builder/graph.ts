import {
  END,
  START,
  StateGraph,
  Annotation,
  MessagesAnnotation,
  Command,
} from "@langchain/langgraph";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { LLM } from "../llm/LLM";

import path from "node:path";
import { createMemoryAgent } from "../memory/MemoryAgent";
import { MemoryManager } from "../memory/MemoryManager";
import { theAgentBuilder } from "./agentBuilder";

const llm = LLM.getInstance("cerebras");

function removeThinkTag(input: string) {
  if (!input) return "";

  return input
    .replace(/<\/?think>/gi, "") // remove <think> tags
    .replace(/__TRANSFER__/gi, "") // remove __TRANSFER__
    .replace(/^\s*\+\s*/, "") // remove leading "+"
    .trim();
}

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  projectId: Annotation(),
  userId: Annotation(),
  agentBuilderContext: Annotation(),
});

const memoryAgent = async (state: any, config: any) => {
  const { userId, projectId } = state;

  const last = state.messages
    .filter((m: any) => m._getType() === "human")
    .slice(-1)[0];

  const { logLastAIMsg, streamAgentV1 } = await createMemoryAgent({
    model: llm,
    userId,
    projectId,
  });

  const { fullContent, context: agentBuilderContext } = await streamAgentV1(
    last?.content,
    config,
  );

  const shouldHandoff = fullContent.includes("__TRANSFER__");

  if (shouldHandoff) {
    return new Command({
      update: {
        messages: [new AIMessage(fullContent)],
        agentBuilderContext: agentBuilderContext,
      },
      goto: "agentBuilder",
    });
  }

  return new Command({
    update: { messages: [new AIMessage(fullContent)] },
    goto: END,
  });
};

const agentBuilder = async (state: any, config: any) => {
  console.log(
    "==================================agentBuilder======================",
  );
  const { userId, projectId } = state;
  const memoryRoot = path.resolve(process.cwd(), "public", "memory");
  const memoryManager = new MemoryManager(memoryRoot, { userId, projectId });

  const last = state.messages
    .filter((m: any) => m._getType() === "ai")
    .slice(-1)[0];

  const cleanMessage = removeThinkTag(last?.content);

  const agentBuilderMessage = `
  Message from Assistant-1 on behalf of the user : ${cleanMessage}\n\n
  ${state.agentBuilderContext}`;

  const aiMessage = await theAgentBuilder(`${agentBuilderMessage}`, config);

  await memoryManager.logInteraction("Assistant-2", aiMessage, new Date());

  console.log(
    "==================================end node B======================",
  );

  return new Command({
    update: { messages: [new AIMessage(aiMessage)] },
    goto: END,
  });
};

const workflow = new StateGraph(StateAnnotation)
  .addNode("memoryAgent", memoryAgent)
  .addNode("agentBuilder", agentBuilder)

  .addEdge(START, "memoryAgent")
  .addEdge("memoryAgent", END)
  .addEdge("agentBuilder", END);

export const graph = workflow.compile();
