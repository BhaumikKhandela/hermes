import { DynamicStructuredTool } from "@langchain/core/tools";

export type ToolCategory =
  | "ai"
  | "data"
  | "communication"
  | "storage"
  | "integration"
  | "utility";

export type ToolFactory = (
  config?: Record<string, any>,
) => DynamicStructuredTool;

export type ToolRegistration = {
  nodeRegistry: string;
  factory: ToolFactory;
  category: ToolCategory;
  label: string;
  description: string;
  icon?: string;
};
