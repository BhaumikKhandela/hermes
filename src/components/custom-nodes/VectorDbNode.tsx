"use client";

import { Handle, Position } from "@xyflow/react";

import Image from "next/image";
import { useTheme } from "next-themes";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { THEME_COLORS } from "./nodeThemes";
import { NodeHoverActions } from "./NodeHoverActions";

export function VectorDbNode({ data, id }: any) {
  const { theme, resolvedTheme } = useTheme();
  const t = theme === "system" ? resolvedTheme : theme;
  const c = t === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <NodeHoverActions id={id}>
    <div className="flex flex-col items-center transition-colors duration-300">
      <div
        className={`relative rounded-md border ${c.border} ${c.bg} w-28 px-4 py-3 shadow-sm flex items-center justify-center`}
      >
        {data.icon && (
          <Image
            src={data.icon}
            alt={data.label}
            width={32}
            height={32}
            className="object-contain"
          />
        )}

        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            background: c.handle,
            position: "absolute",
            top: "50%",
            left: "-6px",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
          }}
        />

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{
            background: c.handle,
            position: "absolute",
            top: "50%",
            right: "-6px",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
          }}
        />
      </div>

      <div className={`mt-1 text-xs ${c.label} text-center max-w-[120px]`}>
        {data.label}
      </div>
    </div>
    </NodeHoverActions>
  );
}
