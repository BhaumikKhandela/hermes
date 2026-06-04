import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatOpenAI } from "@langchain/openai";

type LLMType = "fireworks" | "cerebras" | "cerebras_llama" | "gpt4o_mini";;
type LLMInstanceMap = {
  fireworks: ChatFireworks;
  cerebras: ChatCerebras;
  cerebras_llama: ChatCerebras;
  gpt4o_mini: ChatOpenAI;
};

export class LLM {
  private static instances: Partial<LLMInstanceMap> = {};

  // Private constructor
  private constructor() {}

  public static getInstance<T extends LLMType>(
    type: T = "fireworks" as T,
  ): LLMInstanceMap[T] {
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
          }) as LLMInstanceMap[T];
          break;
        case "cerebras_llama":
          if (!process.env.CEREBRAS_API_KEY) {
            throw new Error("CEREBRAS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatCerebras({
            model: "llama3.1-8b", 
            temperature: 0.7,
            apiKey: process.env.FIRE_WORKS_API_KEY,
          }) as LLMInstanceMap[T];
          break;
        case "cerebras":
          if (!process.env.CEREBRAS_API_KEY) {
            throw new Error("CEREBRAS_API_KEY is not set");
          }
          LLM.instances[type] = new ChatCerebras({
            model: "gpt-oss-120b",
            temperature: 0.7,
            apiKey: process.env.CEREBRAS_API_KEY,
          }) as LLMInstanceMap[T];
          break;
        case "gpt4o_mini":
           if (!process.env.BLUESMINDS_API_KEY) {
            throw new Error("BLUESMINDS_API_KEY is not set");
          }

          if (!process.env.BLUESMINDS_BASE) {
            throw new Error("BLUESMINDS_BASE is not set");
          }

          LLM.instances[type] = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0,
            apiKey: process.env.BLUESMINDS_API_KEY,
            configuration: {
              baseURL: process.env.BLUESMINDS_BASE,
            },
          }) as LLMInstanceMap[T];

          break;
          default:
          throw new Error(`Unsupported LLM type: ${type}`);
      }
    }

    return LLM.instances[type]!;
  }
}

export const cerebrasModel = LLM.getInstance("cerebras");
export const fireworksModel = LLM.getInstance("fireworks");
export const cerebrasLlamaModel = LLM.getInstance("cerebras_llama");
export const gpt4oMiniModel = LLM.getInstance("gpt4o_mini");
