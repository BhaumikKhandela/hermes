import type { ExecutionPlan, ToolNodeDef } from "./types";

let agentIdCounter = 0;
let toolIdCounter = 0;

export function buildExecutionPlan(agentTree: any): ExecutionPlan[] {
  agentIdCounter = 0;
  toolIdCounter = 0;

  const inputNode = agentTree.find((n: any) => n.node_name === "inputNode");
  if (!inputNode) {
    throw new Error("No inputNode found in agent tree");
  }

  const agentNodes = inputNode.children.filter(
    (n: any) => n.node_name === "agent",
  );
  if (agentNodes.length === 0) {
    throw new Error("No agent nodes found under inputNode");
  }

  return agentNodes.map((node: any) =>
    parseAgentNode(node, node.children || []),
  );
}

function parseAgentNode(node: any, children: any[]): ExecutionPlan {
  const agent = {
    id: `agent_${++agentIdCounter}`,
    label: node.config?.label || "",
    instructions: node.config?.instructions || node.config?.systemPrompt || "",
    description: node.config?.description,
  };

  const modelNode = children.find(
    (n: any) => n.node_name === "modelNode",
  );
  const model = modelNode
    ? {
        credentialId: modelNode.config?.credentialId || null,
        modelName: modelNode.config?.config?.modelName || "",
      }
    : null;

  const tools: ToolNodeDef[] = children
    .filter((n: any) => n.node_name === "tool")
    .map((tool: any) => ({
      id: `tool_${++toolIdCounter}`,
      label: tool.config?.label || "",
      nodeRegistry: tool.config?.nodeRegistry || "",
      name: tool.config?.name || "",
      config: tool.config?.config || {},
      credentialId: tool.config?.credentialId || null,
    }));

  const subAgents: ExecutionPlan[] = children
    .filter((n: any) => n.node_name === "subAgent")
    .map((sub: any) => parseAgentNode(sub, sub.children || []));

  return { agent, model, tools, subAgents };
}
