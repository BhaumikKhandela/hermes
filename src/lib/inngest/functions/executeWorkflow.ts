import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { agentService } from "@/services/AgentService";
import { WorkflowRun } from "@/models/WorkflowRunSchema";
import { buildExecutionPlan } from "@/lib/workflow-execution/buildExecutionPlan";
import { validateExecutionPlan } from "@/lib/workflow-execution/validateExecutionPlan";
import { runAgent } from "@/lib/workflow-execution/runAgent";
import { markCredentialsUsed } from "@/lib/credentials/credentialService";
import type { ExecutionPlan } from "@/lib/workflow-execution/types";

function countAgents(plan: ExecutionPlan): number {
  let count = 1;
  for (const sub of plan.subAgents) {
    count += countAgents(sub);
  }
  return count;
}

function countTools(plan: ExecutionPlan): number {
  let count = plan.tools.length;
  for (const sub of plan.subAgents) {
    count += countTools(sub);
  }
  return count;
}

function collectCredentialIds(plan: ExecutionPlan): string[] {
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
    ids.push(...collectCredentialIds(sub));
  }
  return ids;
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

      let plan: ExecutionPlan;
      try {
        plan = buildExecutionPlan(agentTree.agentTree);
        validateExecutionPlan(plan);
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

        const output = await runAgent({
          plan,
          input: input || "",
          userId,
          credentialCache,
          runId,
        });

        const totalAgents = countAgents(plan);
        const totalTools = countTools(plan);
        const allCredentialIds = [...new Set(collectCredentialIds(plan))];

        if (allCredentialIds.length > 0) {
          await markCredentialsUsed({ credentialIds: allCredentialIds });
        }

        await WorkflowRun.findByIdAndUpdate(runId, {
          status: "completed",
          output,
          agentCount: totalAgents,
          toolCount: totalTools,
          executionVersion: 2,
          modelProvider: plan.model?.credentialId
            ? credentialCache.get(plan.model.credentialId)?.provider || ""
            : "",
          modelName: plan.model?.modelName || "",
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
