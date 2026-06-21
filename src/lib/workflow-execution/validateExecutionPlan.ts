import { getRegistration } from "@/lib/workflow-tools/registry";
import type { ExecutionPlan } from "./buildExecutionPlan";

export function validateExecutionPlan(plan: ExecutionPlan): void {
  if (!plan.agent) {
    throw new Error("Execution plan is missing agent configuration");
  }

  if (!plan.model) {
    throw new Error(
      "Agent has no model node. Add a model node and configure it with a credential.",
    );
  }

  if (!plan.model.credentialId) {
    throw new Error(
      "Model node is missing a credential. Select a credential in the model node settings.",
    );
  }

  const seenIds = new Set<string>();
  for (const tool of plan.tools) {
    if (seenIds.has(tool.name)) {
      throw new Error(
        `Duplicate tool name "${tool.name}". Each tool must have a unique name.`,
      );
    }
    seenIds.add(tool.name);

    const reg = getRegistration(tool.nodeRegistry);
    if (reg?.credentialRequirement && !tool.credentialId) {
      throw new Error(
        `Tool "${tool.name}" (${tool.nodeRegistry}) requires a credential but none was configured.`,
      );
    }
  }
}
