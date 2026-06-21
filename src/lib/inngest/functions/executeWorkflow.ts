import { inngest } from "../client";
import { decryptById, markCredentialsUsed } from "@/lib/credentials/credentialService";
import { build } from "@/lib/workflow-tools/registry";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "workflow/execute.requested" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { projectId, userId, runId } = event.data;

    await step.run("execute", async () => {
      const credentialCache = new Map<string, Record<string, any>>();

      async function resolveCredential(credentialId: string): Promise<Record<string, any>> {
        if (!credentialCache.has(credentialId)) {
          const payload = await decryptById({ credentialId, actorId: userId });
          credentialCache.set(credentialId, payload);
        }
        return credentialCache.get(credentialId)!;
      }

      // 1. Fetch agent tree from DB
      // 2. Build multi-agent system
      //   - For each tool node with credentialId:
      //     const credPayload = await resolveCredential(node.data.credentialId);
      //     const tool = build(node.data.nodeRegistry, node.data.config ?? {}, { credentialPayload: credPayload });
      // 3. Execute tasks step by step
      // 4. Emit progress via Inngest Realtime
      // 5. Persist results to DB

      // Mark credentials as used
      // await markCredentialsUsed({ credentialIds: [...credentialCache.keys()] });
    });

    return { projectId, userId, runId, status: "completed" };
  },
);
