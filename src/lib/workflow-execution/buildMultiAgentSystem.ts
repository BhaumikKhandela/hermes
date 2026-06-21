import { DynamicStructuredTool } from "@langchain/core/tools";
import { build } from "@/lib/workflow-tools/registry";
import { decryptById } from "@/lib/credentials/credentialService";
import { extractAgentStructure } from "@/lib/workflow-parser/extractAgentStructure";

type ToolNodeDef = {
  label: string;
  nodeRegistry: string;
  name: string;
  config: Record<string, any>;
  credentialId?: string | null;
};

type AgentDef = {
  label: string;
  instructions: string;
  model: string;
  sub: string;
};

type SubAgentDef = AgentDef & { description?: string };

export type ResolvedToolSet = {
  agent: AgentDef;
  tools: DynamicStructuredTool[];
  subAgents: {
    def: SubAgentDef;
    tools: DynamicStructuredTool[];
  }[];
};

async function resolveTool(
  toolDef: ToolNodeDef,
  credentialCache: Map<string, Record<string, any>>,
  actorId: string,
): Promise<DynamicStructuredTool> {
  let credentialPayload: Record<string, any> | undefined;

  if (toolDef.credentialId) {
    if (!credentialCache.has(toolDef.credentialId)) {
      const payload = await decryptById({
        credentialId: toolDef.credentialId,
        actorId,
      });
      credentialCache.set(toolDef.credentialId, payload);
    }
    credentialPayload = credentialCache.get(toolDef.credentialId);
  }

  return build(toolDef.nodeRegistry, toolDef.config, { credentialPayload });
}

export async function buildMultiAgentSystem(
  agentTree: any,
  actorId: string,
): Promise<ResolvedToolSet> {
  const { agent, agentTools, subAgents, subAgentTools } =
    extractAgentStructure(agentTree);

  const credentialCache = new Map<string, Record<string, any>>();

  const tools = await Promise.all(
    agentTools.map((t: any) =>
      resolveTool(t as ToolNodeDef, credentialCache, actorId),
    ),
  );

  const resolvedSubAgents = await Promise.all(
    subAgents.map(async (sub: any, index: number) => {
      const subTools = await Promise.all(
        (subAgentTools[index] || []).map((t: any) =>
          resolveTool(t as ToolNodeDef, credentialCache, actorId),
        ),
      );
      return { def: sub, tools: subTools };
    }),
  );

  return {
    agent,
    tools,
    subAgents: resolvedSubAgents,
  };
}
