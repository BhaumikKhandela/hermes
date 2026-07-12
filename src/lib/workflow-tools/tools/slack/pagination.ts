import { WebClient } from "@slack/web-api";

export async function paginateAll<T>(
  client: WebClient,
  method: string,
  params: Record<string, unknown>,
  extractItems: (page: Record<string, any>) => T[],
  maxItems: number,
): Promise<T[]> {
  const results: T[] = [];
  for await (const page of client.paginate(method, params)) {
    const items = extractItems(page as Record<string, any>);
    results.push(...items);
    if (results.length >= maxItems) {
      return results.slice(0, maxItems);
    }
  }
  return results;
}
