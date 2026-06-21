type ToolNodeDef = {
  label: string;
  nodeRegistry: string;
  name: string;
  config: Record<string, any>;
  credentialId?: string | null;
};

export type ExecutionPlan = {
  agent: { instructions: string; label: string };
  model: { credentialId: string; modelName: string } | null;
  tools: ToolNodeDef[];
  subAgentNodes: any[];
};

export function buildExecutionPlan(agentTree: any): ExecutionPlan {
  const inputNode = agentTree.find((n: any) => n.node_name === "inputNode");
  if (!inputNode) {
    throw new Error("No inputNode found in agent tree");
  }

  const agentNode = inputNode.children.find(
    (n: any) => n.node_name === "agent",
  );
  if (!agentNode) {
    throw new Error("No agent node found under inputNode");
  }

  const agent = {
    instructions:
      agentNode?.config?.instructions || agentNode?.config?.systemPrompt || "",
    label: agentNode.config?.label || "",
  };

  const modelNode = agentNode.children.find(
    (n: any) => n.node_name === "modelNode",
  );
  const model = modelNode
    ? {
        credentialId: modelNode.config?.credentialId || null,
        modelName: modelNode.config?.config?.modelName || "",
      }
    : null;

  const toolNodes = agentNode.children.filter(
    (n: any) => n.node_name === "tool",
  );

  const tools: ToolNodeDef[] = toolNodes.map((tool: any) => ({
    label: tool.config?.label || "",
    nodeRegistry: tool.config?.nodeRegistry || "",
    name: tool.config?.name || "",
    config: tool.config?.config || {},
    credentialId: tool.config?.credentialId || null,
  }));

  const subAgentNodes = agentNode.children.filter(
    (n: any) => n.node_name === "subAgent",
  );

  return { agent, model, tools, subAgentNodes };
}
