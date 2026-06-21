import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

type LLMClientOptions = {
  provider: string;
  modelName?: string;
  apiKey: string;
};

export function createLLMClient({
  provider,
  modelName,
  apiKey,
}: LLMClientOptions): BaseChatModel {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({ model: modelName || "gpt-4o", apiKey });
    case "anthropic":
      return new ChatAnthropic({ model: modelName || "claude-3-5-sonnet-20240620", apiKey });
    case "gemini":
      return new ChatGoogleGenerativeAI({ model: modelName || "gemini-1.5-pro", apiKey });
    default:
      throw new Error(`Unsupported provider for credential-based model: "${provider}"`);
  }
}
