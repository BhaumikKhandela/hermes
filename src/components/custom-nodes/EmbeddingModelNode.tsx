import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { NodeHoverActions } from "./NodeHoverActions";

export function EmbeddingModelNode({ data, id, selected }: any) {
  const edges = useSelector((state: RootState) => state.builder.edges);

  const isHandleConnected = (handleId: string, type: "source" | "target") =>
    edges.some((e: any) =>
      (type === "source" && e.source === id && e.sourceHandle === handleId) ||
      (type === "target" && e.target === id && e.targetHandle === handleId)
    );

  const handleClass = (handleId: string, type: "source" | "target") =>
    `!w-2.5 !h-2.5 !rounded-full !border-2 !transition-all !duration-150 ${
      isHandleConnected(handleId, type)
        ? "!bg-[#5B5CEB] !border-[#5B5CEB]"
        : "!bg-white !border-[#D1D5DB] hover:!bg-[#5B5CEB] hover:!border-[#5B5CEB] hover:!scale-125"
    }`;

  return (
    <NodeHoverActions id={id}>
      <div
        className={`flex flex-col items-center transition-all duration-200 ease-out group
          ${selected ? "" : ""}`}
      >
        <div
          className={`relative bg-white rounded-2xl border flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 ease-out
            ${selected
              ? "ring-1 ring-[#5B5CEB]/30 border-[#5B5CEB] bg-[#F5F5FF]"
              : "border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] hover:-translate-y-[1px]"
            }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
            {data.icon && (
              <Image
                src={data.icon}
                alt={data.label}
                width={18}
                height={18}
                className="object-contain"
              />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#111827] leading-tight">
              {data.label}
            </span>
            <span className="text-[9px] font-medium text-[#6B7280]">Embedding</span>
          </div>

          <Handle
            type="target"
            position={Position.Left}
            id="in"
            className={handleClass("in", "target")}
            style={{
              position: "absolute",
              top: "50%",
              left: "-5px",
              transform: "translateY(-50%)",
            }}
          />

          <Handle
            type="source"
            position={Position.Right}
            id="out"
            className={handleClass("out", "source")}
            style={{
              position: "absolute",
              top: "50%",
              right: "-5px",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </div>
    </NodeHoverActions>
  );
}
