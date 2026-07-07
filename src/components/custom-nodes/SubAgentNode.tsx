import { Handle, Position } from "@xyflow/react";
import {
  Activity,
  Cpu,
  Layers,
  Loader,
  Loader2,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

export function SubAgentNode({ data }: any) {
  const { theme, resolvedTheme } = useTheme();
  const isDark =
    (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div
      className={`
        relative min-w-[200px] group transition-all duration-300
        ${
          isDark
            ? "bg-[#1e1e2d] border-[#2b2b3d]"
            : "bg-white border-slate-200"
        }
        rounded-xl border-2 shadow-xl py-4 px-5
      `}
    >
      {/* 1. Top Handle (Zapier Style) */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className={`
          !w-7 !h-7 !transition-all !duration-200
          !flex !items-center !justify-center
          !border-2 !shadow-lg !rounded-full
          ${
            isDark
              ? "!bg-[#2b2b3d] !border-orange-500/50 hover:!border-orange-500"
              : "!bg-white !border-slate-200 hover:!border-orange-500"
          }
        `}
        style={{ top: -14 }} // Shifts it perfectly onto the border
      >
        <Plus
          className={`w-3.5 h-3.5 ${
            isDark ? "text-orange-500" : "text-slate-400"
          }`}
          strokeWidth={3}
        />
      </Handle>

      {/* 2. Content Layout */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {/* Left icon */}
          <div
            className={`p-2 rounded-lg ${
              isDark ? "bg-orange-500/10" : "bg-orange-50"
            }`}
          >
            {data.icon ? (
              <div className="relative w-4 h-4">
                <Image src={data.icon} alt="" fill className="object-contain" sizes="16px" />
              </div>
            ) : (
              <Layers className="w-4 h-4 text-orange-500" />
            )}
          </div>

          {/* Worker status */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                data.running
                  ? "bg-orange-500 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Worker
            </span>
          </div>
        </div>

        {/* Text content */}
        <div>
          <h4
            className={`text-sm font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {data.label || "Sub Agent"}
          </h4>

          <p className="text-[11px] font-medium text-slate-500 truncate">
            {data.sub || data.meta?.model || "Worker Instance"}
          </p>
        </div>
      </div>

      {/* 3. Bottom Handle (Zapier Style) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className={`
          !w-7 !h-7 !transition-all !duration-200
          !flex !items-center !justify-center
          !border-2 !shadow-lg !rounded-full
          ${
            isDark
              ? "!bg-[#2b2b3d] !border-orange-500/50 hover:!border-orange-500"
              : "!bg-white !border-slate-200 hover:!border-orange-500"
          }
        `}
        style={{ bottom: -14 }}
      >
        <Plus
          className={`w-3.5 h-3.5 ${
            isDark ? "text-orange-500" : "text-slate-400"
          }`}
          strokeWidth={3}
        />
      </Handle>
    </div>
  );
}