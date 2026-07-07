import {
  END,
  START,
  StateGraph,
  Annotation,
  MessagesAnnotation,
  Command,
  MemorySaver,

} from "@langchain/langgraph";
import {
  AIMessage,
} from "@langchain/core/messages";
import { LLM } from "../llm/LLM";

import * as path from "node:path";
import { promises as fs } from "node:fs";
import { createMemoryAgent } from "./memory/MemoryAgent";
import { MemoryManager } from "./memory/MemoryManager";
import { createBuilderAgent } from "./agent-builder/agent";
import { createPlannerAgent } from "./planner/agent";

const llm = LLM.getInstance("cerebras");

function removeThinkTag(input: string) {
  if (!input) return "";

  return input
    .replace(/<\/?think>/gi, "")
    .replace(/__TRANSFER_TO_PLANNER__/gi, "")
    .replace(/__TRANSFER_TO_BUILDER__/gi, "")
    .replace(/__PLAN_READY__/gi, "")
    .replace(/^\s*\+\s*/, "")
    .trim();
}

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  projectId: Annotation<string>(),
  userId: Annotation<string>(),
  plannerContext: Annotation<string>(),
  plan: Annotation<string>(),
  planFilename: Annotation<string>(),
  approved: Annotation<boolean>(),
});

const memoryNode = async (state: typeof StateAnnotation.State, config: any) => {
  console.log("==================================memoryNode======================");
  const { userId, projectId } = state;

  const last = state.messages
    .filter((m: any) => m._getType() === "human")
    .slice(-1)[0];

  const { logLastAIMsg, streamAgentV1 } = await createMemoryAgent({
    model: llm,
    userId,
    projectId,
  });

  const { fullContent, context: plannerContext } = await streamAgentV1(
    typeof last?.content === "string" ? last.content : "",
    config,
  );

  const shouldHandoff = fullContent.includes("__TRANSFER_TO_PLANNER__");

  if (shouldHandoff) {
    return new Command({
      update: {
        messages: [new AIMessage(fullContent)],
        plannerContext: plannerContext,
      },
      goto: "planner",
    });
  }

  return new Command({
    update: { messages: [new AIMessage(fullContent)] },
    goto: END,
  });
};

const plannerNode = async (state: typeof StateAnnotation.State, config: any) => {
  console.log("==================================plannerNode======================");
  const { userId, projectId, plannerContext, approved: stateApproved } = state;

  console.log("[plannerNode] state.approved:", stateApproved);
  console.log("[plannerNode] state.plannerContext length:", plannerContext?.length || 0);
  console.log("[plannerNode] total messages in state:", state.messages?.length);

  if (stateApproved === true) {
    console.log("[plannerNode] Plan approved — skipping re-run, going to builder");
    
    const planFilename = `plan-${projectId}.json`;
    let planSummary = "";
    try {
      const planPath = path.resolve(
        process.cwd(), "public", "agent-builder", "working-agent-folder", planFilename
      );
      const planFile = await import("fs").then(m => m.promises.readFile(planPath, "utf-8"));
      const planData = JSON.parse(planFile);
      planSummary = planData.summary || "See the plan file for details.";
    } catch {
      console.log("[plannerNode] No plan file found to extract summary");
    }
    return new Command({
      update: {
        messages: [new AIMessage("Plan approved. Transferring to builder...")],
        plan: planSummary,
        planFilename,
        approved: true,
      },
      goto: "builder",
    });
  }

  // Find the last AI message
  const lastAiMsgIndex = state.messages.map((m: any) => m._getType()).lastIndexOf("ai");
  const lastAiMsg = lastAiMsgIndex >= 0 ? state.messages[lastAiMsgIndex] : null;

  // Any human messages after the last AI message are feedback/answers
  const subsequentHumanMsgs = state.messages
    .slice(lastAiMsgIndex + 1)
    .filter((m: any) => m._getType() === "human")
    .map((m: any) => typeof m.content === "string" ? m.content : "")
    .join("\n\n");

  const cleanAiMessage = removeThinkTag(
    typeof lastAiMsg?.content === "string" ? lastAiMsg.content : "",
  );
  console.log("[plannerNode] cleanAiMessage (first 200):", cleanAiMessage.substring(0, 200));

  const plannerInput = `
Message from Assistant-1 on behalf of the user: ${cleanAiMessage}

${subsequentHumanMsgs ? `Follow-up user input / answers:\n${subsequentHumanMsgs}\n` : ""}
${plannerContext ? `Context: ${plannerContext}` : ""}
`;

  console.log("[plannerNode] plannerInput (first 300):", plannerInput.substring(0, 300));

  const { streamPlanner } = await createPlannerAgent({ userId, projectId });
  console.log("[plannerNode] Starting streamPlanner...");
  const fullContent = await streamPlanner(plannerInput, config);
  console.log("[plannerNode] streamPlanner completed. Output length:", fullContent?.length);
  console.log("[plannerNode] fullContent (first 300):", fullContent?.substring(0, 300));

  const planApproved = false;

  const shouldTransfer = fullContent.includes("__TRANSFER_TO_BUILDER__");
  console.log("[plannerNode] shouldTransfer:", shouldTransfer);

  if (shouldTransfer) {
    console.log("[plannerNode] TRANSFER PATH — going to builder");
    let planSummary = "";
    const planFilename = `plan-${projectId}.json`;
    try {
      const planPath = path.resolve(
        process.cwd(), "public", "agent-builder", "working-agent-folder", planFilename
      );
      const planFile = await fs.readFile(planPath, "utf-8");
      const planData = JSON.parse(planFile);
      planSummary = planData.summary || "See the plan file for details.";
    } catch {
      console.log("[plannerNode] No plan file found to extract summary");
    }

    return new Command({
      update: {
        messages: [new AIMessage(fullContent)],
        plan: planSummary,
        planFilename,
        approved: planApproved,
      },
      goto: "builder",
    });
  }

  console.log("[plannerNode] END PATH: going to END (no transfer signal)");
  return new Command({
    update: {
      messages: [new AIMessage(fullContent)],
      approved: planApproved,
    },
    goto: END,
  });
};

const builderNode = async (state: typeof StateAnnotation.State, config: any) => {
  console.log(
    "==================================builderNode======================",
  );
  const { userId, projectId, plan, planFilename } = state;
  const memoryRoot = path.resolve(process.cwd(), "public", "memory");
  const memoryManager = new MemoryManager(memoryRoot, { userId, projectId });

  const planContext = planFilename
    ? `Your job is to execute the approved plan. Follow these steps:

step 1. Read the plan file from \`working-agent-folder/${planFilename}\` using the \`read_file\` tool.
The plan contains the agent definitions with their tool assignments, models, and instructions.

step 2. Create a todo list using \`write_todos\` that breaks down the work needed to build the agent tree.

step 3. Work through your todos — for each task, update its status as you go.

step 4. Write the agent tree JSON to working-agent-folder/ (use the plan's agents array to build the structure).

step 5. Call \`save_agent_tree\` with the filename to persist to database.

Plan summary: ${plan || "See the plan file for full details."}`
    : "No plan file available. Please create a plan first.";

  const aiMessage = await createBuilderAgent(
    planContext,
    config,
    { userId, projectId },
  );

  await memoryManager.logInteraction("Assistant-2", aiMessage, new Date());

  console.log(
    "==================================end builderNode======================",
  );

  return new Command({
    update: { messages: [new AIMessage(aiMessage)] },
    goto: END,
  });
};

const workflow = new StateGraph(StateAnnotation)
  .addNode("memory", memoryNode, { ends: [END, "planner"] })
  .addNode("planner", plannerNode, { ends: [END, "builder"] })
  .addNode("builder", builderNode)

  .addEdge(START, "memory")
  .addEdge("builder", END);

export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});
