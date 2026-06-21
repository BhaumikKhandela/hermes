import Anthropic from "@anthropic-ai/sdk";
import type { ProviderAdapter, ModelInfo } from "./types";

export class AnthropicProvider implements ProviderAdapter {
  provider = "anthropic";

  async listModels(
    credentialPayload: Record<string, unknown>,
  ): Promise<ModelInfo[]> {
    const apiKey = credentialPayload.apiKey as string;
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }

    const client = new Anthropic({ apiKey });
    const page = await client.models.list();

    const models: ModelInfo[] = [];
    for await (const model of page) {
      models.push({
        id: model.id,
        label: model.display_name,
        supportsVision: model.capabilities?.image_input?.supported ?? undefined,
        supportsTools: model.capabilities?.structured_outputs?.supported ?? undefined,
        supportsReasoning: model.capabilities?.effort?.supported ?? undefined,
        contextWindow: model.max_input_tokens ?? undefined,
      });
    }

    models.sort((a, b) => a.label.localeCompare(b.label));
    return models;
  }
}
