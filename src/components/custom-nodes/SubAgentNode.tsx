import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import { Layers } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { NodeHoverActions } from "./NodeHoverActions";

export function SubAgentNode({ data, id, selected }: any) {
  const edges = useSelector((state: RootState) => state.builder.edges);

  const isHandleConnected = (handleId: string, type: "source" | "target") =>
    edges.some((e: any) =>
      (type === "source" && e.source === id && e.sourceHandle === handleId) ||
      (type === "target" && e.target === id && e.targetHandle === handleId)
    );

  const handleClass = (handleId: string, type: "source" | "target") =>
    `!w-3 !h-3 !rounded-full !border-2 !transition-all !duration-150 ${
      isHandleConnected(handleId, type)
        ? "!bg-[#F59E0B] !border-[#F59E0B]"
        : "!bg-white !border-[#D1D5DB] hover:!bg-[#F59E0B] hover:!border-[#F59E0B] hover:!scale-125"
    }`;

  return (
    <NodeHoverActions id={id}>
      <div
        className={`relative min-w-[280px] bg-white rounded-2xl border p-6 transition-all duration-200 ease-out
          ${selected
            ? "ring-1 ring-[#F59E0B]/30 border-[#F59E0B] bg-[#FFFBEB]"
            : "border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] hover:-translate-y-[1px]"
          }`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] flex items-center justify-center shrink-0">
            {data.icon ? (
              <div className="relative w-[22px] h-[22px]">
                <Image src={data.icon} alt="" fill className="object-contain" sizes="22px" />
              </div>
            ) : (
              <Layers className="w-[22px] h-[22px] text-[#F59E0B]" />
            )}
          </div>
          <span className="text-[11px] font-medium text-[#F59E0B] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
            Worker
          </span>
        </div>

        <h3 className="text-base font-semibold text-[#111827] mb-1">
          {data.label || "Sub Agent"}
        </h3>

        <p className="text-sm text-[#6B7280] font-normal">
          {data.sub || data.meta?.model || "Reusable worker"}
        </p>

        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className={handleClass("in", "target")}
          style={{
            position: "absolute",
            top: "-6px",
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
            right: "-6px",
            transform: "translateY(-50%)",
          }}
        />

        <div className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Handle
            type="source"
            position={Position.Bottom}
            id="tools"
            className={handleClass("tools", "source")}
          />
          <span className="text-[9px] font-semibold uppercase mt-1.5 tracking-wider text-[#6B7280]">
            Tools
          </span>
        </div>
      </div>
    </NodeHoverActions>
  );
}
