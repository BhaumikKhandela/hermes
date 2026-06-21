import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { ToolFactory } from "../types";

export const createImageEditorTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async ({ imageUrl, maskUrl, prompt }) => {
      if (!apiKey) {
        return "Image Editor tool is not configured. Double-click the node and provide an OpenAI API Key.";
      }

      const openai = new OpenAI({ apiKey });
      const imageRes = await fetch(imageUrl);
      const imageBlob = await imageRes.blob();
      const imageFile = new File([imageBlob], "image.png", {
        type: "image/png",
      });

      let maskFile: File | undefined;
      if (maskUrl) {
        const maskRes = await fetch(maskUrl);
        const maskBlob = await maskRes.blob();
        maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
      }

      const res = await openai.images.edit({
        model: "dall-e-2",
        image: imageFile,
        ...(maskFile ? { mask: maskFile } : {}),
        prompt,
        n: 1,
        size: "1024x1024",
      });

      const url = res.data?.[0]?.url;
      return url
        ? `Edited image:\n${url}`
        : "Image editing failed";
    },
    {
      name: "imageEditor",
      description:
        "Edit an image using DALL-E 2 inpainting. Provide an image URL and a prompt describing the edit.",
      schema: z.object({
        imageUrl: z
          .string()
          .url()
          .describe("URL of the image to edit"),
        maskUrl: z
          .string()
          .url()
          .optional()
          .describe(
            "URL of a mask image (white areas get edited, black areas preserved)",
          ),
        prompt: z.string().describe("Description of the edit to make"),
      }),
    },
  );
};
