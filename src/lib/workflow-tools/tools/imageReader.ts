import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ToolFactory } from "../types";

export const createImageReaderTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || process.env.BLUESMINDS_API_KEY || "";
  const baseURL = config?.baseURL || process.env.BLUESMINDS_BASE || "";

  if (!apiKey || !baseURL) {
    throw new Error(
      "Image reader requires BLUESMINDS_API_KEY and BLUESMINDS_BASE env vars",
    );
  }

  const model = new ChatOpenAI({
    model: config?.model || "gpt-4o-mini",
    apiKey,
    configuration: { baseURL },
    maxTokens: 1024,
  });

  return tool(
    async ({ imageUrl, question }) => {
      const msg = new HumanMessage({
        content: [
          {
            type: "text",
            text: question || "Describe this image in detail.",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });

      const res = await model.invoke([msg]);
      return typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);
    },
    {
      name: "imageReader",
      description:
        "Analyze an image using GPT-4o vision. Provide an image URL and ask a question about it.",
      schema: z.object({
        imageUrl: z.string().url().describe("URL of the image to analyze"),
        question: z
          .string()
          .optional()
          .describe("Question about the image (default: describe it)"),
      }),
    },
  );
};
