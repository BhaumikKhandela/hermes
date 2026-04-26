"use client";

import { Handle, Position } from "@xyflow/react";
import { THEME, THEME_COLORS } from "./nodeThemes"; 
import Image from "next/image";
import { useTheme } from "next-themes";

import { useEffect, useState } from "react";
import { BrainCircuit, Plus } from "lucide-react";

export function ModelNode({
  data,
}: {
  data: { icon: string; label: string };
}) {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = activeTheme === "dark";

  // Use your existing THEME_COLORS or fallback
  const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!data.label) return;

    const modelToArray = data.label.split("/");
    const modelName = modelToArray.pop() as string;
    setLabel(modelName);
  }, [data?.label]);

  return (
    <div className="flex flex-col items-center select-none transition-colors duration-300">
      {/* Zapier-Style Plus Handle at Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="tool_in"
        className={`
          !w-7 !h-7 !flex !items-center !justify-center
          !transition-all !duration-200 !shadow-lg !z-50
          !border-2 !rounded-full
          ${
            isDark
              ? "!bg-[#1e1e2e] !border-indigo-500/50 hover:!border-indigo-400"
              : "!bg-white !border-slate-200 hover:!border-indigo-500"
          }
        `}
        style={{
          top: -12,
          background: "none",
        }}
      >
        <Plus
          className={`w-3.5 h-3.5 ${
            isDark ? "text-indigo-400" : "text-slate-500"
          } group-hover:text-indigo-500`}
          strokeWidth={3}
        />
      </Handle>

      {/* Your Original Node Body */}
      <div
        className={`rounded-full ${colors.bg} w-15 h-15 flex items-center justify-center shadow-md`}
        style={{ border: `2px solid ${colors.toolBorder}` }}
      >
        {data.icon ? (
          <div className="relative w-8 h-8">
            <Image
              src={data?.icon}
              alt={data?.label}
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="text-xl">
            <BrainCircuit />
          </div>
        )}
      </div>

      <div
        className={`mt-2 text-xs ${colors?.label} text-center max-w-[120px]`}
      >
        {label}
      </div>
    </div>
  );
}