import type { VisualBlock } from "./types";

function cloneRichTextIds(block: VisualBlock): VisualBlock {
  return {
    ...block,
    richText: block.richText.map((rt) => ({
      ...rt,
      id: crypto.randomUUID(),
    })),
  };
}

export function cloneVisualBlockWithFreshIds(block: VisualBlock): VisualBlock {
  const fresh: VisualBlock = {
    ...block,
    id: crypto.randomUUID(),
    richText: block.richText.map((rt) => ({
      ...rt,
      id: crypto.randomUUID(),
    })),
  };

  if (block.children && block.children.length > 0) {
    fresh.children = block.children.map((child) =>
      cloneVisualBlockWithFreshIds(child),
    );
  }

  return fresh;
}
