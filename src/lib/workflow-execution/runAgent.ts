import { createAgent, modelRetryMiddleware } from "langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { build } from "@/lib/workflow-tools/registry";
import { decryptById } from "@/lib/credentials/credentialService";
import { createLLMClient } from "@/lib/providers";
import { inngest } from "@/lib/inngest/client";
import { createRetriesExhaustedMiddleware } from "./retriesExhaustedMiddleware";
import { createRetryObservabilityMiddleware } from "./retryObservabilityMiddleware";
import { createToolLifecycleMiddleware } from "./toolLifecycleMiddleware";
import { DEFAULT_MAX_RETRIES } from "./constants";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ExecutionPlan, ToolNodeDef } from "./types";

type RunAgentInput = {
  plan: ExecutionPlan;
  input: string;
  userId: string;
  credentialCache: Map<string, Record<string, any>>;
  runId: string;
  modelOverride?: BaseChatModel;
};

async function resolveToolFromDef(
  toolDef: ToolNodeDef,
  credentialCache: Map<string, Record<string, any>>,
  userId: string,
): Promise<DynamicStructuredTool> {
  let credentialPayload: Record<string, any> | undefined;
  if (toolDef.credentialId) {
    if (!credentialCache.has(toolDef.credentialId)) {
      const payload = await decryptById({
        credentialId: toolDef.credentialId,
        actorId: userId,
      });
      credentialCache.set(toolDef.credentialId, payload);
    }
    credentialPayload = credentialCache.get(toolDef.credentialId);
  }
  return build(toolDef.nodeRegistry, toolDef.config, { credentialPayload });
}

function sanitizeToolName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/^(\d)/, "agent_$1");
}

async function compileSubAgentTool(
  subPlan: ExecutionPlan,
  userId: string,
  credentialCache: Map<string, Record<string, any>>,
  runId: string,
  modelOverride?: BaseChatModel,
): Promise<DynamicStructuredTool> {
  const name = sanitizeToolName(subPlan.agent.label);

  if (subPlan.model) {
    return new DynamicStructuredTool({
      name,
      description:
        subPlan.agent.description ||
        subPlan.agent.instructions ||
        `Execute tasks using ${subPlan.agent.label}`,
      schema: z.object({
        request: z.string().describe(`Task to delegate to ${subPlan.agent.label}`),
      }),
      func: async ({ request }) =>
        runAgent({ plan: subPlan, input: request, userId, credentialCache, runId, modelOverride }),
    });
  }

  if (subPlan.tools.length === 1) {
    const tool = await resolveToolFromDef(
      subPlan.tools[0],
      credentialCache,
      userId,
    );
    return new DynamicStructuredTool({
      name,
      description: tool.description,
      schema: tool.schema as any,
      func: async (input: any) => {
        const result = await tool.invoke(input);
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    });
  }

  return new DynamicStructuredTool({
    name,
    description:
      subPlan.agent.description ||
      `Delegate to ${subPlan.subAgents[0].agent.label}`,
    schema: z.object({
      request: z.string().describe(`Task to delegate to ${subPlan.agent.label}`),
    }),
    func: async ({ request }) =>
      runAgent({
        plan: subPlan.subAgents[0],
        input: request,
        userId,
        credentialCache,
        runId,
        modelOverride,
      }),
  });
}

async function runWithModel(
  plan: ExecutionPlan,
  input: string,
  userId: string,
  credentialCache: Map<string, Record<string, any>>,
  runId: string,
  modelOverride?: BaseChatModel,
): Promise<string> {
  let llm: BaseChatModel;

  if (modelOverride) {
    llm = modelOverride;
  } else {
    const credentialId = plan.model!.credentialId;
    if (!credentialCache.has(credentialId)) {
      const payload = await decryptById({
        credentialId,
        actorId: userId,
      });
      credentialCache.set(credentialId, payload);
    }
    const modelPayload = credentialCache.get(credentialId)!;

    llm = await createLLMClient({
      provider: modelPayload.provider,
      modelName: plan.model!.modelName,
      apiKey: modelPayload.apiKey,
      baseURL: modelPayload.baseURL,
    });
  }

  const [tools, subAgentTools] = await Promise.all([
    Promise.all(
      plan.tools.map((t) => resolveToolFromDef(t, credentialCache, userId)),
    ),
    Promise.all(
      plan.subAgents.map((sub) =>
        compileSubAgentTool(sub, userId, credentialCache, runId, modelOverride),
      ),
    ),
  ]);

  const allTools = [...tools, ...subAgentTools];

  const toolIdMap = new Map<string, string>();
  plan.tools.forEach((t, i) => {
    toolIdMap.set(tools[i].name, t.id);
  });

  const agent = createAgent({
    model: llm,
    tools: allTools,
    systemPrompt: plan.agent.instructions || "You are a helpful assistant.",
    middleware: [
      createRetriesExhaustedMiddleware({
        runId,
        elementId: plan.agent.id,
        agentLabel: plan.agent.label,
      }),
      modelRetryMiddleware({
        maxRetries: DEFAULT_MAX_RETRIES,
        onFailure: "error",
      }),
      createToolLifecycleMiddleware({ runId, toolIdMap }),
      createRetryObservabilityMiddleware({
        runId,
        elementId: plan.agent.id,
        agentLabel: plan.agent.label,
      }),
    ],
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Execution timed out after 120 seconds")),
      120_000,
    ),
  );

  const result = await Promise.race([
    agent.invoke({
      messages: [new HumanMessage(input || "")],
    }),
    timeoutPromise,
  ]);

  const lastMsg = result.messages[result.messages.length - 1];
  return typeof lastMsg.content === "string"
    ? lastMsg.content
    : JSON.stringify(lastMsg.content);
}

export async function runAgent({
  plan,
  input,
  userId,
  credentialCache,
  runId,
  modelOverride,
}: RunAgentInput): Promise<string> {
  const eventBase = {
    runId,
    elementId: plan.agent.id,
    elementType: "agent" as const,
    label: plan.agent.label,
  };

  void inngest
    .send({ name: "workflow/element.started", data: eventBase })
    .catch((e: Error) =>
      console.error("Failed to send agent lifecycle event", e),
    );

  try {
    let result: string;

    if (plan.model) {
      result = await runWithModel(plan, input, userId, credentialCache, runId, modelOverride);
    } else if (plan.subAgents.length === 1) {
      result = await runAgent({
        plan: plan.subAgents[0],
        input,
        userId,
        credentialCache,
        runId,
      });
    } else {
      throw new Error(
        `Agent "${plan.agent.label}" has no model and no subAgent to delegate to. ` +
          "Single-tool model-less agents should be resolved at tool compilation time. " +
          "This indicates an unexpected execution path.",
      );
    }

    void inngest
      .send({ name: "workflow/element.completed", data: eventBase })
      .catch((e: Error) =>
        console.error("Failed to send agent lifecycle event", e),
      );

    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    void inngest
      .send({
        name: "workflow/element.failed",
        data: { ...eventBase, error: errMsg },
      })
      .catch((e: Error) =>
        console.error("Failed to send agent lifecycle event", e),
      );

    throw error;
  }
}
