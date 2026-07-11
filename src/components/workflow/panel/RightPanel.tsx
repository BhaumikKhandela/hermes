"use client";

import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { addNodeFromPalette } from "@/stores/agentBuilderSlice";
import { toolMetadatas } from "@/lib/workflow-tools/metadata";
import { resolveToolIcon } from "@/lib/workflow-tools/iconMap";
import type { ToolMetadata } from "@/lib/workflow-tools/metadata";
import type { ToolCategory } from "@/lib/workflow-tools/types";
import {
  Bot,
  GitFork,
  Search,
  Star,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai: "AI",
  data: "Data",
  communication: "Communication",
  storage: "Storage",
  integration: "Integration",
  utility: "Utility",
};

const categories: ToolCategory[] = [
  "ai",
  "data",
  "storage",
  "integration",
  "communication",
  "utility",
];

function ToolCard({
  reg,
  onClick,
}: {
  reg: ToolMetadata;
  onClick: () => void;
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/node-registry", reg.nodeRegistry);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-[18px] hover:-translate-y-[2px] transition-all duration-200 ease-out text-left"
    >
      <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
        <Image
          src={resolveToolIcon(reg.nodeRegistry)}
          alt={reg.label}
          width={22}
          height={22}
          className="object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#111827]">
            {reg.label}
          </span>
          {reg.beta && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#F59E0B] font-medium">
              Beta
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#6B7280] truncate mt-0.5 font-normal">
          {reg.description}
        </p>
      </div>
    </button>
  );
}

interface RightPanelProps {
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (val: boolean) => void;
}

const RightPanel = ({
  isRightPanelOpen,
  setIsRightPanelOpen,
}: RightPanelProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(
    null,
  );

  const filteredTools = useMemo(() => {
    let tools = toolMetadatas;

    if (activeCategory) {
      tools = tools.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tools = tools.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.nodeRegistry.toLowerCase().includes(q),
      );
    }

    return tools;
  }, [activeCategory, search]);

  const featuredTools = useMemo(
    () => toolMetadatas.filter((t) => t.featured),
    [],
  );

  const handleAddTool = (nodeRegistry: string) => {
    dispatch(addNodeFromPalette({ nodeRegistry }));
  };

  const handleAddNode = (type: string) => {
    dispatch(addNodeFromPalette({ nodeRegistry: type }));
  };

  return (
    <aside
      className={`relative bg-white border-l border-[#E7E7E7] shrink-0 overflow-hidden transition-all duration-300
      ${isRightPanelOpen ? "w-[380px]" : "w-0 border-none opacity-0"}`}
    >
      <div className="h-full overflow-y-auto px-[28px] py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] uppercase tracking-wider font-bold text-[#6B7280]">Nodes</h3>
        </div>

        {/* Trigger Node */}
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/node-registry", "trigger");
            e.dataTransfer.effectAllowed = "move";
          }}
          onClick={() => handleAddNode("trigger")}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-[18px] hover:-translate-y-[2px] transition-all duration-200 ease-out text-left mb-3"
        >
          <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <Zap size={20} className="text-[#5B5CEB]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#111827]">Trigger</div>
            <div className="text-[13px] text-[#6B7280]">Starts workflow</div>
          </div>
        </button>

        {/* Structural Nodes */}
        <div className="space-y-3 mb-6">
          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/node-registry", "agent");
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => handleAddNode("agent")}
            className="w-full flex items-center gap-3 bg-white rounded-2xl p-[18px] hover:-translate-y-[2px] transition-all duration-200 ease-out text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
              <Bot size={20} className="text-[#6B7280]" />
                </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#111827]">Agent</div>
              <div className="text-[13px] text-[#6B7280]">Reasoning agent</div>
            </div>
          </button>
          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/node-registry", "subAgent");
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => handleAddNode("subAgent")}
            className="w-full flex items-center gap-3 bg-white rounded-2xl p-[18px] hover:-translate-y-[2px] transition-all duration-200 ease-out text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
              <GitFork size={20} className="text-[#10B981]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#111827]">SubAgent</div>
              <div className="text-[13px] text-[#6B7280]">Reusable worker</div>
            </div>
          </button>
        </div>

        {/* Tools Section */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] uppercase tracking-wider font-bold text-[#6B7280]">Tools</h3>
            <span className="text-[11px] text-[#6B7280]">{toolMetadatas.length} available</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="pl-10 pr-9 h-9 text-sm bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] placeholder:text-[#6B7280] transition-all duration-150"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#6B7280] bg-[#F3F4F6] px-1.5 py-0.5 rounded-md">
              ⌘K
            </kbd>
          </div>

          {/* Category Pills (Segmented Control) */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeCategory === null
                  ? "text-[#5B5CEB] bg-[#F5F5FF] border border-[#C7C8FF]"
                  : "text-[#6B7280] bg-transparent hover:bg-[#F5F5F5]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === cat
                    ? "text-[#5B5CEB] bg-[#F5F5FF] border border-[#C7C8FF]"
                    : "text-[#6B7280] bg-transparent hover:bg-[#F5F5F5]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Tool List */}
          <div className="space-y-2 pb-4">
            {/* Popular section — only when no filter */}
            {!activeCategory && !search && featuredTools.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  <Star size={12} className="text-[#F59E0B]" />
                  Popular tools
                </div>
                <div className="space-y-2">
                  {featuredTools.map((reg) => (
                    <ToolCard
                      key={reg.nodeRegistry}
                      reg={reg}
                      onClick={() => handleAddTool(reg.nodeRegistry)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeCategory || search ? (
              filteredTools.length > 0 ? (
                <div className="space-y-2">
                  {filteredTools.map((reg) => (
                    <ToolCard
                      key={reg.nodeRegistry}
                      reg={reg}
                      onClick={() => handleAddTool(reg.nodeRegistry)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] text-center py-4">
                  No tools match your search.
                </p>
              )
            ) : (
              /* Category sections when no category is selected */
              categories.map((cat) => {
                const catTools = toolMetadatas.filter(
                  (t) => t.category === cat && !t.featured,
                );
                if (catTools.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider pt-1">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    {catTools.map((reg) => (
                      <ToolCard
                        key={reg.nodeRegistry}
                        reg={reg}
                        onClick={() => handleAddTool(reg.nodeRegistry)}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Empty state hint */}
        {!search && !activeCategory && (
          <div className="mt-8">
            <p className="text-[11px] text-[#6B7280] text-center leading-relaxed">
              Drag nodes onto the canvas<br />
              to build your workflow
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
