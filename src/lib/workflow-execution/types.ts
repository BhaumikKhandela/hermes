export type ToolNodeDef = {
  id: string;
  label: string;
  nodeRegistry: string;
  name: string;
  config: Record<string, any>;
  credentialId?: string | null;
};

export type ExecutionPlan = {
  agent: {
    id: string;
    label: string;
    instructions: string;
    description?: string;
  };
  model: {
    credentialId: string;
    modelName: string;
  } | null;
  tools: ToolNodeDef[];
  subAgents: ExecutionPlan[];
};

export const MAX_AGENT_DEPTH = 10;
