import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleAppend, handleCreate, handleRetrieve, handleQuery } from "../handler";
import { partialNotionSchema } from "../schema";
import type { VisualBlock } from "../types";

const mockBlocksAppend = vi.fn<any, any>();
const mockBlocksList = vi.fn<any, any>();
const mockPagesCreate = vi.fn<any, any>();
const mockPagesUpdate = vi.fn<any, any>();
const mockPagesRetrieve = vi.fn<any, any>();
const mockPagesRetrieveMarkdown = vi.fn<any, any>();
const mockPagesUpdateMarkdown = vi.fn<any, any>();
const mockDataSourcesQuery = vi.fn<any, any>();

vi.mock("../client", () => ({
  createNotionClient: vi.fn(() => ({
    blocks: {
      children: {
        append: mockBlocksAppend,
        list: mockBlocksList,
      },
    },
    pages: {
      create: mockPagesCreate,
      update: mockPagesUpdate,
      retrieve: mockPagesRetrieve,
      retrieveMarkdown: mockPagesRetrieveMarkdown,
      updateMarkdown: mockPagesUpdateMarkdown,
    },
    dataSources: {
      query: mockDataSourcesQuery,
    },
  })),
}));

const VISUAL_BLOCKS: VisualBlock[] = [
  { id: "b1", type: "paragraph", richText: [{ id: "r1", text: "hello" }] },
  { id: "b2", type: "paragraph", richText: [{ id: "r2", text: "world" }] },
];

const MARKDOWN_TEXT = "# Hello\n\nThis is a test.";

const BLOCK_JSON_VALID = JSON.stringify([
  { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "hello" } }] } },
]);

const FAKE_CONFIG = { apiKey: "ntn_test_key" };

beforeEach(() => {
  vi.clearAllMocks();
  mockBlocksAppend.mockResolvedValue({ results: [{ id: "c1" }] });
  mockBlocksList.mockResolvedValue({ results: [], has_more: false, next_cursor: null });
  mockPagesCreate.mockResolvedValue({ id: "page1", url: "https://notion.so/page1", object: "page" });
  mockPagesUpdate.mockResolvedValue({ id: "page1", object: "page" });
  mockPagesRetrieve.mockResolvedValue({ id: "page1", object: "page", properties: {} });
  mockPagesRetrieveMarkdown.mockResolvedValue({ object: "page_markdown", id: "page1", markdown: "# md", truncated: false, unknown_block_ids: [] });
  mockPagesUpdateMarkdown.mockResolvedValue({ object: "page_markdown", id: "page1", markdown: "# md", truncated: false, unknown_block_ids: [] });
  mockDataSourcesQuery.mockResolvedValue({ results: [], has_more: false, next_cursor: null, type: "page_or_data_source", page_or_data_source: {}, object: "list" });
});

// ══════════════════════════════════════════════════════════
// MARKDOWN APPEND
// ══════════════════════════════════════════════════════════

describe("handleAppend — markdown", () => {
  it("start: calls pages.updateMarkdown with insert_content and position start", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "markdown", markdown: MARKDOWN_TEXT }, position: { type: "start" } },
      FAKE_CONFIG,
    );
    expect(mockPagesUpdateMarkdown).toHaveBeenCalledTimes(1);
    expect(mockPagesUpdateMarkdown).toHaveBeenCalledWith({
      page_id: "block1",
      type: "insert_content",
      insert_content: {
        content: MARKDOWN_TEXT,
        position: { type: "start" },
      },
    });
  });

  it("end: calls pages.updateMarkdown with insert_content and position end", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "markdown", markdown: MARKDOWN_TEXT }, position: { type: "end" } },
      FAKE_CONFIG,
    );
    expect(mockPagesUpdateMarkdown).toHaveBeenCalledTimes(1);
    expect(mockPagesUpdateMarkdown).toHaveBeenCalledWith({
      page_id: "block1",
      type: "insert_content",
      insert_content: {
        content: MARKDOWN_TEXT,
        position: { type: "end" },
      },
    });
  });

  it("after_block: rejects with clear error and does not call SDK", async () => {
    await expect(
      handleAppend(
        { blockId: "block1", content: { mode: "markdown", markdown: MARKDOWN_TEXT }, position: { type: "after_block", afterBlockId: "anchor1" } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("Markdown append does not support after_block positioning");
    expect(mockPagesUpdateMarkdown).not.toHaveBeenCalled();
    expect(mockBlocksAppend).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// VISUAL APPEND
// ══════════════════════════════════════════════════════════

describe("handleAppend — visual blocks", () => {
  it("start: calls blocks.children.append with position type start", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "visual", blocks: VISUAL_BLOCKS }, position: { type: "start" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.block_id).toBe("block1");
    expect(callArgs.position).toEqual({ type: "start" });
    expect(callArgs.children).toBeDefined();
    expect(Array.isArray(callArgs.children)).toBe(true);
  });

  it("end: calls blocks.children.append with position type end", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "visual", blocks: VISUAL_BLOCKS }, position: { type: "end" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.block_id).toBe("block1");
    expect(callArgs.position).toEqual({ type: "end" });
  });

  it("after_block: calls blocks.children.append with correct ContentPositionSchema", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "visual", blocks: VISUAL_BLOCKS }, position: { type: "after_block", afterBlockId: "anchor1" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.block_id).toBe("block1");
    expect(callArgs.position).toEqual({ type: "after_block", after_block: { id: "anchor1" } });
  });

  it("after_block missing afterBlockId: rejects with clear error", async () => {
    await expect(
      handleAppend(
        { blockId: "block1", content: { mode: "visual", blocks: VISUAL_BLOCKS }, position: { type: "after_block" } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("after_block positioning requires an afterBlockId");
    expect(mockBlocksAppend).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// CHUNK ORDERING (250 blocks, 3 chunks)
// ══════════════════════════════════════════════════════════

describe("handleAppend — chunk ordering", () => {
  function makeBlocks(n: number): VisualBlock[] {
    return Array.from({ length: n }, (_, i) => ({
      id: `chunk-b${i}`,
      type: "paragraph" as const,
      richText: [{ id: `chunk-r${i}`, text: `BLOCK-${String(i).padStart(3, "0")}` }],
    }));
  }

  function firstText(callArgs: any): string {
    return callArgs.children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
  }

  it("END: appends chunks 1 → 2 → 3 in forward order", async () => {
    const blocks = makeBlocks(250);
    await handleAppend(
      { blockId: "page1", content: { mode: "visual", blocks }, position: { type: "end" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(3);
    expect(firstText(mockBlocksAppend.mock.calls[0][0])).toBe("BLOCK-000");
    expect(firstText(mockBlocksAppend.mock.calls[1][0])).toBe("BLOCK-100");
    expect(firstText(mockBlocksAppend.mock.calls[2][0])).toBe("BLOCK-200");
  });

  it("START: appends chunks 3 → 2 → 1 (reversed)", async () => {
    const blocks = makeBlocks(250);
    await handleAppend(
      { blockId: "page1", content: { mode: "visual", blocks }, position: { type: "start" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(3);
    expect(firstText(mockBlocksAppend.mock.calls[0][0])).toBe("BLOCK-200");
    expect(firstText(mockBlocksAppend.mock.calls[1][0])).toBe("BLOCK-100");
    expect(firstText(mockBlocksAppend.mock.calls[2][0])).toBe("BLOCK-000");
  });

  it("AFTER_BLOCK: appends chunks 3 → 2 → 1 (reversed)", async () => {
    const blocks = makeBlocks(250);
    await handleAppend(
      { blockId: "page1", content: { mode: "visual", blocks }, position: { type: "after_block", afterBlockId: "anchor1" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(3);
    expect(firstText(mockBlocksAppend.mock.calls[0][0])).toBe("BLOCK-200");
    expect(firstText(mockBlocksAppend.mock.calls[1][0])).toBe("BLOCK-100");
    expect(firstText(mockBlocksAppend.mock.calls[2][0])).toBe("BLOCK-000");
  });

  it("JSON mode: START appends chunks 3 → 2 → 1 (reversed)", async () => {
    // Generate 250 JSON blocks
    const blocks = Array.from({ length: 250 }, (_, i) => ({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: { rich_text: [{ type: "text" as const, text: { content: `BLOCK-${String(i).padStart(3, "0")}` } }] },
    }));
    const json = JSON.stringify(blocks);
    await handleAppend(
      { blockId: "page1", content: { mode: "json", json }, position: { type: "start" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(3);
    const firstOfChunk1 = mockBlocksAppend.mock.calls[0][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    const firstOfChunk2 = mockBlocksAppend.mock.calls[1][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    const firstOfChunk3 = mockBlocksAppend.mock.calls[2][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    expect(firstOfChunk1).toBe("BLOCK-200");
    expect(firstOfChunk2).toBe("BLOCK-100");
    expect(firstOfChunk3).toBe("BLOCK-000");
  });

  it("JSON mode: END appends chunks 1 → 2 → 3 forward", async () => {
    const blocks = Array.from({ length: 250 }, (_, i) => ({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: { rich_text: [{ type: "text" as const, text: { content: `BLOCK-${String(i).padStart(3, "0")}` } }] },
    }));
    const json = JSON.stringify(blocks);
    await handleAppend(
      { blockId: "page1", content: { mode: "json", json }, position: { type: "end" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(3);
    const firstOfChunk1 = mockBlocksAppend.mock.calls[0][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    const firstOfChunk2 = mockBlocksAppend.mock.calls[1][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    const firstOfChunk3 = mockBlocksAppend.mock.calls[2][0].children[0]?.paragraph?.rich_text?.[0]?.text?.content ?? "";
    expect(firstOfChunk1).toBe("BLOCK-000");
    expect(firstOfChunk2).toBe("BLOCK-100");
    expect(firstOfChunk3).toBe("BLOCK-200");
  });
});

// ══════════════════════════════════════════════════════════
// JSON APPEND
// ══════════════════════════════════════════════════════════

describe("handleAppend — block json", () => {
  it("start: calls blocks.children.append with position type start", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "json", json: BLOCK_JSON_VALID }, position: { type: "start" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.position).toEqual({ type: "start" });
  });

  it("end: calls blocks.children.append with position type end", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "json", json: BLOCK_JSON_VALID }, position: { type: "end" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.position).toEqual({ type: "end" });
  });

  it("after_block: calls blocks.children.append with correct ContentPositionSchema", async () => {
    await handleAppend(
      { blockId: "block1", content: { mode: "json", json: BLOCK_JSON_VALID }, position: { type: "after_block", afterBlockId: "anchor1" } },
      FAKE_CONFIG,
    );
    expect(mockBlocksAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockBlocksAppend.mock.calls[0][0];
    expect(callArgs.position).toEqual({ type: "after_block", after_block: { id: "anchor1" } });
  });

  it("after_block missing afterBlockId: rejects with clear error", async () => {
    await expect(
      handleAppend(
        { blockId: "block1", content: { mode: "json", json: BLOCK_JSON_VALID }, position: { type: "after_block" } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("after_block positioning requires an afterBlockId");
    expect(mockBlocksAppend).not.toHaveBeenCalled();
  });

  it("malformed JSON: gives contextual error for Add Content", async () => {
    await expect(
      handleAppend(
        { blockId: "block1", content: { mode: "json", json: "not valid json" }, position: { type: "end" } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("Invalid Notion Block JSON for Add Content");
    expect(mockBlocksAppend).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// RETRIEVE MARKDOWN
// ══════════════════════════════════════════════════════════

describe("handleRetrieve — markdown", () => {
  it("calls pages.retrieveMarkdown with page_id", async () => {
    const result = await handleRetrieve(
      { pageId: "page1", retrieveFormat: "markdown", includeProperties: false },
      FAKE_CONFIG,
    );
    expect(mockPagesRetrieveMarkdown).toHaveBeenCalledTimes(1);
    expect(mockPagesRetrieveMarkdown).toHaveBeenCalledWith({ page_id: "page1" });
    expect(result.data.content).toBe("# md");
    expect(result.data.contentFormat).toBe("markdown");
  });
});

// ══════════════════════════════════════════════════════════
// CREATE >100 BLOCKS
// ══════════════════════════════════════════════════════════

describe("handleCreate — >100 block rejection", () => {
  function makeBlocks(n: number): VisualBlock[] {
    return Array.from({ length: n }, (_, i) => ({
      id: `b${i}`,
      type: "paragraph" as const,
      richText: [{ id: `r${i}`, text: `block-${i}` }],
    }));
  }

  it("visual with 101 blocks: rejects before pages.create", async () => {
    const blocks = makeBlocks(101);
    await expect(
      handleCreate(
        { parentId: "ds1", parentType: "data_source_id", properties: {}, content: { mode: "visual", blocks } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("at most 100 top-level block children");
    expect(mockPagesCreate).not.toHaveBeenCalled();
  });

  it("visual with 100 blocks: proceeds to pages.create", async () => {
    const blocks = makeBlocks(100);
    await handleCreate(
      { parentId: "ds1", parentType: "data_source_id", properties: {}, content: { mode: "visual", blocks } },
      FAKE_CONFIG,
    );
    expect(mockPagesCreate).toHaveBeenCalledTimes(1);
  });

  it("json with 101 blocks: rejects before pages.create", async () => {
    const blocks101 = JSON.stringify(makeBlocks(101));
    await expect(
      handleCreate(
        { parentId: "ds1", parentType: "data_source_id", properties: {}, content: { mode: "json", json: blocks101 } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("at most 100 top-level block children");
    expect(mockPagesCreate).not.toHaveBeenCalled();
  });

  it("json malformed input gives contextual error for Create Page", async () => {
    await expect(
      handleCreate(
        { parentId: "ds1", parentType: "data_source_id", properties: {}, content: { mode: "json", json: "broken" } },
        FAKE_CONFIG,
      ),
    ).rejects.toThrow("Invalid Notion Block JSON for Create Page");
    expect(mockPagesCreate).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════
// maxItems BOUNDARIES
// ══════════════════════════════════════════════════════════

describe("schema — maxItems boundaries", () => {
  const base = {
    action: "query" as const,
    dataSourceId: "ds1",
  };

  function parseMaxItems(value: unknown) {
    return partialNotionSchema.parse({ ...base, maxItems: value });
  }

  it("maxItems -1: rejected", () => {
    expect(() => parseMaxItems(-1)).toThrow();
  });

  it("maxItems 0: rejected", () => {
    expect(() => parseMaxItems(0)).toThrow();
  });

  it("maxItems 1: accepted", () => {
    const result = parseMaxItems(1);
    expect(result.maxItems).toBe(1);
  });

  it("maxItems 10000: accepted", () => {
    const result = parseMaxItems(10000);
    expect(result.maxItems).toBe(10000);
  });

  it("maxItems 10001: rejected", () => {
    expect(() => parseMaxItems(10001)).toThrow();
  });
});
