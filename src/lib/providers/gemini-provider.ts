import type { ProviderAdapter, ModelInfo } from "./types";

type GoogleModel = {
  name: string;
  displayName: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

type GoogleModelsResponse = {
  models?: GoogleModel[];
};

export class GeminiProvider implements ProviderAdapter {
  provider = "gemini";

  async listModels(
    credentialPayload: Record<string, unknown>,
  ): Promise<ModelInfo[]> {
    const apiKey = credentialPayload.apiKey as string;
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${body}`);
    }

    const json = (await res.json()) as GoogleModelsResponse;
    const models: ModelInfo[] = [];

    for (const model of json.models ?? []) {
      const supportsGenerateContent =
        model.supportedGenerationMethods?.includes("generateContent") ?? false;
      if (!supportsGenerateContent) continue;

      const id = model.name.replace("models/", "");
      models.push({
        id,
        label: model.displayName || id,
        contextWindow: model.inputTokenLimit,
      });
    }

    models.sort((a, b) => a.label.localeCompare(b.label));
    return models;
  }
}
