"use client";

import { Handle, Position } from "@xyflow/react";
import { FileText } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { NodeHoverActions } from "./NodeHoverActions";

export function InputNode({ data, id, selected }: any) {
  const edges = useSelector((state: RootState) => state.builder.edges);
  const isConnected = edges.some((e: any) => e.source === id && e.sourceHandle === "out");

  return (
    <NodeHoverActions id={id}>
      <div
        className={`relative min-w-[240px] bg-white rounded-2xl border p-5 transition-all duration-200 ease-out
          ${selected
            ? "ring-1 ring-[#5B5CEB]/30 border-[#5B5CEB] bg-[#F5F5FF]"
            : "border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] hover:-translate-y-[1px]"
          }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-[#111827]">
                {data.label || "Input"}
              </h4>
              <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">
                Input
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-normal">External data source</p>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          className={`!w-3 !h-3 !rounded-full !border-2 !transition-all !duration-150 ${
            isConnected
              ? "!bg-[#5B5CEB] !border-[#5B5CEB]"
              : "!bg-white !border-[#D1D5DB] hover:!bg-[#5B5CEB] hover:!border-[#5B5CEB] hover:!scale-125"
          }`}
          style={{
            position: "absolute",
            top: "50%",
            right: "-6px",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </NodeHoverActions>
  );
}
