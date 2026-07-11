import { agentNodeConfig } from "@/lib/node-configs/agentNode";
import { embeddingModelNodeConfig } from "@/lib/node-configs/embeddingModelNode";
import { inputNodeConfig } from "@/lib/node-configs/inputNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
import { subAgentNodeConfig } from "@/lib/node-configs/subAgentNode";
import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { triggerNodeConfig } from "@/lib/node-configs/triggerNode";
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
    trigger: triggerNodeConfig,
  };

  const newNodes: any[] = [];

  let idCount = startId;

  const traverse = (node: any, parentName: string | null = null, parentLabel: string | null = null) => {
    const nodeType = node.node_name || node.nodeName;

    let normalizedType = "";

    if (nodeType === "inputNode") normalizedType = "input";
    else if (nodeType === "triggerNode") normalizedType = "trigger";
    else if (nodeType === "agent") normalizedType = "agent";
    else if (nodeType === "tool") normalizedType = "tool";
    else if (nodeType === "modelNode") normalizedType = "model";
    else if (nodeType === "subAgent") normalizedType = "subAgent";

    const builder = nodeBuilderFunc[normalizedType];

    if (builder) {
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
            parentLabel: parentLabel || undefined,
          },
        );
        if (parentLabel) {
          newNode.data.parentLabel = parentLabel;
        }
      } else {
        const resolvedIcon = node.config?.icon
          || (normalizedType === "model"
            ? resolveModelIcon(node.config?.label || node.config?.name || "")
            : "");
        const nodeData = { ...(node.config || {}) };
        if (parentLabel) {
          nodeData.parentLabel = parentLabel;
        }
        newNode = builder({
          id,
          label: node.config?.label,
          icon: resolvedIcon,
          position: node.config?.position,
          data: nodeData,
          referenceTo: parentName ? [parentName] : [],
        });
        Object.assign(newNode.data, nodeData);
      }

      newNode.referenceTo = parentName ? [parentName] : [];

      newNodes.push(newNode);
    }

    if (node.children && Array.isArray(node.children)) {
      const currentLabel = node.config?.label || node.config?.name || "";
      node.children.forEach((child: any) => traverse(child, nodeType, currentLabel));
    }
  };

  if (!nodesInput) return { nodes: [], nextId: idCount };
  nodesInput.forEach((rootNode: any) => traverse(rootNode));

  return {
    nodes: newNodes,
    nextId: idCount,
  };
};
