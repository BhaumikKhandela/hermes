export function extractAgentStructure(agentTree: any) {
  // Find root input
  const inputNode = agentTree.find((n) => n.node_name === "inputNode");
  if (!inputNode) {
    throw new Error("No inputNode found");
  }

  // Find the first agent child
  const agentNode = inputNode.children.find((n) => n.node_name === "agent");
  if (!agentNode) {
    throw new Error("No agent found under inputNode");
  }

  // Extract agent config
  const agent = {
    instructions:
      agentNode?.config?.instructions || agentNode?.config?.systemPrompt,
    model: agentNode.config.model || "",
    label: agentNode.config.label || "",
    sub: agentNode.config.sub || "",
  };

  const agentTools = agentNode.children
    .filter((n) => n.node_name === "tool" || n.node_name === "modelNode")
    .map((tool) => {
      const base = {
        label: tool.config.label,
        nodeRegistry: tool.config.nodeRegistry,
        name: tool.config.name,
        config: tool.config.config,
      };

      return {
        ...base,
        ...(tool.node_name === "modelNode"
          ? { model: tool?.config?.model }
          : {}),
      };
    });

  // extract SubAgents (children with node_name=subAgent)
  const subAgents: any[] = [];
  const subAgentTools: Record<string, any> = {};

  agentNode.children
    .filter((n) => n.node_name === "subAgent")
    .forEach((sub, index) => {
      // store subAgent
      subAgents.push({
        label: sub.config.label || "",
        instructions: sub.config.instructions || "",
        model: sub.config.model || "",
        sub: sub.config.sub || "",
        description: sub?.config?.description,
      });

      subAgentTools[index] = sub.children
        .filter((c) => c.node_name === "tool" || c.node_name === "modelNode")
        .map((tool) => {
          const base = {
            label: tool.config.label,
            nodeRegistry: tool.config.nodeRegistry,
            name: tool.config.name,
            config: tool.config.config,
          };

          return {
            ...base,
            ...(tool.node_name === "modelNode"
              ? { model: tool?.config?.model }
              : {}),
          };
        });
    });

  return {
    agent,
    agentTools,
    subAgents,
    subAgentTools,
  };
}
