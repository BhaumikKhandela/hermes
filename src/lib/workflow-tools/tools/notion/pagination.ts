import { Client } from "@notionhq/client";

type QueryParams = {
  data_source_id: string;
  filter?: any;
  sorts?: any;
  page_size?: number;
  start_cursor?: string;
};

type QueryResponse = {
  results: unknown[];
  has_more: boolean;
  next_cursor: string | null;
};

export async function queryWithPagination(
  notion: Client,
  params: QueryParams,
  returnAll: boolean,
  maxItems: number,
): Promise<QueryResponse> {
  if (!returnAll) {
    return await notion.dataSources.query(params) as unknown as QueryResponse;
  }

  const results: unknown[] = [];
  let cursor: string | undefined = params.start_cursor;

  do {
    const response = await notion.dataSources.query({
      ...params,
      page_size: Math.min(100, maxItems - results.length),
      start_cursor: cursor,
    }) as unknown as QueryResponse;

    results.push(...response.results);

    if (results.length >= maxItems) {
      return {
        results: results.slice(0, maxItems),
        has_more: false,
        next_cursor: null,
      };
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return {
    results,
    has_more: false,
    next_cursor: null,
  };
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
