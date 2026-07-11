import type { NotionToolResult, VisualBlock } from "./types";
import { createNotionClient } from "./client";
import { visualBlocksToNotionJson } from "./convert";
import { queryWithPagination, chunkArray } from "./pagination";
import { blockRegistry } from "./registry";
import { Client } from "@notionhq/client";

export async function handleQuery(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<NotionToolResult> {
  const dataSourceId = input.dataSourceId || config?.dataSourceId;
  const filter = input.filter ?? config?.filter;
  const sorts = input.sorts ?? config?.sorts;
  const pageSize = input.pageSize || config?.pageSize || 100;
  const startCursor = input.startCursor || config?.startCursor;
  const returnAll = input.returnAll ?? config?.returnAll ?? false;
  const maxItems = input.maxItems || config?.maxItems || 1000;

  if (!dataSourceId) {
    throw new Error("Data Source ID is required for query. Pass it as a tool argument or configure it in the node settings.");
  }

  const notion = createNotionClient(config);
  const response = await queryWithPagination(
    notion,
    {
      data_source_id: dataSourceId,
      filter,
      sorts,
      page_size: pageSize,
      start_cursor: startCursor,
    },
    returnAll,
    maxItems,
  );

  return {
    action: "query",
    data: {
      pages: response.results,
      count: response.results.length,
      hasMore: response.has_more,
      nextCursor: response.next_cursor,
    },
  };
}

export async function handleCreate(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<NotionToolResult> {
  const parentId = input.parentId || config?.parentId;
  const parentType = input.parentType || config?.parentType || "data_source_id";
  const properties = input.properties || config?.properties || {};
  const content = input.content || config?.content;

  if (!parentId) {
    throw new Error("Parent ID is required for creating a page. Pass it as a tool argument or configure it in the node settings.");
  }

  const notion = createNotionClient(config);
  const body: Record<string, any> = {
    parent: { type: parentType, [parentType]: parentId },
    properties,
  };

  if (content) {
    switch (content.mode) {
      case "visual": {
        const children = visualBlocksToNotionJson(content.blocks);
        if (children.length > 0) {
          body.children = children;
        }
        break;
      }
      case "markdown":
        body.markdown = content.markdown;
        break;
      case "json": {
        const parsed = JSON.parse(content.json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          body.children = parsed;
        }
        break;
      }
    }
  }

  const page = await notion.pages.create(body);

  return {
    action: "create",
    data: {
      page,
      pageId: (page as any).id,
      url: (page as any).url || "",
    },
  };
}

export async function handleUpdate(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<NotionToolResult> {
  const pageId = input.pageId || config?.pageId;
  const properties = input.properties || config?.properties;

  if (!pageId) {
    throw new Error("Page ID is required for update.");
  }
  if (!properties) {
    throw new Error("Properties are required for update. Pass them as a tool argument or configure them in the node settings.");
  }

  const notion = createNotionClient(config);
  const page = await notion.pages.update({ page_id: pageId, properties });

  return {
    action: "update",
    data: { page, pageId: (page as any).id },
  };
}

export async function handleRetrieve(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<NotionToolResult> {
  const pageId = input.pageId || config?.pageId;
  const retrieveFormat = input.retrieveFormat || config?.retrieveFormat || "metadata";
  const includeProperties = input.includeProperties ?? config?.includeProperties ?? true;

  if (!pageId) {
    throw new Error("Page ID is required for retrieve.");
  }

  const notion = createNotionClient(config);
  const result: any = { action: "retrieve", data: {} };

  if (retrieveFormat === "metadata" || includeProperties) {
    const page = await notion.pages.retrieve({ page_id: pageId });
    result.data.page = page;
  }

  if (retrieveFormat === "markdown") {
    const markdownResponse: any = await notion.request({
      path: `/pages/${pageId}/markdown`,
      method: "get",
    });
    result.data.content = markdownResponse.markdown || markdownResponse;
    result.data.contentFormat = "markdown";
  } else if (retrieveFormat === "blocks") {
    const blocks = await recursivelyRetrieveBlocks(notion, pageId);
    result.data.content = blocks;
    result.data.contentFormat = "blocks";
  }

  return result as NotionToolResult;
}

export async function handleAppend(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<NotionToolResult> {
  const blockId = input.blockId || config?.blockId;
  const content = input.content || config?.content;
  const position = input.position || config?.position || { type: "end" };

  if (!blockId) {
    throw new Error("Block ID (or Page ID) is required for append.");
  }
  if (!content) {
    throw new Error("Content is required for append.");
  }

  const notion = createNotionClient(config);

  if (content.mode === "markdown") {
    if (position.type === "after_block") {
      throw new Error("Markdown append does not support after_block positioning");
    }
    const body: Record<string, any> = {
      markdown: content.markdown,
    };
    if (position.type === "start" || position.type === "end") {
      body.position = position.type;
    }
    await notion.request({
      path: `/pages/${blockId}/markdown`,
      method: "patch",
      body,
    });
    return {
      action: "append",
      data: { targetBlockId: blockId },
    };
  }

  let children: Record<string, any>[];
  if (content.mode === "visual") {
    children = visualBlocksToNotionJson(content.blocks);
  } else {
    children = JSON.parse(content.json);
  }

  if (!Array.isArray(children) || children.length === 0) {
    throw new Error("Content must contain at least one block.");
  }

  const chunks = chunkArray(children, 100);
  let totalCount = 0;

  for (const chunk of chunks) {
    const appendBody: Record<string, any> = { block_id: blockId, children: chunk };
    if (position.type === "after_block" && position.afterBlockId) {
      appendBody.position = { after: position.afterBlockId };
    }
    const response: any = await (notion as any).blocks.children.append(appendBody);
    totalCount += response.results?.length || chunk.length;
  }

  return {
    action: "append",
    data: { targetBlockId: blockId, appendedBlockCount: totalCount },
  };
}

async function recursivelyRetrieveBlocks(
  notion: Client,
  blockId: string,
): Promise<Record<string, any>[]> {
  const allBlocks: Record<string, any>[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results || []) {
      if (block.has_children) {
        block.children = await recursivelyRetrieveBlocks(notion, block.id);
      }
      allBlocks.push(block);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return allBlocks;
}
