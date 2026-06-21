export type ModelInfo = {
  id: string;
  label: string;
  supportsVision?: boolean;
  supportsTools?: boolean;
  supportsReasoning?: boolean;
  contextWindow?: number;
};

export type ProviderAdapter = {
  provider: string;
  listModels(
    credentialPayload: Record<string, unknown>,
  ): Promise<ModelInfo[]>;
};
