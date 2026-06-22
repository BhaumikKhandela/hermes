import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

type LLMClientOptions = {
  provider: string;
  modelName?: string;
  apiKey: string;
  baseURL?: string;
};

export async function createLLMClient({
  provider,
  modelName,
  apiKey,
  baseURL,
}: LLMClientOptions): Promise<BaseChatModel> {
  switch (provider) {
    case "openai": {
      const { ChatOpenAI } = await import("@langchain/openai");
      return new ChatOpenAI({
        model: modelName || "gpt-4o",
        apiKey,
        ...(baseURL && { configuration: { baseURL } }),
      });
    }
    case "bluesmind": {
      const { ChatOpenAI } = await import("@langchain/openai");
      return new ChatOpenAI({
        model: modelName || "gpt-4o",
        apiKey,
        configuration: { baseURL: baseURL || "https://api.bluesminds.com/v1" },
      });
    }
    case "anthropic": {
      const { ChatAnthropic } = await import("@langchain/anthropic");
      return new ChatAnthropic({ model: modelName || "claude-3-5-sonnet-20240620", apiKey });
    }
    case "gemini": {
      const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
      return new ChatGoogleGenerativeAI({ model: modelName || "gemini-1.5-pro", apiKey });
    }
    default:
      throw new Error(`Unsupported provider for credential-based model: "${provider}"`);
  }
}
