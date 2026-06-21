import { DynamicStructuredTool } from "@langchain/core/tools";
import { ToolRegistration, ToolFactory } from "./types";

const registry = new Map<string, ToolRegistration>();

export function register(reg: ToolRegistration): void {
  registry.set(reg.nodeRegistry, reg);
}

export function build(
  nodeRegistry: string,
  config?: Record<string, any>,
  options?: { credentialPayload?: Record<string, any> },
): DynamicStructuredTool {
  const reg = registry.get(nodeRegistry);
  if (!reg) {
    throw new Error(`No tool registered for nodeRegistry: "${nodeRegistry}"`);
  }
  const mergedConfig = options?.credentialPayload
    ? { ...config, ...options.credentialPayload }
    : config;
  return reg.factory(mergedConfig);
}

export function list(): ToolRegistration[] {
  return Array.from(registry.values());
}

export function getRegistration(
  nodeRegistry: string,
): ToolRegistration | undefined {
  return registry.get(nodeRegistry);
}
