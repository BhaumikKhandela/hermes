"use client";

import { Handle, Position } from "@xyflow/react";
import { PlusIcon, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { getRegistration } from "@/lib/workflow-tools/registry";

type ToolNodeData = {
  icon: string;
  label: string;
  nodeRegistry?: string;
  credentialId?: string | null;
};

export function ToolNode({ data }: { data: ToolNodeData }) {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = activeTheme === "dark";

  const reg = data.nodeRegistry ? getRegistration(data.nodeRegistry) : null;
  const needsCredential = reg?.credentialRequirement !== undefined;
  const missingCredential = needsCredential && !data.credentialId;

  return (
    <div
      className={`
        relative group flex items-center gap-3 px-4 py-2.5
        rounded-xl border transition-all duration-300 cursor-pointer
        ${missingCredential ? "border-amber-400/60" : ""}
        ${
          isDark
            ? "bg-slate-900/80 border-slate-700/50 backdrop-blur-md hover:border-blue-500/50"
            : "bg-white/80 border-slate-200/80 backdrop-blur-md hover:border-blue-400"
        }
        shadow-sm hover:shadow-lg
      `}
    >
      {/* Accent Left Border */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Icon Section */}
      {data.icon && (
        <div className="relative w-6 h-6 flex-shrink-0">
          <Image
            src={data.icon}
            alt={data.label}
            fill
            className="object-contain grayscale group-hover:grayscale-0 transition-all"
            sizes="24px"
          />
        </div>
      )}

      {/* Text Section */}
      <div className="flex flex-col">
        <span
          className={`text-[10px] uppercase tracking-wider font-bold opacity-50 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Tool
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-semibold leading-tight ${
              isDark ? "text-slate-100" : "text-slate-800"
            }`}
          >
            {data.label}
          </span>
          {missingCredential && (
            <TriangleAlert size={13} className="text-amber-500 shrink-0" />
          )}
        </div>
      </div>

      {/* Zapier-Style SQUARE Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="tool_in"
        className={`
          !w-6 !h-6 !flex !items-center !justify-center
          !transition-all !duration-200 !shadow-md !z-50
          !border-2 !rounded-md
          ${
            isDark
              ? "!bg-slate-800 !border-slate-600 hover:!border-blue-500"
              : "!bg-white !border-slate-200 hover:!border-blue-400"
          }
        `}
        style={{ top: -12 }}
      >
        <PlusIcon
          className={`w-3 h-3 ${
            isDark ? "text-slate-400" : "text-slate-500"
          } group-hover:text-blue-500`}
          strokeWidth={3}
        />
      </Handle>
    </div>
  );
}
