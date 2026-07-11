type StoredModelDoc = {
  openRouterId: string;
  name: string;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsReasoning: boolean;
  contextLength: number;
  [key: string]: any;
};

import { connectDB } from "@/lib/mongodb/mongodb";
import { StoredModel } from "@/models/ModelSchema";
import type { ModelInfo } from "@/lib/providers/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models";

function parseProvider(modelId: string): string {
  const slug = modelId.startsWith("~") ? modelId.slice(1) : modelId;
  return slug.split("/")[0] || "unknown";
}

function normalizeProvider(raw: string): string {
  const map: Record<string, string> = {
    openai: "openai",
    anthropic: "anthropic",
    "~anthropic": "anthropic",
    google: "gemini",
    "~google": "gemini",
    deepseek: "deepseek",
    mistralai: "mistral",
    "meta-llama": "meta",
    qwen: "qwen",
    moonshotai: "kimi",
    "~moonshotai": "kimi",
    cohere: "cohere",
    ai21: "ai21",
    amazon: "amazon",
    "x-ai": "xai",
    "~x-ai": "xai",
    perplexity: "perplexity",
    nvidia: "nvidia",
    microsoft: "microsoft",
    bytedance: "bytedance",
    "bytedance-seed": "bytedance",
    baidu: "baidu",
    tencent: "tencent",
    inflection: "inflection",
    minimax: "minimax",
    upstage: "upstage",
  };
  return map[raw] || raw;
}

export async function syncModelsFromOpenRouter(): Promise<number> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const res = await fetch(OPENROUTER_API_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API returned ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const models: any[] = body.data || [];

  await connectDB();

  let synced = 0;
  for (const m of models) {
    const provider = normalizeProvider(parseProvider(m.id));
    const inputModalities = m.architecture?.input_modalities || [];
    const supportedParams = m.supported_parameters || [];

    await StoredModel.findOneAndUpdate(
      { openRouterId: m.id },
      {
        openRouterId: m.id,
        name: m.name || m.id,
        provider,
        description: m.description || "",
        contextLength: m.context_length || 0,
        pricing: {
          prompt: parseFloat(m.pricing?.prompt || "0"),
          completion: parseFloat(m.pricing?.completion || "0"),
          inputCacheRead: parseFloat(m.pricing?.input_cache_read || "0"),
          webSearch: parseFloat(m.pricing?.web_search || "0"),
        },
        supportsVision: inputModalities.includes("image"),
        supportsTools: supportedParams.includes("tools"),
        supportsReasoning: supportedParams.includes("reasoning"),
        supportedParameters: supportedParams,
        moderation: m.top_provider?.is_moderated ?? false,
        maxCompletionTokens: m.top_provider?.max_completion_tokens ?? null,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      { upsert: true },
    );
    synced++;
  }

  const activeIds = models.map((m: any) => m.id);
  await StoredModel.updateMany(
    { openRouterId: { $nin: activeIds }, isActive: true },
    { isActive: false },
  );

  return synced;
}

type EmbeddingSeedModel = {
  id: string;
  provider: string;
  contextLength: number;
};

const EMBEDDING_MODELS: EmbeddingSeedModel[] = [
  // OpenAI
  { id: "text-embedding-3-large", provider: "openai", contextLength: 8191 },
  { id: "text-embedding-3-small", provider: "openai", contextLength: 8191 },
  { id: "text-embedding-ada-002", provider: "openai", contextLength: 8191 },
  // Google Gemini
  { id: "gemini-embedding-001", provider: "gemini", contextLength: 2048 },
  // Cohere
  { id: "embed-v4.0", provider: "cohere", contextLength: 512 },
  { id: "embed-english-v3.0", provider: "cohere", contextLength: 512 },
  { id: "embed-english-light-v3.0", provider: "cohere", contextLength: 512 },
  { id: "embed-multilingual-v3.0", provider: "cohere", contextLength: 512 },
  { id: "embed-multilingual-light-v3.0", provider: "cohere", contextLength: 512 },
  // Voyage AI
  { id: "voyage-4-large", provider: "voyage", contextLength: 32000 },
  { id: "voyage-4", provider: "voyage", contextLength: 32000 },
  { id: "voyage-4-lite", provider: "voyage", contextLength: 16000 },
  { id: "voyage-code-3", provider: "voyage", contextLength: 32000 },
  { id: "voyage-finance-2", provider: "voyage", contextLength: 32000 },
  { id: "voyage-law-2", provider: "voyage", contextLength: 32000 },
  { id: "voyage-code-2", provider: "voyage", contextLength: 16000 },
  // Mistral AI
  { id: "mistral-embed-2312", provider: "mistral", contextLength: 8191 },
  { id: "codestral-embed-2505", provider: "mistral", contextLength: 8191 },
  // Jina AI
  { id: "jina-embeddings-v4", provider: "jina", contextLength: 8192 },
  { id: "jina-embeddings-v3", provider: "jina", contextLength: 8192 },
];

export async function syncEmbeddingModels(): Promise<number> {
  await connectDB();

  let synced = 0;
  for (const m of EMBEDDING_MODELS) {
    const openRouterId = `embedding/${m.provider}/${m.id}`;
    await StoredModel.findOneAndUpdate(
      { openRouterId },
      {
        openRouterId,
        name: m.id,
        provider: m.provider,
        description: `${m.provider} embedding model`,
        contextLength: m.contextLength,
        modelType: "embedding",
        isActive: true,
        lastSyncedAt: new Date(),
      },
      { upsert: true },
    );
    synced++;
  }

  return synced;
}

function isAliasModel(d: StoredModelDoc): boolean {
  const slug = d.openRouterId.split("/").pop() || d.name;
  return d.openRouterId.startsWith("~") || slug.toLowerCase().includes("latest");
}

export async function listModels(provider?: string, modelType?: string): Promise<ModelInfo[]> {
  await connectDB();

  const filter: Record<string, any> = { isActive: true };
  if (provider) {
    filter.provider = provider;
  }
  if (modelType) {
    filter.modelType = modelType;
  }

  const docs = await StoredModel.find(filter)
    .sort({ provider: 1, name: 1 })
    .lean();

  const nonAlias = docs.filter((d) => !isAliasModel(d as any));
  const alias = docs.filter((d) => isAliasModel(d as any));

  return [...nonAlias, ...alias].map((d: any) => ({
    id: d.openRouterId,
    label: d.openRouterId.split("/").pop() || d.name,
    supportsVision: d.supportsVision,
    supportsTools: d.supportsTools,
    supportsReasoning: d.supportsReasoning,
    contextWindow: d.contextLength,
  }));
}

export async function listProviders(): Promise<string[]> {
  await connectDB();
  const docs = await StoredModel.distinct("provider", { isActive: true });
  return docs.sort();
}