"use client";

import { Handle, Position } from "@xyflow/react";
import { Zap, CalendarSync, Clock, Settings2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/stores";
import { setSelectedNode, updateNodeConfig } from "@/stores/agentBuilderSlice";
import { NodeHoverActions } from "./NodeHoverActions";

const EVENT_LABELS: Record<string, string> = {
  stripe: "Stripe",
  google_docs: "Google Docs",
  calendar: "Calendar",
  gmail: "Gmail",
};

const FREQ_LABELS: Record<string, string> = {
  every_5min: "Every 5 min",
  every_15min: "Every 15 min",
  every_30min: "Every 30 min",
  every_1hr: "Every 1 hr",
  every_6hr: "Every 6 hr",
  every_12hr: "Every 12 hr",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function TriggerNode({ data, id, selected }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const edges = useSelector((state: RootState) => state.builder.edges);

  const isConnected = edges.some((e: any) => e.source === id && e.sourceHandle === "out");

  const cfg = data.config || {};
  const triggerType = cfg.triggerType || data.triggerType || "event";
  const eventService = cfg.event?.service || data.event?.service;
  const scheduleFreq = cfg.schedule?.frequency || data.schedule?.frequency;

  let subtitle = "";
  if (triggerType === "event" && eventService) {
    subtitle = EVENT_LABELS[eventService] || eventService;
  } else if (triggerType === "event") {
    subtitle = "No event source set";
  } else if (triggerType === "schedule" && scheduleFreq) {
    subtitle = FREQ_LABELS[scheduleFreq] || scheduleFreq;
  } else if (triggerType === "schedule") {
    subtitle = "No schedule set";
  }

  const openWithTab = (tab: string) => {
    dispatch(updateNodeConfig({ id, config: { _triggerTab: tab } }));
    dispatch(setSelectedNode(id));
  };

  return (
    <NodeHoverActions id={id}>
      <div
        className={`relative min-w-[240px] bg-white rounded-2xl border p-5 transition-all duration-200 ease-out
          ${selected
            ? "ring-1 ring-[#5B5CEB]/30 border-[#5B5CEB] bg-[#F5F5FF]"
            : "border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] hover:-translate-y-[1px]"
          }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#5B5CEB]" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-[#111827]">
                {data.label || "Trigger"}
              </h4>
              <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-1.5 py-0.5 rounded-full">
                Trigger
              </span>
            </div>
            <p className="text-xs text-[#6B7280] truncate font-normal">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => openWithTab("event")}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium bg-[#F5F5F5] text-[#6B7280] hover:bg-[#E7E7E7] transition-all duration-150"
          >
            <CalendarSync size={14} />
            Event
          </button>
          <button
            type="button"
            onClick={() => openWithTab("schedule")}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium bg-[#F5F5F5] text-[#6B7280] hover:bg-[#E7E7E7] transition-all duration-150"
          >
            <Clock size={14} />
            Schedule
          </button>
          <button
            type="button"
            onClick={() => openWithTab("manage")}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium bg-[#F5F5F5] text-[#6B7280] hover:bg-[#E7E7E7] transition-all duration-150"
          >
            <Settings2 size={14} />
            Manage
          </button>
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
