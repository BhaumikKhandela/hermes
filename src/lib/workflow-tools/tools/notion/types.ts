export type VisualRichText = {
  id: string;
  text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  link?: string;
};

export type VisualBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do"
  | "quote"
  | "toggle"
  | "divider"
  | "code"
  | "callout";

export type VisualBlock = {
  id: string;
  type: VisualBlockType;
  richText: VisualRichText[];
  checked?: boolean;
  language?: string;
  icon?: string;
  children?: VisualBlock[];
};

export type VisualContent = {
  mode: "visual";
  blocks: VisualBlock[];
};

export type MarkdownContent = {
  mode: "markdown";
  markdown: string;
};

export type JsonContent = {
  mode: "json";
  json: string;
};

export type NotionContent = VisualContent | MarkdownContent | JsonContent;

export type ContentPosition = {
  type: "start" | "end" | "after_block";
  afterBlockId?: string;
};

export type BlockDefinition = {
  type: VisualBlockType;
  label: string;
  icon: string;
  createDefault: () => VisualBlock;
  toNotionBlock: (block: VisualBlock) => Record<string, any>;
};

export type NotionActionResult<T extends string, D> = {
  action: T;
  data: D;
};

export type QueryResult = NotionActionResult<"query", {
  pages: unknown[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
}>;

export type CreateResult = NotionActionResult<"create", {
  page: unknown;
  pageId: string;
  url: string;
}>;

export type UpdateResult = NotionActionResult<"update", {
  page: unknown;
  pageId: string;
}>;

export type RetrieveResult = NotionActionResult<"retrieve", {
  page?: unknown;
  content?: unknown;
  contentFormat?: "markdown" | "blocks";
}>;

export type AppendResult = NotionActionResult<"append", {
  targetBlockId: string;
  appendedBlockCount?: number;
}>;

export type NotionToolResult = QueryResult | CreateResult | UpdateResult | RetrieveResult | AppendResult;

export type ConversionResult =
  | { success: true; blocks: VisualBlock[] }
  | { success: false; unsupportedFeatures: string[] };
