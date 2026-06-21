import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
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
