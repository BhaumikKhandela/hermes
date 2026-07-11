"use client";

import { useState, useCallback, useRef } from "react";
import type { VisualBlock, VisualBlockType } from "@/lib/workflow-tools/tools/notion/types";
import { blockRegistry } from "@/lib/workflow-tools/tools/notion/registry";
import { moveBlock, duplicateBlock, deleteBlock } from "@/lib/workflow-tools/tools/notion/tree";
import { BlockCard } from "./BlockCard";
import { ChevronDown, Plus } from "lucide-react";

type Props = {
  blocks: VisualBlock[];
  onChange: (blocks: VisualBlock[]) => void;
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

export function VisualBlockEditor({ blocks, onChange }: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const doMoveBlock = useCallback((index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }, [blocks, onChange]);

  const doDuplicate = useCallback((index: number) => {
    const clone: VisualBlock = JSON.parse(JSON.stringify(blocks[index]));
    clone.id = crypto.randomUUID();
    const next = [...blocks];
    next.splice(index + 1, 0, clone);
    onChange(next);
  }, [blocks, onChange]);

  const doDelete = useCallback((index: number) => {
    const next = [...blocks];
    next.splice(index, 1);
    onChange(next);
  }, [blocks, onChange]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const next = [...blocks];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);
    onChange(next);
    setDragIndex(null);
  }, [blocks, onChange]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#6B7280] mb-1">
        Drag blocks to reorder. Use the ⋮ menu for more actions.
      </p>

      {blocks.length === 0 && (
        <div className="text-xs text-[#9CA3AF] text-center py-4 bg-[#F8F9FC] rounded-lg border border-dashed border-[#E7E7E7]">
          No blocks yet. Add a block below.
        </div>
      )}

      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          onUpdate={(updated) => updateBlock(i, updated)}
          onDelete={() => doDelete(i)}
          onMoveUp={() => doMoveBlock(i, "up")}
          onMoveDown={() => doMoveBlock(i, "down")}
          onDuplicate={() => doDuplicate(i)}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, i)}
          isFirst={i === 0}
          isLast={i === blocks.length - 1}
        />
      ))}

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
  );
}
