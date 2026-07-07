import { agentNodeConfig } from "@/lib/node-configs/agentNode";
import { embeddingModelNodeConfig } from "@/lib/node-configs/embeddingModelNode";
import { inputNodeConfig } from "@/lib/node-configs/inputNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
import { subAgentNodeConfig } from "@/lib/node-configs/subAgentNode";
import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { vectordbNodeConfig } from "@/lib/node-configs/vectorDbNode";
import { resolveToolIcon, resolveModelIcon } from "@/lib/workflow-tools/iconMap";

export const buildNodesHelper = (nodesInput: any[], startId: number) => {
  const nodeBuilderFunc: any = {
    input: inputNodeConfig,
    agent: agentNodeConfig,
    tool: toolNodeConfig,
    embedding: embeddingModelNodeConfig,
    vectordb: vectordbNodeConfig,
    subAgent: subAgentNodeConfig,
    model: modelNodeConfig,
  };

  const newNodes: any[] = [];
  const nodeTracker = new Map<string, any>();

  let idCount = startId;

  const traverse = (node: any, parentName: string | null = null) => {
    const nodeType = node.node_name || node.nodeName;

    let normalizedType = "";

    if (nodeType === "inputNode") normalizedType = "input";
    else if (nodeType === "agent") normalizedType = "agent";
    else if (nodeType === "tool") normalizedType = "tool";
    else if (nodeType === "modelNode") normalizedType = "model";
    else if (nodeType === "subAgent") normalizedType = "subAgent";

    const builder = nodeBuilderFunc[normalizedType];

    if (builder) {
      const uniqueKey = `${normalizedType}-${node.config?.label || node.config?.name || ""}-${node.config?.icon || ""}`;

      let existingNode = nodeTracker.get(uniqueKey);

      if (existingNode) {
        if (parentName && !existingNode.referenceTo.includes(parentName)) {
          existingNode.referenceTo.push(parentName);
        }
      } else {
        const id = `n${idCount++}`;

        let newNode;

        if (normalizedType === "tool") {
          const toolIcon = node.config?.icon
            || resolveToolIcon(node.config?.nodeRegistry || node.config?.name || "");
          newNode = builder(
            {
              id,
              label: node.config?.label,
              icon: toolIcon,
              position: node.config?.position,
              referenceTo: parentName ? [parentName] : [],
            },
            {
              name: node.config?.name,
              nodeRegistry: node.config?.nodeRegistry,
              config: node.config?.config || {},
            },
          );
        } else {
          const resolvedIcon = node.config?.icon
            || (normalizedType === "model"
              ? resolveModelIcon(node.config?.label || node.config?.name || "")
              : "");
          newNode = builder({
            id,
            label: node.config?.label,
            icon: resolvedIcon,
            position: node.config?.position,
            data: node.config || {},
            referenceTo: parentName ? [parentName] : [],
          });
        }

        newNode.referenceTo = parentName ? [parentName] : [];

        newNodes.push(newNode);
        nodeTracker.set(uniqueKey, newNode);
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => traverse(child, nodeType));
    }
  };

  if (!nodesInput) return { nodes: [], nextId: idCount };
  nodesInput.forEach((rootNode: any) => traverse(rootNode));

  return {
    nodes: newNodes,
    nextId: idCount,
  };
};
