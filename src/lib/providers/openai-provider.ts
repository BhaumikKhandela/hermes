import OpenAI from "openai";
import type { ProviderAdapter, ModelInfo } from "./types";

const LABEL_MAP: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4": "GPT-4",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "o1": "o1",
  "o1-mini": "o1 Mini",
  "o3-mini": "o3 Mini",
};

function inferLabel(id: string): string {
  if (LABEL_MAP[id]) return LABEL_MAP[id];
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export class OpenAIProvider implements ProviderAdapter {
  provider = "openai";

  async listModels(
    credentialPayload: Record<string, unknown>,
  ): Promise<ModelInfo[]> {
    const apiKey = credentialPayload.apiKey as string;
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const client = new OpenAI({ apiKey });
    const page = await client.models.list();
    const models: ModelInfo[] = [];

    for await (const model of page) {
      if (model.object !== "model") continue;
      models.push({
        id: model.id,
        label: inferLabel(model.id),
      });
    }

    models.sort((a, b) => a.label.localeCompare(b.label));
    return models;
  }
}
