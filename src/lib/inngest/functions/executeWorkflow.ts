import { inngest } from "../client";
import { agentService } from "@/services/AgentService";
import { buildMultiAgentSystem } from "@/lib/workflow-execution/buildMultiAgentSystem";
import { markCredentialsUsed } from "@/lib/credentials/credentialService";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "workflow/execute.requested" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { projectId, userId, runId } = event.data;

    const result = await step.run("execute", async () => {
      const agentTree = await agentService.getInstance().fetchJsonAgentTree({ projectId });
      if (!agentTree?.agentTree) {
        throw new Error("No agent tree found for this project");
      }

      const system = await buildMultiAgentSystem(agentTree.agentTree, userId);

      const allCredentialIds = [
        ...system.tools.map((t: any) => t.credentialId),
        ...system.subAgents.flatMap((sa) => sa.tools.map((t: any) => t.credentialId)),
      ].filter(Boolean);

      if (allCredentialIds.length > 0) {
        await markCredentialsUsed({ credentialIds: allCredentialIds });
      }

      return {
        agentCount: 1 + system.subAgents.length,
        toolCount: system.tools.length,
        subAgentToolCount: system.subAgents.reduce((sum, sa) => sum + sa.tools.length, 0),
        status: "prepared",
      };
    });

    return { projectId, userId, runId, ...result };
  },
);
