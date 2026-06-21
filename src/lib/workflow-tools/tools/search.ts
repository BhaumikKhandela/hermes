import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolFactory } from "../types";

export const createSearchTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";
  const cseId = config?.cseId || "";

  return tool(
    async ({ query, num }) => {
      if (!apiKey || !cseId) {
        return "Search tool is not configured. Double-click the node and provide API Key and Search Engine ID.";
      }

      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("cx", cseId);
      url.searchParams.set("q", query);
      url.searchParams.set("num", String(num || 5));

      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.text();
        return `Search failed: ${err}`;
      }

      const data = await res.json();
      const items = data.items || [];
      return items
        .map(
          (item: any, i: number) =>
            `${i + 1}. ${item.title}\n   ${item.snippet}\n   ${item.link}`,
        )
        .join("\n\n");
    },
    {
      name: "search",
      description:
        "Search the web using Google Custom Search. Returns ranked results with title, snippet, and URL.",
      schema: z.object({
        query: z.string().describe("Search query"),
        num: z
          .number()
          .optional()
          .describe("Number of results (1-10, default 5)"),
      }),
    },
  );
};
