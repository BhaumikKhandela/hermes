import { Client } from "@notionhq/client";

export function createNotionClient(config?: Record<string, any>): Client {
  const apiKey = config?.apiKey || "";

  if (!apiKey) {
    throw new Error(
      "Notion tool is not configured. Double-click the node and provide an Internal Integration Secret.",
    );
  }

  return new Client({
    auth: apiKey,
    notionVersion: "2026-03-11",
  });
}
