export { type ModelInfo, type ProviderAdapter } from "./types";
export {
  registerProvider,
  getProvider,
  listProviders,
} from "./provider-registry";
export { OpenAIProvider } from "./openai-provider";
export { AnthropicProvider } from "./anthropic-provider";
export { GeminiProvider } from "./gemini-provider";
export { getCachedModels, setCachedModels } from "./cache";

import { registerProvider } from "./provider-registry";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GeminiProvider } from "./gemini-provider";

registerProvider(new OpenAIProvider());
registerProvider(new AnthropicProvider());
registerProvider(new GeminiProvider());
