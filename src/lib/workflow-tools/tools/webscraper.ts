import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl";
import { ToolFactory } from "../types";

export const createWebscraperTool: ToolFactory = (config) => {
  const apiKey = config?.apiKey || process.env.FIRECRAWL_API_KEY || "";

  if (!apiKey) {
    throw new Error("Firecrawl requires FIRECRAWL_API_KEY env var");
  }

  const app = new Firecrawl({ apiKey });

  return tool(
    async ({ url, crawl }) => {
      if (crawl) {
        const result = await app.crawl(url, {
          limit: 10,
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
        "Scrape or crawl a web page and extract its content as clean markdown. Handles JavaScript-rendered pages.",
      schema: z.object({
        url: z.string().url().describe("The URL to scrape"),
        crawl: z
          .boolean()
          .optional()
          .describe("If true, crawl linked pages up to 10 (default: false)"),
      }),
    },
  );
};
