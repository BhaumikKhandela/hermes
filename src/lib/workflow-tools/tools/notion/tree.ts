import type { VisualBlock } from "./types";
import { blockRegistry } from "./registry";
import { cloneVisualBlockWithFreshIds } from "./cloneBlock";

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

  const clone = cloneVisualBlockWithFreshIds(source.block);

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

  const prevDef = blockRegistry[prevBlock.type];
  if (!prevDef || prevDef.canHaveChildren !== true) return blocks;

  const [removed] = source.parent.splice(source.index, 1);

  if (!prevBlock.children) {
    prevBlock.children = [];
  }
  prevBlock.children.push(removed);

  return [...blocks];
}

function findParentBlock(
  blocks: VisualBlock[],
  targetChildren: VisualBlock[],
): { block: VisualBlock; parent: VisualBlock[]; index: number } | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].children === targetChildren) {
      return { block: blocks[i], parent: blocks, index: i };
    }
    const children = blocks[i].children;
    if (children && children.length > 0) {
      const found = findParentBlock(children, targetChildren);
      if (found) return found;
    }
  }
  return null;
}

export function outdentBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  const source = findBlockById(blocks, blockId);
  if (!source) return blocks;

  if (source.parent === blocks) return blocks;

  const parentBlock = findParentBlock(blocks, source.parent);
  if (!parentBlock) return blocks;

  const [removed] = source.parent.splice(source.index, 1);
  parentBlock.parent.splice(parentBlock.index + 1, 0, removed);

  return [...blocks];
}
