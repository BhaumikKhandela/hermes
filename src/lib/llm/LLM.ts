import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";

type LLMType = "fireworks" | "cerebras";

export class LLM {
  private static instances: Partial<Record<LLMType, any>> = {};

  // Private constructor
  private constructor() {}

  public static getInstance(type: LLMType = "fireworks") {
    if (!LLM.instances[type]) {
      switch (type) {
        case "fireworks":
          if (!process.env.FIRE_WORKS_API_KEY) {
            throw new Error("FIRE_WORKS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatFireworks({
            model: "accounts/fireworks/models/qwen3-v1-30b-a3b-thinking",
            temperature: 0.7,
            apiKey: process.env.FIRE_WORKS_API_KEY,
          });
          break;
        case "cerebras":
          if (!process.env.CEREBRAS_API_KEY) {
            throw new Error("CEREBRAS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatCerebras({
            model: "gpt-oss-120b",
            temperature: 0.7,
            apiKey: process.env.CEREBRAS_API_KEY,
          });
          break;
        default:
          throw new Error(`Unsupported LLM type: ${type}`);
      }
    }

    return LLM.instances[type];
  }
}

export const cerebrasModel = LLM.getInstance("cerebras");
export const fireworksModel = LLM.getInstance("fireworks");
