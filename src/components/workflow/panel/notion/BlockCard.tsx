"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VisualBlock } from "@/lib/workflow-tools/tools/notion/types";
import { blockRegistry } from "@/lib/workflow-tools/tools/notion/registry";
import { GripVertical, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Copy, Trash2 } from "lucide-react";

type Props = {
  block: VisualBlock;
  onUpdate: (block: VisualBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isFirst: boolean;
  isLast: boolean;
  canIndent?: boolean;
};

const CODE_LANGUAGES = [
  "plain text", "javascript", "typescript", "python", "html", "css",
  "json", "sql", "bash", "go", "rust", "java", "cpp", "ruby", "php",
  "yaml", "markdown", "graphql", "dockerfile",
].sort();

export function BlockCard({
  block, onUpdate, onDelete, onMoveUp, onMoveDown, onDuplicate,
  onIndent, onOutdent, onDragStart, isFirst, isLast, canIndent = false,
}: Props) {
  const def = blockRegistry[block.type];
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const updateRichText = useCallback((index: number, text: string) => {
    const newRt = [...block.richText];
    newRt[index] = { ...newRt[index], text };
    onUpdate({ ...block, richText: newRt });
  }, [block, onUpdate]);

  const toggleAnnotation = useCallback((ann: "bold" | "italic" | "strikethrough" | "underline" | "code") => {
    const newRt = block.richText.map((rt) => ({
      ...rt,
      annotations: { ...(rt.annotations || {}), [ann]: !rt.annotations?.[ann] },
    }));
    onUpdate({ ...block, richText: newRt });
  }, [block, onUpdate]);

  const isAnnotationActive = (ann: "bold" | "italic" | "strikethrough" | "underline" | "code") =>
    block.richText.some((rt) => rt.annotations?.[ann]);

  const typeIcon = def?.icon || "Type";

  return (
    <div
      className="group flex gap-2 items-start"
      draggable
      onDragStart={onDragStart}
    >
      {/* Drag handle + Menu */}
      <div className="relative flex flex-col items-center pt-1">
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-[#F0F0F0] opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical size={14} className="text-[#9CA3AF]" />
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-0.5 rounded hover:bg-[#F0F0F0] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          title="More actions"
        >
          <span className="text-[#9CA3AF] text-xs font-bold leading-none">⋮</span>
        </button>

        {showMenu && (
          <div
            ref={menuRef}
            className="absolute left-6 top-0 z-10 bg-white border border-[#E7E7E7] rounded-lg shadow-lg p-1 min-w-[120px]"
          >
            <button
              disabled={isFirst}
              onClick={() => { onMoveUp(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded disabled:opacity-30"
            >
              <ChevronUp size={12} /> Move up
            </button>
            <button
              disabled={isLast}
              onClick={() => { onMoveDown(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded disabled:opacity-30"
            >
              <ChevronDown size={12} /> Move down
            </button>
            <button
              onClick={() => { onDuplicate(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded"
            >
              <Copy size={12} /> Duplicate
            </button>
            {onOutdent && (
              <button
                onClick={() => { onOutdent(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded"
              >
                <ChevronLeft size={12} /> Outdent
              </button>
            )}
            {onIndent && (
              <button
                disabled={!canIndent}
                onClick={() => { if (canIndent) { onIndent(); setShowMenu(false); } }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-[#111827] hover:bg-[#F5F5FF] rounded disabled:opacity-30"
              >
                <ChevronRight size={12} /> Indent
              </button>
            )}
            <div className="border-t border-[#E7E7E7] my-0.5" />
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Block content */}
      <div className="flex-1 rounded-lg border border-[#E7E7E7] bg-white overflow-hidden">
        {/* Block type badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F8F9FC] border-b border-[#E7E7E7]">
          <span className="text-[10px] font-medium text-[#6B7280]">{def?.label || block.type}</span>
        </div>

        <div className="p-2 space-y-1.5">
          {/* Rich text fields */}
          {block.type !== "divider" && (
            <div className="space-y-1">
              {block.richText.map((rt, i) => (
                <div key={rt.id}>
                  <input
                    type="text"
                    value={rt.text}
                    onChange={(e) => updateRichText(i, e.target.value)}
                    placeholder={block.type === "code" ? "Enter code..." : "Enter text..."}
                    className="w-full rounded-md border border-[#E7E7E7] bg-[#F8F9FC] px-2 py-1.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Annotation toolbar (for non-code, non-divider blocks) */}
          {block.type !== "code" && block.type !== "divider" && block.richText.length > 0 && (
            <div className="flex gap-1">
              {(["bold", "italic", "underline", "code", "strikethrough"] as const).map((ann) => (
                <button
                  key={ann}
                  onClick={() => toggleAnnotation(ann)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    isAnnotationActive(ann)
                      ? "bg-[#5B5CEB] text-white"
                      : "bg-[#F0F0F0] text-[#6B7280] hover:bg-[#E0E0E0]"
                  }`}
                  title={ann}
                >
                  {ann === "bold" ? "B" : ann === "italic" ? "I" : ann === "underline" ? "U" : ann === "code" ? "<>" : ann === "strikethrough" ? "S" : ann}
                </button>
              ))}
            </div>
          )}

          {/* Type-specific fields */}
          {block.type === "to_do" && (
            <label className="flex items-center gap-2 text-xs text-[#6B7280]">
              <input
                type="checkbox"
                checked={block.checked ?? false}
                onChange={(e) => onUpdate({ ...block, checked: e.target.checked })}
                className="rounded border-[#D1D5DB]"
              />
              Checked
            </label>
          )}

          {block.type === "code" && (
            <select
              value={block.language || "plain text"}
              onChange={(e) => onUpdate({ ...block, language: e.target.value })}
              className="w-full rounded-md border border-[#E7E7E7] bg-[#F8F9FC] px-2 py-1 text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          )}

          {block.type === "callout" && (
            <input
              type="text"
              value={block.icon || "💡"}
              onChange={(e) => onUpdate({ ...block, icon: e.target.value })}
              placeholder="💡"
              className="w-12 rounded-md border border-[#E7E7E7] bg-[#F8F9FC] px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
