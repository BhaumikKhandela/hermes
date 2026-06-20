import { DynamicStructuredTool } from "@langchain/core/tools";
import { ToolRegistration, ToolFactory } from "./types";

const registry = new Map<string, ToolRegistration>();

export function register(reg: ToolRegistration): void {
  registry.set(reg.nodeRegistry, reg);
}

export function build(
  nodeRegistry: string,
  config?: Record<string, any>,
): DynamicStructuredTool {
  const reg = registry.get(nodeRegistry);
  if (!reg) {
    throw new Error(`No tool registered for nodeRegistry: "${nodeRegistry}"`);
  }
  return reg.factory(config);
}

export function list(): ToolRegistration[] {
  return Array.from(registry.values());
}

export function getRegistration(
  nodeRegistry: string,
): ToolRegistration | undefined {
  return registry.get(nodeRegistry);
}
