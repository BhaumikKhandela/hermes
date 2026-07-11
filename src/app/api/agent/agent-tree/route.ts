import { graph } from "@/lib/agents/graph";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/agents/memory/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { Agent } from "@/models/AgentSchema";
import { agentService } from "@/services/AgentService";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);

  const projectId = searchParams.get("projectId") as string;

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId and userId are required" },
      { status: 400 },
    );
  }

  const agent = agentService.getInstance();
  const data = await agent.fetchJsonAgentTree({ projectId });

  return NextResponse.json({
    agentTree: data?.agentTree,
    nodes: data?.agent_nodes,
    edges: data?.agent_edges,
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, userId, agentTree, agent_nodes, agent_edges } =
    await req.json();

  const agent = agentService.getInstance();

  await agent.updateOrCreateAgent({
    projectId,
    userId,
    agentTree,
    agent_nodes,
    agent_edges,
  });

  return NextResponse.json({ message: "Data saved" });
});
