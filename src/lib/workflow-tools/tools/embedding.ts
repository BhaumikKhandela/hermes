import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolFactory } from "../types";

const PROVIDER_DEFAULTS: Record<string, string> = {
  openai: "text-embedding-3-small",
  cohere: "embed-english-v3.0",
  gemini: "gemini-embedding-001",
  mistral: "mistral-embed-2312",
  voyage: "voyage-4",
  jina: "jina-embeddings-v3",
};

const PROVIDER_BASE_URLS: Record<string, string> = {
  mistral: "https://api.mistral.ai/v1/embeddings",
  voyage: "https://api.voyageai.com/v1/embeddings",
  jina: "https://api.jina.ai/v1/embeddings",
};

async function openAICompatibleEmbedding(
  apiKey: string,
  model: string,
  input: string,
  baseURL: string,
): Promise<number[]> {
  const res = await fetch(baseURL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, model }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API returned ${res.status}: ${text}`);
  }

  const json = await res.json();
  const embedding = json?.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Unexpected API response format: missing data[0].embedding");
  }
  return embedding;
}

async function geminiEmbedding(
  apiKey: string,
  model: string,
  input: string,
): Promise<number[]> {
  const baseModel = model.includes("/") ? model.split("/").pop()! : model;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${baseModel}:embedContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: { parts: [{ text: input }] },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API returned ${res.status}: ${text}`);
  }

  const json = await res.json();
  const values = json?.embedding?.values;
  if (!values) {
    throw new Error("Unexpected Gemini response format: missing embedding.values");
  }
  return values;
}

export const createEmbeddingTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";
  const provider = config?.provider || "openai";
  const model = config?.model || PROVIDER_DEFAULTS[provider] || "text-embedding-3-small";

  return tool(
    async ({ text, model: argModel }) => {
      const resolvedModel = argModel || model;
      const resolvedText = text || config?.text;

      if (!resolvedText) {
        return "No text provided for embedding. Pass a `text` argument or configure it in the node settings.";
      }

      if (!apiKey) {
        return "Embedding tool is not configured. Double-click the node and add a credential with an API key.";
      }

      if (config?.credentialProvider && config?.credentialProvider !== provider) {
        return `Warning: Credential provider (${config.credentialProvider}) differs from selected provider (${provider}). This may cause authentication errors. Proceeding anyway.`;
      }

      try {
        let vector: number[];

        switch (provider) {
          case "openai": {
            const { OpenAIEmbeddings } = await import("@langchain/openai");
            const embeddings = new OpenAIEmbeddings({
              apiKey,
              model: resolvedModel,
            });
            vector = await embeddings.embedQuery(resolvedText);
            break;
          }
          case "cohere": {
            const { CohereEmbeddings } = await import("@langchain/cohere");
            const embeddings = new CohereEmbeddings({
              apiKey,
              model: resolvedModel,
            });
            vector = await embeddings.embedQuery(resolvedText);
            break;
          }
          case "gemini": {
            vector = await geminiEmbedding(apiKey, resolvedModel, resolvedText);
            break;
          }
          case "mistral":
          case "voyage":
          case "jina": {
            const baseURL = PROVIDER_BASE_URLS[provider];
            if (!baseURL) {
              return `Unsupported embedding provider: "${provider}".`;
            }
            vector = await openAICompatibleEmbedding(apiKey, resolvedModel, resolvedText, baseURL);
            break;
          }
          default:
            return `Unsupported embedding provider: "${provider}". Supported providers: openai, cohere, gemini, mistral, voyage, jina.`;
        }

        return JSON.stringify(vector);
      } catch (err: any) {
        return `Embedding failed: ${err.message || "Unknown error"}`;
      }
    },
    {
      name: "embedding",
      description:
        "Convert text into a vector embedding. Pass a `text` string and optionally a `model` to override the configured model. Returns a JSON array of floats.",
      schema: z.object({
        text: z.string().optional().describe("Text to embed. Falls back to configured text if omitted."),
        model: z.string().optional().describe("Embedding model to use. Overrides the configured model."),
      }),
    },
  );
};
