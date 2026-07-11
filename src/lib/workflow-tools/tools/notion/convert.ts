import type { VisualBlock, VisualRichText, ConversionResult } from "./types";
import { blockRegistry } from "./registry";

export function visualBlocksToNotionJson(blocks: VisualBlock[]): Record<string, any>[] {
  return blocks.map((block) => {
    const def = blockRegistry[block.type];
    if (!def) {
      return {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: block.richText.map(richTextToNotion),
        },
      };
    }
    return def.toNotionBlock(block);
  });
}

export function tryConvertNotionJsonToVisual(json: string): ConversionResult {
  let parsed: any[];
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, unsupportedFeatures: ["Invalid JSON"], partialBlocks: [] };
  }

  if (!Array.isArray(parsed)) {
    return { success: false, unsupportedFeatures: ["Expected an array of blocks"], partialBlocks: [] };
  }

  const unsupportedFeatures: string[] = [];
  const blocks: VisualBlock[] = [];

  for (const item of parsed) {
    const block = parseNotionBlock(item, unsupportedFeatures);
    if (block) blocks.push(block);
  }

  if (unsupportedFeatures.length > 0) {
    return { success: false, unsupportedFeatures: [...new Set(unsupportedFeatures)], partialBlocks: blocks };
  }

  return { success: true, blocks };
}

function parseNotionBlock(item: any, unsupported: string[]): VisualBlock | null {
  if (!item || typeof item !== "object" || !item.type) {
    unsupported.push("Malformed block object");
    return null;
  }

  const { type } = item;
  const blockData = item[type];

  if (!blockData || typeof blockData !== "object") {
    unsupported.push(`Block type "${type}" missing its data object`);
    return null;
  }

  const supportedTypes = new Set([
    "paragraph", "heading_1", "heading_2", "heading_3",
    "bulleted_list_item", "numbered_list_item", "to_do",
    "quote", "toggle", "divider", "code", "callout",
  ]);

  if (!supportedTypes.has(type)) {
    unsupported.push(`"${type}" block`);
    return null;
  }

  if (type === "divider") {
    return {
      id: crypto.randomUUID(),
      type: "divider",
      richText: [],
    };
  }

  const richText: VisualRichText[] = (blockData.rich_text || []).map((rt: any, i: number) =>
    parseRichText(rt, i, unsupported),
  );

  const block: VisualBlock = {
    id: crypto.randomUUID(),
    type: type as VisualBlock["type"],
    richText,
  };

  if (type === "to_do" && typeof blockData.checked === "boolean") {
    block.checked = blockData.checked;
  }

  if (type === "code" && blockData.language) {
    block.language = blockData.language;
  }

  if (type === "callout" && blockData.icon?.emoji) {
    block.icon = blockData.icon.emoji;
  }

  if (blockData.children && Array.isArray(blockData.children) && blockData.children.length > 0) {
    const nestedUnsupported: string[] = [];
    block.children = blockData.children
      .map((c: any) => parseNotionBlock(c, nestedUnsupported))
      .filter(Boolean);
    if (nestedUnsupported.length > 0) {
      unsupported.push(
        ...nestedUnsupported.map((f) => `nested ${f}`),
      );
    }
  }

  return block;
}

function parseRichText(rt: any, index: number, unsupported: string[]): VisualRichText {
  if (!rt || typeof rt !== "object") {
    return { id: `${index}`, text: "" };
  }

  if (rt.type !== "text") {
    unsupported.push(`"${rt.type}" rich text`);
    return { id: `${index}`, text: rt.plain_text || "" };
  }

  const result: VisualRichText = {
    id: `${index}`,
    text: rt.text?.content || rt.plain_text || "",
  };

  if (rt.text?.link?.url) {
    result.link = rt.text.link.url;
  }

  if (rt.annotations) {
    const ann: VisualRichText["annotations"] = {};
    if (rt.annotations.bold) ann.bold = true;
    if (rt.annotations.italic) ann.italic = true;
    if (rt.annotations.strikethrough) ann.strikethrough = true;
    if (rt.annotations.underline) ann.underline = true;
    if (rt.annotations.code) ann.code = true;
    if (Object.values(ann).some(Boolean)) {
      result.annotations = ann;
    }
  }

  return result;
}

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

export function visualBlocksToMarkdown(blocks: VisualBlock[]): string {
  return blocks.map((b) => blockToMarkdown(b, 0)).join("\n\n");
}

function childrenToMarkdown(children: VisualBlock[], depth: number, prefix: string): string {
  return children
    .map((c) => `${prefix}${blockToMarkdown(c, depth + 1)}`)
    .join("\n");
}

function blockToMarkdown(block: VisualBlock, depth: number = 0): string {
  const text = block.richText.map((rt) => {
    let t = rt.text;
    if (rt.annotations?.bold) t = `**${t}**`;
    if (rt.annotations?.italic) t = `*${t}*`;
    if (rt.annotations?.code) t = `\`${t}\``;
    if (rt.annotations?.strikethrough) t = `~~${t}~~`;
    if (rt.link) t = `[${t}](${rt.link})`;
    return t;
  }).join("");
  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  const children = block.children || [];

  switch (block.type) {
    case "heading_1": return `# ${text}`;
    case "heading_2": return `## ${text}`;
    case "heading_3": return `### ${text}`;
    case "bulleted_list_item":
      return children.length > 0
        ? `- ${text}\n${childrenToMarkdown(children, depth, `${childIndent}- `)}`
        : `- ${text}`;
    case "numbered_list_item":
      return children.length > 0
        ? `1. ${text}\n${childrenToMarkdown(children, depth, `${childIndent}1. `)}`
        : `1. ${text}`;
    case "to_do":
      return children.length > 0
        ? `- [${block.checked ? "x" : " "}] ${text}\n${children.map((c) => `${childIndent}${blockToMarkdown(c, depth + 1)}`).join("\n")}`
        : `- [${block.checked ? "x" : " "}] ${text}`;
    case "quote":
      return children.length > 0
        ? `> ${text}\n${children.map((c) => `> ${blockToMarkdown(c, depth + 1)}`).join("\n")}`
        : `> ${text}`;
    case "code": return `\`\`\`${block.language || ""}\n${block.richText.map(r => r.text).join("")}\n\`\`\``;
    case "divider": return "---";
    case "toggle": return `<details><summary>${text}</summary>\n\n${(block.children || []).map((c) => blockToMarkdown(c, depth + 1)).join("\n\n")}\n</details>`;
    case "callout":
      return children.length > 0
        ? `${block.icon || "💡"} ${text}\n${children.map((c) => `${childIndent}${blockToMarkdown(c, depth + 1)}`).join("\n")}`
        : `${block.icon || "💡"} ${text}`;
    case "paragraph":
      return children.length > 0
        ? `${text}\n${children.map((c) => `${childIndent}${blockToMarkdown(c, depth + 1)}`).join("\n")}`
        : text;
    default: return text;
  }
}
