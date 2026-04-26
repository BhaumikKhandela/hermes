"use client";
import { Handle, Position } from "@xyflow/react";
import { useTheme } from "next-themes";

import { CpuIcon, PlusIcon } from "lucide-react";
import { THEME } from "./nodeThemes";

export function AgentNode({ data }: any) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  // Common Zapier-style handle classes (WITH ! preserved)
  const handleBaseClass = `
    !w-8 !h-8 !flex !items-center !justify-center !transition-all !duration-200
    !border-2 !shadow-xl !rounded-full !z-50
    ${
      isDark
        ? "!bg-[#0f172a] !border-slate-700 hover:!border-blue-500"
        : "!bg-white !border-slate-200 hover:!border-blue-500"
    }
  `;

  return (
    <div
      style={{ borderColor: THEME.agentBorder }}
      className={`relative min-w-[240px] rounded-sm border transition-all duration-500
        ${
          isDark
            ? "bg-slate-950 border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            : "bg-white border-slate-200 shadow-lg"
        }
        ${
          data.running
            ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-transparent"
            : ""
        }
      `}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${
          isDark
            ? "bg-slate-900/50 border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded ${
              isDark ? "bg-blue-500/10" : "bg-blue-50"
            }`}
          >
            <CpuIcon
              className={`w-3.5 h-3.5 ${
                data.running
                  ? "text-blue-500 animate-pulse"
                  : "text-slate-500"
              }`}
            />
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Manager Core
          </span>
        </div>

        <div
          className={`w-2 h-2 rounded-full ${
            data.running
              ? "bg-green-500 animate-ping"
              : "bg-slate-600"
          }`}
        />
      </div>

      {/* Body */}
      <div className="p-5">
        <h3
          className={`text-base font-bold tracking-tight ${
            isDark ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {data.label || "System Orchestrator"}
        </h3>

        <p
          className={`text-xs mt-1 font-medium ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {data.sub || data.meta?.model || "Standard LLM Intelligence"}
        </p>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className={handleBaseClass}
        style={{ left: -18 }}
      >
        <PlusIcon className="w-4 h-4 text-blue-500" strokeWidth={3} />
      </Handle>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={handleBaseClass}
        style={{ right: -18 }}
      >
        <PlusIcon className="w-4 h-4 text-emerald-500" strokeWidth={3} />
      </Handle>

      {/* Bottom Tools Handle */}
      <div className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center">
        <Handle
          type="source"
          position={Position.Bottom}
          id="tools"
          className={handleBaseClass}
        >
          <PlusIcon className="w-4 h-4 text-purple-500" strokeWidth={3} />
        </Handle>

        <span
          className={`text-[9px] font-black uppercase mt-1 tracking-tight ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Tools
        </span>
      </div>
    </div>
  );
}
