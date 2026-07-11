import { z } from "zod";

const visualRichTextSchema = z.object({
  id: z.string(),
  text: z.string(),
  annotations: z
    .object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      strikethrough: z.boolean().optional(),
      underline: z.boolean().optional(),
      code: z.boolean().optional(),
    })
    .optional(),
  link: z.string().optional(),
});

const visualBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.enum([
      "paragraph",
      "heading_1",
      "heading_2",
      "heading_3",
      "bulleted_list_item",
      "numbered_list_item",
      "to_do",
      "quote",
      "toggle",
      "divider",
      "code",
      "callout",
    ]),
    richText: z.array(visualRichTextSchema),
    checked: z.boolean().optional(),
    language: z.string().optional(),
    icon: z.string().optional(),
    children: z.array(visualBlockSchema).optional(),
  }),
);

const visualContentSchema = z.object({
  mode: z.literal("visual"),
  blocks: z.array(visualBlockSchema),
});

const markdownContentSchema = z.object({
  mode: z.literal("markdown"),
  markdown: z.string(),
});

const jsonContentSchema = z.object({
  mode: z.literal("json"),
  json: z.string(),
});

export const notionContentSchema = z.discriminatedUnion("mode", [
  visualContentSchema,
  markdownContentSchema,
  jsonContentSchema,
]);

export const contentPositionSchema = z.object({
  type: z.enum(["start", "end", "after_block"]),
  afterBlockId: z.string().optional(),
});

export const partialNotionSchema = z.object({
  action: z
    .enum(["query", "create", "update", "retrieve", "append"])
    .optional(),

  dataSourceId: z.string().optional(),
  pageId: z.string().optional(),
  blockId: z.string().optional(),

  parentId: z.string().optional(),
  parentType: z.enum(["data_source_id", "page_id"]).optional(),

  properties: z.any().optional(),
  content: notionContentSchema.optional(),

  filter: z.any().optional(),
  sorts: z.any().optional(),

  pageSize: z.number().min(1).max(100).optional(),
  startCursor: z.string().optional(),
  returnAll: z.boolean().optional(),
  maxItems: z.number().max(10000).optional(),

  position: contentPositionSchema.optional(),

  retrieveFormat: z.enum(["metadata", "markdown", "blocks"]).optional(),
  includeProperties: z.boolean().optional(),
});
