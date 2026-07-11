import { toolNodeConfig } from "@/lib/node-configs/toolNode";
import { modelNodeConfig } from "@/lib/node-configs/modelNode";
import { agentNodeConfig } from "@/lib/node-configs/agentNode";
import { subAgentNodeConfig } from "@/lib/node-configs/subAgentNode";
import { triggerNodeConfig } from "@/lib/node-configs/triggerNode";
import { getRegistration } from "./registry";
import { findMetadata } from "./metadata";
import { resolveToolIcon, resolveModelIcon } from "./iconMap";

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
  if (nodeRegistry === "trigger") {
    return triggerNodeConfig({ id, label: "Trigger", icon: "", position });
  }

  if (nodeRegistry === "agent") {
    return agentNodeConfig({ id, label: "AI Agent", icon: "", position });
  }

  if (nodeRegistry === "subAgent") {
    return subAgentNodeConfig({ id, label: "Sub Agent", icon: "", position });
  }

  const reg = getRegistration(nodeRegistry);
  const meta = reg ? null : findMetadata(nodeRegistry);

  if (!reg && !meta) {
    throw new Error(`No registration found for nodeRegistry: "${nodeRegistry}"`);
  }

  const label = reg?.label ?? meta!.label;
  const nodeReg = reg?.nodeRegistry ?? meta!.nodeRegistry;

  const MODEL_DEFAULTS: Record<string, string> = {
    "model-openai": "gpt-4o",
    "model-anthropic": "claude-3-5-sonnet",
    "model-gemini": "gemini-1.5-pro",
    "model-deepseek": "deepseek-chat",
    "model-mistral": "mistral-large",
    "model-qwen": "qwen2.5-72b",
    "model-kimi": "kimi-latest",
    "model-meta": "llama-3.1-70b",
  };

  if (nodeRegistry === "model" || nodeRegistry.startsWith("model-")) {
    const node = modelNodeConfig({ id, label, icon: resolveModelIcon(label), position });
    node.data.config = { ...node.data.config, modelName: MODEL_DEFAULTS[nodeRegistry] || "" };
    return node;
  }

  return toolNodeConfig(
    { id, label, icon: resolveToolIcon(nodeReg), position },
    { name: label, nodeRegistry: nodeReg, config: {} },
  );
}
