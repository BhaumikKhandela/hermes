import { graph } from "@/lib/agent-builder/graph";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memory/MemoryAgent";
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

  return NextResponse.json({ agentTree: data?.agentTree });
});
