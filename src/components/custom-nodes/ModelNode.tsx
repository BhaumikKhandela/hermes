"use client";

import { Handle, Position } from "@xyflow/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { NodeHoverActions } from "./NodeHoverActions";

export function ModelNode({
  data,
  id,
  selected,
}: {
  data: { icon: string; label: string };
  id: string;
  selected?: boolean;
}) {
  const edges = useSelector((state: RootState) => state.builder.edges);
  const isConnected = edges.some((e: any) => e.target === id && e.targetHandle === "tool_in");

  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!data.label) return;
    const modelToArray = data.label.split("/");
    const modelName = modelToArray.pop() as string;
    setLabel(modelName);
  }, [data?.label]);

  return (
    <NodeHoverActions id={id}>
      <div className="flex flex-col items-center select-none transition-all duration-200 ease-out cursor-pointer group">
        <Handle
          type="target"
          position={Position.Top}
          id="tool_in"
          className={`!w-3 !h-3 !rounded-full !border-2 !transition-all !duration-150 ${
            isConnected
              ? "!bg-[#F59E0B] !border-[#F59E0B]"
              : "!bg-white !border-[#D1D5DB] hover:!bg-[#F59E0B] hover:!border-[#F59E0B] hover:!scale-125"
          }`}
          style={{
            position: "absolute",
            top: "-6px",
          }}
        />

        <div
          className={`rounded-2xl bg-white border flex items-center justify-center transition-all duration-200 ease-out
            ${selected
              ? "ring-1 ring-[#5B5CEB]/30 border-[#5B5CEB] bg-[#F5F5FF]"
              : "border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] hover:-translate-y-[1px]"
            } w-[72px] h-[72px]`}
        >
          {data.icon ? (
            <div className="relative w-7 h-7">
              <Image
                src={data?.icon}
                alt={data?.label}
                fill
                className="object-contain"
                sizes="28px"
              />
            </div>
          ) : (
            <BrainCircuit className="w-6 h-6 text-[#6B7280]" />
          )}
        </div>

        <div className="mt-3 text-xs font-medium text-[#111827] text-center max-w-[120px] leading-tight">
          {label}
        </div>
        <span className="mt-1.5 text-[9px] font-medium text-[#6B7280] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">
          Model
        </span>
      </div>
    </NodeHoverActions>
  );
}
