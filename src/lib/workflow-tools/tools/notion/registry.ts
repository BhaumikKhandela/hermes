import type { BlockDefinition, VisualBlock, VisualRichText } from "./types";

function richText(text: string, annotations?: VisualRichText["annotations"]): VisualRichText[] {
  return [{ id: crypto.randomUUID(), text, annotations }];
}

export const blockRegistry: Record<string, BlockDefinition> = {
  paragraph: {
    type: "paragraph",
    label: "Paragraph",
    icon: "Type",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "paragraph",
      richText: richText(""),
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: block.richText.map(richTextToNotion),
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  heading_1: {
    type: "heading_1",
    label: "Heading 1",
    icon: "Heading1",
    canHaveChildren: false,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "heading_1",
      richText: richText(""),
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: block.richText.map(richTextToNotion),
      },
    }),
  },

  heading_2: {
    type: "heading_2",
    label: "Heading 2",
    icon: "Heading2",
    canHaveChildren: false,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "heading_2",
      richText: richText(""),
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: block.richText.map(richTextToNotion),
      },
    }),
  },

  heading_3: {
    type: "heading_3",
    label: "Heading 3",
    icon: "Heading3",
    canHaveChildren: false,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "heading_3",
      richText: richText(""),
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: block.richText.map(richTextToNotion),
      },
    }),
  },

  bulleted_list_item: {
    type: "bulleted_list_item",
    label: "Bulleted List",
    icon: "List",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "bulleted_list_item",
      richText: richText(""),
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: block.richText.map(richTextToNotion),
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  numbered_list_item: {
    type: "numbered_list_item",
    label: "Numbered List",
    icon: "ListOrdered",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "numbered_list_item",
      richText: richText(""),
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "numbered_list_item",
      numbered_list_item: {
        rich_text: block.richText.map(richTextToNotion),
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  to_do: {
    type: "to_do",
    label: "To-do",
    icon: "CheckSquare",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "to_do",
      richText: richText(""),
      checked: false,
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "to_do",
      to_do: {
        rich_text: block.richText.map(richTextToNotion),
        checked: block.checked ?? false,
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  quote: {
    type: "quote",
    label: "Quote",
    icon: "Quote",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "quote",
      richText: richText(""),
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "quote",
      quote: {
        rich_text: block.richText.map(richTextToNotion),
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  toggle: {
    type: "toggle",
    label: "Toggle",
    icon: "ChevronRight",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "toggle",
      richText: richText(""),
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "toggle",
      toggle: {
        rich_text: block.richText.map(richTextToNotion),
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },

  divider: {
    type: "divider",
    label: "Divider",
    icon: "Minus",
    canHaveChildren: false,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "divider",
      richText: [],
    }),
    toNotionBlock: () => ({
      object: "block",
      type: "divider",
      divider: {},
    }),
  },

  code: {
    type: "code",
    label: "Code",
    icon: "Code",
    canHaveChildren: false,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "code",
      richText: richText(""),
      language: "plain text",
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "code",
      code: {
        rich_text: block.richText.map(richTextToNotion),
        language: block.language || "plain text",
      },
    }),
  },

  callout: {
    type: "callout",
    label: "Callout",
    icon: "FileText",
    canHaveChildren: true,
    createDefault: () => ({
      id: crypto.randomUUID(),
      type: "callout",
      richText: richText(""),
      icon: "💡",
      children: [],
    }),
    toNotionBlock: (block) => ({
      object: "block",
      type: "callout",
      callout: {
        rich_text: block.richText.map(richTextToNotion),
        icon: block.icon ? { emoji: block.icon } : undefined,
        children: block.children?.map((c) => blockRegistry[c.type]?.toNotionBlock(c)).filter(Boolean),
      },
    }),
  },
};

function richTextToNotion(rt: VisualRichText): Record<string, any> {
  const result: Record<string, any> = {
    type: "text",
    text: { content: rt.text },
  };
  if (rt.link) {
    result.text.link = { url: rt.link };
  }
  const hasAnnotations = rt.annotations && Object.values(rt.annotations).some(Boolean);
  if (hasAnnotations) {
    result.annotations = {};
    if (rt.annotations?.bold) result.annotations.bold = true;
    if (rt.annotations?.italic) result.annotations.italic = true;
    if (rt.annotations?.strikethrough) result.annotations.strikethrough = true;
    if (rt.annotations?.underline) result.annotations.underline = true;
    if (rt.annotations?.code) result.annotations.code = true;
  }
  return result;
}
