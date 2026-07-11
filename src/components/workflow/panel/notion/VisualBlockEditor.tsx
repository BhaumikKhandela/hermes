"use client";

import { useState, useCallback, useRef, createContext, useContext } from "react";
import type { VisualBlock, VisualBlockType, BlockDragPayload } from "@/lib/workflow-tools/tools/notion/types";
import { blockRegistry } from "@/lib/workflow-tools/tools/notion/registry";
import { indentBlock, outdentBlock } from "@/lib/workflow-tools/tools/notion/tree";
import { BlockCard } from "./BlockCard";
import { ChevronDown, Plus } from "lucide-react";

type TreeContextType = {
  indentBlock: (blockId: string) => void;
  outdentBlock: (blockId: string) => void;
};

const TreeContext = createContext<TreeContextType | null>(null);

type Props = {
  blocks: VisualBlock[];
  onChange: (blocks: VisualBlock[]) => void;
  parentId?: string | null;
};

const BLOCK_TYPE_OPTIONS: { type: VisualBlockType; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading_1", label: "Heading 1" },
  { type: "heading_2", label: "Heading 2" },
  { type: "heading_3", label: "Heading 3" },
  { type: "bulleted_list_item", label: "Bulleted List" },
  { type: "numbered_list_item", label: "Numbered List" },
  { type: "to_do", label: "To-do" },
  { type: "quote", label: "Quote" },
  { type: "toggle", label: "Toggle" },
  { type: "divider", label: "Divider" },
  { type: "code", label: "Code" },
  { type: "callout", label: "Callout" },
];

export function VisualBlockEditor({ blocks, onChange, parentId = null }: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const treeApi = useContext(TreeContext);

  const handleAddBlock = useCallback((type: VisualBlockType) => {
    const def = blockRegistry[type];
    if (!def) return;
    const newBlock = def.createDefault();
    onChange([...blocks, newBlock]);
    setShowAddMenu(false);
  }, [blocks, onChange]);

  const updateBlock = useCallback((index: number, updated: VisualBlock) => {
    const next = [...blocks];
    next[index] = updated;
    onChange(next);
  }, [blocks, onChange]);

  const doDeleteBlock = useCallback((index: number) => {
    const next = [...blocks];
    next.splice(index, 1);
    onChange(next);
  }, [blocks, onChange]);

  const doDuplicateBlock = useCallback((index: number) => {
    const clone: VisualBlock = JSON.parse(JSON.stringify(blocks[index]));
    clone.id = crypto.randomUUID();
    const next = [...blocks];
    next.splice(index + 1, 0, clone);
    onChange(next);
  }, [blocks, onChange]);

  const doMoveBlock = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }, [blocks, onChange]);

  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    const payload: BlockDragPayload = { blockId, parentId };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-notion-block", JSON.stringify(payload));
  }, [parentId]);

  const handleDropAtPosition = useCallback((e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/x-notion-block");
    if (!raw) return;
    const payload: BlockDragPayload = JSON.parse(raw);
    if (payload.parentId !== parentId) return;
    if (payload.blockId === targetBlockId) return;
    const next = [...blocks];
    const sourceIndex = next.findIndex((b) => b.id === payload.blockId);
    if (sourceIndex === -1) return;
    const targetIndex = next.findIndex((b) => b.id === targetBlockId);
    if (targetIndex === -1) return;
    const [removed] = next.splice(sourceIndex, 1);
    const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(adjustedTarget, 0, removed);
    onChange(next);
  }, [blocks, onChange, parentId]);

  const handleDropAtEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData("application/x-notion-block");
    if (!raw) return;
    const payload: BlockDragPayload = JSON.parse(raw);
    if (payload.parentId !== parentId) return;
    const next = [...blocks];
    const sourceIndex = next.findIndex((b) => b.id === payload.blockId);
    if (sourceIndex === -1) return;
    const [removed] = next.splice(sourceIndex, 1);
    next.push(removed);
    onChange(next);
  }, [blocks, onChange, parentId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleIndent = useCallback((blockId: string) => {
    if (treeApi) {
      treeApi.indentBlock(blockId);
    } else {
      onChange(indentBlock(blocks, blockId));
    }
  }, [treeApi, blocks, onChange]);

  const handleOutdent = useCallback((blockId: string) => {
    if (treeApi) {
      treeApi.outdentBlock(blockId);
    } else {
      onChange(outdentBlock(blocks, blockId));
    }
  }, [treeApi, blocks, onChange]);

  return (
    <TreeContext.Provider
      value={{
        indentBlock: (blockId) => {
          // propagate up to root
          if (treeApi) {
            treeApi.indentBlock(blockId);
          } else {
            onChange(indentBlock(blocks, blockId));
          }
        },
        outdentBlock: (blockId) => {
          if (treeApi) {
            treeApi.outdentBlock(blockId);
          } else {
            onChange(outdentBlock(blocks, blockId));
          }
        },
      }}
    >
      <div className="space-y-2">
        <p className="text-xs text-[#6B7280] mb-1">
          Drag blocks to reorder. Use the ⋮ menu for more actions.
        </p>

        {blocks.length === 0 && (
          <div className="text-xs text-[#9CA3AF] text-center py-4 bg-[#F8F9FC] rounded-lg border border-dashed border-[#E7E7E7]">
            No blocks yet. Add a block below.
          </div>
        )}

        {/* Drop zone at the very top (before first block) */}
        {blocks.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropAtPosition(e, blocks[0].id)}
            className="h-2 -mb-1 rounded transition-colors hover:bg-[#E8E8FF]/40"
          />
        )}

        {blocks.map((block, i) => (
          <div key={block.id}>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropAtPosition(e, block.id)}
            >
              <BlockCard
                block={block}
                onUpdate={(updated) => updateBlock(i, updated)}
                onDelete={() => doDeleteBlock(i)}
                onMoveUp={() => doMoveBlock(i, "up")}
                onMoveDown={() => doMoveBlock(i, "down")}
                onDuplicate={() => doDuplicateBlock(i)}
                onIndent={() => handleIndent(block.id)}
                onOutdent={() => handleOutdent(block.id)}
                onDragStart={(e) => handleDragStart(e, block.id)}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
              />
            </div>

            {/* Recursive children editor */}
            {block.children && block.children.length > 0 && (
              <div className="ml-6 mt-1 mb-1 border-l-2 border-[#E7E7E7] pl-3">
                <VisualBlockEditor
                  blocks={block.children}
                  parentId={block.id}
                  onChange={(newChildren) => {
                    const next = [...blocks];
                    next[i] = { ...next[i], children: newChildren };
                    onChange(next);
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {/* End-of-list drop zone */}
        {blocks.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropAtEnd}
            className="h-2 -mt-1 rounded transition-colors hover:bg-[#E8E8FF]/40"
          />
        )}

        {/* Add Block button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#F8F9FC] text-[#6B7280] border border-dashed border-[#D1D5DB] hover:border-[#5B5CEB] hover:text-[#5B5CEB] transition-colors duration-150"
          >
            <Plus size={14} />
            Add Block
            <ChevronDown size={12} className={`transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
          </button>

          {showAddMenu && (
            <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-[#E7E7E7] rounded-lg shadow-lg p-1 max-h-[240px] overflow-y-auto">
              {BLOCK_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleAddBlock(opt.type)}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </TreeContext.Provider>
  );
}
