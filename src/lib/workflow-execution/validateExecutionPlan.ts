import { getRegistration } from "@/lib/workflow-tools/registry";
import type { ExecutionPlan } from "./types";
import { MAX_AGENT_DEPTH } from "./types";

export function validateExecutionPlan(plan: ExecutionPlan): void {
  validateNode(plan, new Set(), 0);
}

function validateNode(
  plan: ExecutionPlan,
  visited: Set<string>,
  depth: number,
): void {
  if (depth > MAX_AGENT_DEPTH) {
    throw new Error(
      `Maximum agent nesting depth exceeded (${MAX_AGENT_DEPTH}). ` +
        `Agent "${plan.agent.label}" exceeds the limit.`,
    );
  }

  if (!plan.agent || !plan.agent.label) {
    throw new Error("Execution plan is missing agent label");
  }

  if (visited.has(plan.agent.id)) {
    const path = [...visited].join(" → ");
    throw new Error(
      `Circular agent dependency detected: ${path} → ${plan.agent.label}`,
    );
  }
  visited.add(plan.agent.id);

  const executableCount =
    (plan.tools.length > 0 ? 1 : 0) + (plan.subAgents.length > 0 ? 1 : 0);

  if (depth === 0) {
    if (!plan.model) {
      throw new Error(
        `Root agent "${plan.agent.label}" must have a model node. ` +
          "Add a model node and configure it with a credential.",
      );
    }
  }

  if (!plan.model) {
    if (executableCount === 0) {
      throw new Error(
        `Agent "${plan.agent.label}" has no model, tools, or subagents. ` +
          "Add a model, at least one tool, or a subagent.",
      );
    }

    if (executableCount > 1) {
      const parts: string[] = [];
      if (plan.tools.length > 0) parts.push(`${plan.tools.length} tool(s)`);
      if (plan.subAgents.length > 0)
        parts.push(`${plan.subAgents.length} subagent(s)`);

      throw new Error(
        `Agent "${plan.agent.label}" has no model but has multiple executable capabilities: ${parts.join(" and ")}. ` +
          "Add a model node to route between them, or reduce to a single capability.",
      );
    }
  }

  if (plan.model && !plan.model.credentialId) {
    throw new Error(
      `Agent "${plan.agent.label}" has a model node but it is missing a credential. ` +
        "Select a credential in the model node settings.",
    );
  }

  const seenIds = new Set<string>();
  for (const tool of plan.tools) {
    if (!tool.name) {
      throw new Error(
        `Agent "${plan.agent.label}" has a tool without a name.`,
      );
    }
    if (seenIds.has(tool.name)) {
      throw new Error(
        `Agent "${plan.agent.label}" has duplicate tool name "${tool.name}". ` +
          "Each tool must have a unique name within the same agent.",
      );
    }
    seenIds.add(tool.name);

    const reg = getRegistration(tool.nodeRegistry);
    if (reg?.credentialRequirement && !tool.credentialId) {
      throw new Error(
        `Tool "${tool.name}" (${tool.nodeRegistry}) in agent "${plan.agent.label}" ` +
          "requires a credential but none was configured.",
      );
    }
  }

  for (const sub of plan.subAgents) {
    validateNode(sub, new Set(visited), depth + 1);
  }
}
