import { inngest } from "../client";
import { agentService } from "@/services/AgentService";
import { WorkflowRun } from "@/models/WorkflowRunSchema";
import { buildExecutionPlan } from "@/lib/workflow-execution/buildExecutionPlan";
import { validateExecutionPlan } from "@/lib/workflow-execution/validateExecutionPlan";
import { build } from "@/lib/workflow-tools/registry";
import { decryptById, markCredentialsUsed } from "@/lib/credentials/credentialService";
import { createLLMClient } from "@/lib/providers";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "workflow/execute.requested" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { projectId, userId, runId, input } = event.data;

    const result = await step.run("execute", async () => {
      const agentTree = await agentService
        .getInstance()
        .fetchJsonAgentTree({ projectId });

      if (!agentTree?.agentTree) {
        throw new Error("No agent tree found for this project");
      }

      const plan = buildExecutionPlan(agentTree.agentTree);
      validateExecutionPlan(plan);

      await WorkflowRun.findByIdAndUpdate(runId, {
        status: "running",
        startedAt: new Date(),
      });

      const credentialCache = new Map<string, Record<string, any>>();

      // Resolve model → LLM
      const modelCred = await decryptById({
        credentialId: plan.model!.credentialId,
        actorId: userId,
      });

      const llm = createLLMClient({
        provider: modelCred.provider,
        modelName: plan.model!.modelName,
        apiKey: modelCred.apiKey,
      });

      credentialCache.set(plan.model!.credentialId, modelCred);

      // Resolve tools
      const tools = await Promise.all(
        plan.tools.map(async (t) => {
          let credentialPayload: Record<string, any> | undefined;
          if (t.credentialId) {
            if (!credentialCache.has(t.credentialId)) {
              const payload = await decryptById({
                credentialId: t.credentialId,
                actorId: userId,
              });
              credentialCache.set(t.credentialId, payload);
            }
            credentialPayload = credentialCache.get(t.credentialId);
          }
          return build(t.nodeRegistry, t.config, { credentialPayload });
        }),
      );

      // Execute with timeout
      const agent = createReactAgent({
        llm,
        tools,
        prompt: plan.agent.instructions || "You are a helpful assistant.",
        version: "v1",
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Execution timed out after 120 seconds")), 120_000),
      );

      const result = await Promise.race([
        agent.invoke({
          messages: [new HumanMessage(input || "")],
        }),
        timeoutPromise,
      ]);

      const lastMsg = result.messages[result.messages.length - 1];
      const output =
        typeof lastMsg.content === "string"
          ? lastMsg.content
          : JSON.stringify(lastMsg.content);

      // Collect all credential IDs used
      const allCredentialIds = [
        plan.model!.credentialId,
        ...plan.tools.map((t) => t.credentialId).filter(Boolean),
      ].filter(Boolean) as string[];

      if (allCredentialIds.length > 0) {
        await markCredentialsUsed({ credentialIds: allCredentialIds });
      }

      await WorkflowRun.findByIdAndUpdate(runId, {
        status: "completed",
        output,
        agentCount: 1,
        toolCount: plan.tools.length,
        modelProvider: modelCred.provider,
        modelName: plan.model!.modelName,
        completedAt: new Date(),
      });

      return { output, agentCount: 1, toolCount: plan.tools.length };
    });

    return { runId, ...result };
  },
);
