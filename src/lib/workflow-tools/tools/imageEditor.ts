import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { ToolFactory } from "../types";

export const createImageEditorTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async ({ imageUrl, maskUrl, prompt, size, quality, background }) => {
      if (!apiKey) {
        return "Image Editor tool is not configured. Double-click the node and provide an OpenAI API Key.";
      }

      const effectiveImageUrl = imageUrl || config?.imageUrl || "";
      const effectivePrompt = prompt || config?.prompt || "";
      const effectiveMaskUrl = maskUrl || config?.maskUrl || undefined;
      const effectiveSize = size || config?.size || "1024x1024";

      if (!effectiveImageUrl) {
        return "No image URL provided. Provide an image URL as a tool argument or in the node configuration.";
      }

      if (!effectivePrompt) {
        return "No edit prompt provided. Provide a prompt describing the edit.";
      }

      const openai = new OpenAI({ apiKey });
      const imageRes = await fetch(effectiveImageUrl);
      const imageBlob = await imageRes.blob();
      const imageFile = new File([imageBlob], "image.png", {
        type: "image/png",
      });

      let maskFile: File | undefined;
      if (effectiveMaskUrl) {
        const maskRes = await fetch(effectiveMaskUrl);
        const maskBlob = await maskRes.blob();
        maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
      }

      const res = await openai.images.edit({
        model: "dall-e-2",
        image: imageFile,
        ...(maskFile ? { mask: maskFile } : {}),
        prompt: effectivePrompt,
        n: 1,
        size: effectiveSize,
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
          .optional()
          .describe("URL of the image to edit"),
        maskUrl: z
          .string()
          .url()
          .optional()
          .describe(
            "URL of a mask image (white areas get edited, black areas preserved)",
          ),
        prompt: z
          .string()
          .optional()
          .describe("Description of the edit to make"),
        quality: z
          .enum(["standard", "hd"])
          .optional()
          .describe("Image quality (default: standard)"),
        size: z
          .enum(["1024x1024"])
          .optional()
          .describe("Image size (default: 1024x1024)"),
        background: z
          .enum(["auto", "transparent", "opaque"])
          .optional()
          .describe("Background type (default: auto)"),
      }),
    },
  );
};