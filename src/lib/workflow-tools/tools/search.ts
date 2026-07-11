import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolFactory } from "../types";

const TAVILY_API = "https://api.tavily.com/search";

const searchSchema = z.object({
  query: z.string().describe("Search query"),
  maxResults: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Number of results (1-10, default 5)"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .describe("Search depth (default: basic)"),
  includeAnswer: z
    .boolean()
    .optional()
    .describe("Include a direct answer from Tavily (default: false)"),
  includeImages: z
    .boolean()
    .optional()
    .describe("Include images in results (default: false)"),
  includeDomains: z
    .array(z.string())
    .optional()
    .describe("Domains to include in search"),
  excludeDomains: z
    .array(z.string())
    .optional()
    .describe("Domains to exclude from search"),
});

const partialSearchSchema = searchSchema.partial();

type SearchInput = z.input<typeof partialSearchSchema>;

export const createSearchTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async (input: SearchInput) => {
      if (!apiKey) {
        return "Search tool is not configured. Provide a Tavily API Key via the credential settings.";
      }

      const parsed = partialSearchSchema.parse(input);
      const query = parsed.query || config?.query;
      const maxResults = parsed.maxResults || config?.maxResults || 5;
      const searchDepth = parsed.searchDepth || config?.searchDepth || "basic";
      const includeAnswer = parsed.includeAnswer ?? config?.includeAnswer ?? false;
      const includeImages = parsed.includeImages ?? config?.includeImages ?? false;
      const includeDomains = parsed.includeDomains || config?.includeDomains;
      const excludeDomains = parsed.excludeDomains || config?.excludeDomains;

      if (!query) {
        return "No query provided. Pass `query` as a tool argument or configure it in the node settings.";
      }

      const body: Record<string, any> = {
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: includeAnswer,
        include_images: includeImages,
      };
      if (includeDomains && includeDomains.length > 0) {
        body.include_domains = includeDomains;
      }
      if (excludeDomains && excludeDomains.length > 0) {
        body.exclude_domains = excludeDomains;
      }

      const res = await fetch(TAVILY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        return `Search failed: ${err}`;
      }

      const data = await res.json();
      const results = data.results || [];
      let output = "";

      if (data.answer) {
        output += `Answer: ${data.answer}\n\n`;
      }

      output += results
        .map(
          (r: any, i: number) =>
            `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.content?.substring(0, 300)}${r.content?.length > 300 ? "..." : ""}${r.score !== undefined ? `\n   Relevance: ${(r.score * 100).toFixed(0)}%` : ""}`,
        )
        .join("\n\n");

      return output || "No results found.";
    },
    {
      name: "search",
      description:
        "Search the web using Tavily. Returns ranked results with title, URL, content snippet, and relevance score. Optionally includes a direct answer and images. Falls back to configured values when arguments are omitted.",
      schema: partialSearchSchema,
    },
  );
};
