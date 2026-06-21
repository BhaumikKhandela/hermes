"use client";

import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { addNodeFromPalette } from "@/stores/agentBuilderSlice";
import { list } from "@/lib/workflow-tools/registry";
import type { ToolRegistration, ToolCategory } from "@/lib/workflow-tools/types";
import {
  Bot,
  GitFork,
  Search,
  Star,
  BrainCircuit,
  Globe,
  Database,
  FunctionSquare,
  Layers,
  FileText,
  Image,
  Eye,
  Edit3,
  Table,
  Calendar,
  Mail,
  BarChart3,
  File,
  FilePlus,
  FileEdit,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai: "AI",
  data: "Data",
  communication: "Communication",
  storage: "Storage",
  integration: "Integration",
  utility: "Utility",
};

const ICON_MAP: Record<string, any> = {
  brain: BrainCircuit,
  search: Search,
  globe: Globe,
  database: Database,
  vector: FunctionSquare,
  layers: Layers,
  "file-text": FileText,
  image: Image,
  eye: Eye,
  edit: Edit3,
  table: Table,
  calendar: Calendar,
  mail: Mail,
  "bar-chart": BarChart3,
  file: File,
  "file-plus": FilePlus,
  "file-edit": FileEdit,
};

const allTools = list().filter((t) => !t.hidden);

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
  reg: ToolRegistration;
  onClick: () => void;
}) {
  const IconComponent = ICON_MAP[reg.icon || ""];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 hover:border-slate-300 transition text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        {IconComponent ? (
          <IconComponent size={16} className="text-slate-600" />
        ) : (
          <FunctionSquare size={16} className="text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-800">
            {reg.label}
          </span>
          {reg.beta && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              Beta
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
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
    let tools = allTools;

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
    () => allTools.filter((t) => t.featured),
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
      className={`relative bg-white border-l border-slate-200 shrink-0 overflow-hidden transition-all duration-300
      ${isRightPanelOpen ? "w-[340px]" : "w-0 border-none opacity-0"}`}
    >
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 text-sm">Nodes</h3>
        </div>

        {/* Structural Nodes */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleAddNode("agent")}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition text-sm font-medium text-slate-700"
          >
            <Bot size={16} />
            Agent
          </button>
          <button
            onClick={() => handleAddNode("subAgent")}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition text-sm font-medium text-slate-700"
          >
            <GitFork size={16} />
            SubAgent
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mb-4" />

        {/* Tools Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm">Tools</h3>

          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeCategory === null
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategory === cat
                    ? "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  Popular
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
                <p className="text-xs text-slate-400 text-center py-4">
                  No tools match your search.
                </p>
              )
            ) : (
              /* Category sections when no category is selected */
              categories.map((cat) => {
                const catTools = allTools.filter(
                  (t) => t.category === cat && !t.featured,
                );
                if (catTools.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">
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
      </div>
    </aside>
  );
};

export default RightPanel;
