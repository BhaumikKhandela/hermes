import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
import { agentNodeConfig } from "@/lib/node-configs/agentNode";
import { subAgentNodeConfig } from "@/lib/node-configs/subAgentNode";
import { getRegistration } from "./registry";

type CreateNodeInput = {
  nodeRegistry: string;
  id: string;
  position: { x: number; y: number };
};

export function createNodeFromRegistry({
  nodeRegistry,
  id,
  position,
}: CreateNodeInput) {
  if (nodeRegistry === "agent") {
    return agentNodeConfig({ id, label: "AI Agent", icon: "", position });
  }

  if (nodeRegistry === "subAgent") {
    return subAgentNodeConfig({ id, label: "Sub Agent", icon: "", position });
  }

  const reg = getRegistration(nodeRegistry);
  if (!reg) {
    throw new Error(`No registration found for nodeRegistry: "${nodeRegistry}"`);
  }

  if (nodeRegistry === "model") {
    const node = modelNodeConfig({ id, label: reg.label, icon: "", position });
    node.data.nodeRegistry = "model";
    return node;
  }

  return toolNodeConfig(
    { id, label: reg.label, icon: reg.icon || "", position },
    { name: reg.label, nodeRegistry: reg.nodeRegistry, config: {} },
  );
}
