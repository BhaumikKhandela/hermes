import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ToolFactory } from "../types";

const DETAIL_MAP: Record<string, string> = {
  fast: "low",
  balanced: "auto",
  detailed: "high",
};

export const createImageReaderTool: ToolFactory = (config) => {
  return tool(
    async ({ imageUrl, question, detail, textExtraction, outputFormat }) => {
      const apiKey = config?.apiKey || "";
      const baseURL = config?.baseURL || "";

      if (!apiKey || !baseURL) {
        return "Image Reader tool is not configured. Double-click the node and provide API Key and Base URL.";
      }

      const effectiveImageUrl = imageUrl || config?.imageUrl || "";
      const effectiveQuestion = question || config?.question || "";
      const effectiveDetail = detail || config?.detail || "balanced";
      const effectiveTextExtraction = textExtraction || config?.textExtraction || "auto";
      const effectiveOutputFormat = outputFormat || config?.outputFormat || "markdown";

      if (!effectiveImageUrl) {
        return "No image URL provided. Provide an image URL as a tool argument or in the node configuration.";
      }

      let instruction = effectiveQuestion || "Describe this image in detail.";

      if (effectiveTextExtraction === "always") {
        instruction += " Carefully extract and include all visible text from the image.";
      } else if (effectiveTextExtraction === "never") {
        instruction += " Do not extract text from the image.";
      }

      if (effectiveOutputFormat === "structured json") {
        instruction += " Return the analysis as structured JSON with fields for description, objects, text content, and any other relevant data.";
      } else if (effectiveOutputFormat === "markdown") {
        instruction += " Use markdown formatting in your response.";
      }

      const model = new ChatOpenAI({
        model: config?.model || "gpt-4o-mini",
        apiKey,
        configuration: { baseURL },
        maxTokens: 1024,
      });

      const imageDetail = DETAIL_MAP[effectiveDetail] || "auto";

      const msg = new HumanMessage({
        content: [
          { type: "text", text: instruction },
          {
            type: "image_url",
            image_url: { url: effectiveImageUrl, detail: imageDetail },
          },
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
        imageUrl: z
          .string()
          .url()
          .optional()
          .describe("URL of the image to analyze"),
        question: z
          .string()
          .optional()
          .describe("Question about the image (default: describe it)"),
        detail: z
          .enum(["fast", "balanced", "detailed"])
          .optional()
          .describe("Analysis detail level (default: balanced)"),
        textExtraction: z
          .enum(["auto", "always", "never"])
          .optional()
          .describe("Text extraction mode (default: auto)"),
        outputFormat: z
          .enum(["markdown", "plain text", "structured json"])
          .optional()
          .describe("Output format (default: markdown)"),
      }),
    },
  );
};