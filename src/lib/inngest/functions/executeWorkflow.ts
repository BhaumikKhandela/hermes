import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { agentService } from "@/services/AgentService";
import { WorkflowRun } from "@/models/WorkflowRunSchema";
import { buildExecutionPlan } from "@/lib/workflow-execution/buildExecutionPlan";
import { validateExecutionPlan } from "@/lib/workflow-execution/validateExecutionPlan";
import { runAgent } from "@/lib/workflow-execution/runAgent";
import { markCredentialsUsed } from "@/lib/credentials/credentialService";
import type { ExecutionPlan } from "@/lib/workflow-execution/types";

function countAgentsInPlan(plan: ExecutionPlan): number {
  let count = 1;
  for (const sub of plan.subAgents) {
    count += countAgentsInPlan(sub);
  }
  return count;
}

function countAgents(pipeline: ExecutionPlan[]): number {
  return pipeline.reduce((sum, plan) => sum + countAgentsInPlan(plan), 0);
}

function countToolsInPlan(plan: ExecutionPlan): number {
  let count = plan.tools.length;
  for (const sub of plan.subAgents) {
    count += countToolsInPlan(sub);
  }
  return count;
}

function countTools(pipeline: ExecutionPlan[]): number {
  return pipeline.reduce((sum, plan) => sum + countToolsInPlan(plan), 0);
}

function collectCredentialIdsInPlan(plan: ExecutionPlan): string[] {
  const ids: string[] = [];
  if (plan.model?.credentialId) {
    ids.push(plan.model.credentialId);
  }
  for (const tool of plan.tools) {
    if (tool.credentialId) {
      ids.push(tool.credentialId);
    }
  }
  for (const sub of plan.subAgents) {
    ids.push(...collectCredentialIdsInPlan(sub));
  }
  return ids;
}

function collectCredentialIds(pipeline: ExecutionPlan[]): string[] {
  return pipeline.flatMap((plan) => collectCredentialIdsInPlan(plan));
}

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
        throw new NonRetriableError("No agent tree found for this project");
      }

      let pipeline: ExecutionPlan[];
      try {
        pipeline = buildExecutionPlan(agentTree.agentTree);
        for (const step of pipeline) {
          validateExecutionPlan(step);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Workflow validation failed";
        await WorkflowRun.findByIdAndUpdate(runId, {
          status: "failed",
          error: message,
          completedAt: new Date(),
        });
        throw new NonRetriableError(message, { cause: err });
      }

      try {
        await WorkflowRun.findByIdAndUpdate(runId, {
          status: "running",
          startedAt: new Date(),
          executionVersion: 2,
        });

        const credentialCache = new Map<string, Record<string, any>>();

        let output = input || "";
        for (const step of pipeline) {
          output = await runAgent({
            plan: step,
            input: output,
            userId,
            credentialCache,
            runId,
          });
        }

        const totalAgents = countAgents(pipeline);
        const totalTools = countTools(pipeline);
        const allCredentialIds = [...new Set(collectCredentialIds(pipeline))];

        if (allCredentialIds.length > 0) {
          await markCredentialsUsed({ credentialIds: allCredentialIds });
        }

        const modelProviders = pipeline.map((s) =>
          s.model?.credentialId
            ? credentialCache.get(s.model.credentialId)?.provider || ""
            : "",
        );
        const modelNames = pipeline.map((s) => s.model?.modelName || "");

        await WorkflowRun.findByIdAndUpdate(runId, {
          status: "completed",
          output,
          agentCount: totalAgents,
          toolCount: totalTools,
          executionVersion: 2,
          modelProvider: modelProviders,
          modelName: modelNames,
          completedAt: new Date(),
        });

        return { output, agentCount: totalAgents, toolCount: totalTools };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Execution failed";
        await WorkflowRun.findByIdAndUpdate(runId, {
          status: "failed",
          error: message,
          completedAt: new Date(),
        });
        throw err;
      }
    });

    return { runId, ...result };
  },
);
