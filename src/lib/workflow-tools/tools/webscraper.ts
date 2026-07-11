import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl";
import { ToolFactory } from "../types";

const webscraperSchema = z.object({
  url: z.string().describe("The URL to scrape"),
  crawl: z
    .boolean()
    .optional()
    .describe("If true, crawl linked pages (default: false)"),
  maxPages: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .describe("Max pages to crawl (1-50, default: 10)"),
});

const partialWebscraperSchema = webscraperSchema.partial();

type ScraperInput = z.input<typeof partialWebscraperSchema>;

export const createWebscraperTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || "";

  return tool(
    async (input: ScraperInput) => {
      if (!apiKey) {
        return "Webscraper tool is not configured. Provide a Firecrawl API Key via the credential settings.";
      }

      const parsed = partialWebscraperSchema.parse(input);
      const url = parsed.url || config?.url;
      const crawl = parsed.crawl ?? config?.crawl ?? false;
      const maxPages = parsed.maxPages || config?.maxPages || 10;

      if (!url) {
        return "No URL provided. Pass `url` as a tool argument or configure it in the node settings.";
      }

      const app = new Firecrawl({ apiKey });

      if (crawl) {
        const result = await app.crawl(url, {
          limit: maxPages,
          scrapeOptions: { formats: ["markdown"] },
        });
        return result.data
          ? result.data
              .map(
                (page: any, i: number) =>
                  `--- Page ${i + 1}: ${page.metadata?.sourceURL || url} ---\n${page.markdown || ""}`,
              )
              .join("\n\n")
          : "No data returned from crawl";
      }

      const result = await app.scrape(url, { formats: ["markdown"] });
      return result.markdown || "No content extracted";
    },
    {
      name: "webscraper",
      description:
        "Scrape or crawl a web page and extract its content as clean markdown. Handles JavaScript-rendered pages. Supports crawling linked pages up to a configurable limit. Falls back to configured values when arguments are omitted.",
      schema: partialWebscraperSchema,
    },
  );
};
