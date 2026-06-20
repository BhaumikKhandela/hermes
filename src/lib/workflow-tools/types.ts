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

export type ToolConfigFieldType =
  | "text"
  | "password"
  | "number"
  | "url"
  | "select"
  | "boolean";

export type ToolConfigField = {
  key: string;
  label: string;
  type: ToolConfigFieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  authGroup?: string;
};

export type AuthMethod = {
  key: string;
  label: string;
  description?: string;
  fields: string[];
};

export type ToolRegistration = {
  nodeRegistry: string;
  factory: ToolFactory;
  category: ToolCategory;
  label: string;
  description: string;
  icon?: string;
  configFields?: ToolConfigField[];
  authMethods?: AuthMethod[];
};
