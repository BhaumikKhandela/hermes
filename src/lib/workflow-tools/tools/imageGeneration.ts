import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { ToolFactory } from "../types";

export const createImageGeneratorTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY || "";

  if (!apiKey) {
    throw new Error("Image generation requires OPENAI_API_KEY env var");
  }

  const openai = new OpenAI({ apiKey });

  return tool(
    async ({ prompt, size }) => {
      const res = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: size || "1024x1024",
      });

      const url = res.data?.[0]?.url;
      const revisedPrompt = res.data?.[0]?.revised_prompt;
      return url
        ? `Generated image:\n${url}${revisedPrompt ? `\n\n(Revised prompt: ${revisedPrompt})` : ""}`
        : "Image generation failed";
    },
    {
      name: "imageGenerator",
      description:
        "Generate an image from a text description using DALL-E 3. Returns a URL to the generated image.",
      schema: z.object({
        prompt: z.string().describe("Detailed description of the image to generate"),
        size: z
          .enum(["1024x1024", "1792x1024", "1024x1792"])
          .optional()
          .describe("Image size (default: 1024x1024)"),
      }),
    },
  );
};
