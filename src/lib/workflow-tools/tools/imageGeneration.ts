import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { ToolFactory } from "../types";

export const createImageGeneratorTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async ({ prompt, size, quality, background }) => {
      if (!apiKey) {
        return "Image Generator tool is not configured. Double-click the node and provide an OpenAI API Key.";
      }

      const effectivePrompt = prompt || config?.prompt || "";
      const effectiveSize = size || config?.size || "1024x1024";
      const effectiveQuality = quality || config?.quality || "standard";

      const openai = new OpenAI({ apiKey });
      const apiParams: any = {
        model: config?.model || "dall-e-3",
        prompt: effectivePrompt,
        n: 1,
        size: effectiveSize,
      };

      if (effectiveQuality === "hd") {
        apiParams.quality = "hd";
      }

      const res = await openai.images.generate(apiParams);

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
        prompt: z
          .string()
          .optional()
          .describe("Detailed description of the image to generate"),
        size: z
          .enum(["1024x1024", "1792x1024", "1024x1792"])
          .optional()
          .describe("Image size (default: 1024x1024)"),
        quality: z
          .enum(["standard", "hd"])
          .optional()
          .describe("Image quality (default: standard)"),
        background: z
          .enum(["auto", "transparent", "opaque"])
          .optional()
          .describe("Background type (default: auto)"),
      }),
    },
  );
};