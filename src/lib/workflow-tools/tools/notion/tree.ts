import type { VisualBlock } from "./types";

export function findBlockById(
  blocks: VisualBlock[],
  id: string,
): { block: VisualBlock; parent: VisualBlock[]; index: number } | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) {
      return { block: blocks[i], parent: blocks, index: i };
    }
    if (blocks[i].children && blocks[i].children!.length > 0) {
      const found = findBlockById(blocks[i].children!, id);
      if (found) return found;
    }
  }
  return null;
}

export function moveBlock(
  blocks: VisualBlock[],
  blockId: string,
  targetParentId: string | null,
  targetIndex: number,
): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source) return blocks;

  const [removed] = source.parent.splice(source.index, 1);

  if (targetParentId === null) {
    blocks.splice(targetIndex, 0, removed);
    return [...blocks];
  }

  const target = findBlockById(blocks, targetParentId);
  if (!target || !target.block.children) {
    blocks.splice(targetIndex, 0, removed);
    return [...blocks];
  }

  target.block.children.splice(targetIndex, 0, removed);
  return [...blocks];
}

export function duplicateBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source) return blocks;

  const clone: VisualBlock = JSON.parse(JSON.stringify(source.block));
  clone.id = crypto.randomUUID();

  source.parent.splice(source.index + 1, 0, clone);
  return [...blocks];
}

export function deleteBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source) return blocks;

  source.parent.splice(source.index, 1);
  return [...blocks];
}

export function indentBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source || source.index === 0) return blocks;

  const prevBlock = source.parent[source.index - 1];
  if (!prevBlock) return blocks;

  const [removed] = source.parent.splice(source.index, 1);

  if (!prevBlock.children) {
    prevBlock.children = [];
  }
  prevBlock.children.push(removed);

  return [...blocks];
}

export function outdentBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source) return blocks;

  const parent = findBlockById(blocks, source.parent === blocks ? "" : "");
  if (!parent || parent.parent === blocks) return blocks;

  const [removed] = source.parent.splice(source.index, 1);
  parent.parent.splice(parent.index + 1, 0, removed);

  return [...blocks];
}
