"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { Zap, CalendarSync, Clock, Globe, Hash, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVENT_LABELS: Record<string, string> = {
  stripe: "Stripe",
  google_docs: "Google Docs",
  calendar: "Calendar",
  gmail: "Gmail",
};

const FREQ_LABELS: Record<string, string> = {
  every_5min: "Every 5 minutes",
  every_15min: "Every 15 minutes",
  every_30min: "Every 30 minutes",
  every_1hr: "Every 1 hour",
  every_6hr: "Every 6 hours",
  every_12hr: "Every 12 hours",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function TriggerManagePanel({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const node = useSelector((state: RootState) =>
    state.builder.nodes.find((n) => n.id === nodeId),
  );

  const existingData = node?.data || {};
  const existingConfig = existingData.config || {};

  const triggerType = existingConfig.triggerType || existingData.triggerType || "event";
  const eventService = existingConfig.event?.service || existingData.event?.service;
  const eventConfig = existingConfig.event?.config || existingData.event?.config || {};
  const scheduleFreq = existingConfig.schedule?.frequency || existingData.schedule?.frequency;
  const scheduleCron = existingConfig.schedule?.cronExpression || existingData.schedule?.cronExpression;
  const scheduleTz = existingConfig.schedule?.timezone || existingData.schedule?.timezone || "UTC";

  const isConfigured = triggerType === "event"
    ? !!eventService
    : !!scheduleFreq;

  return (
    <div className="space-y-4">
      {!isConfigured ? (
        <div className="flex flex-col items-center gap-3 py-8 text-[#6B7280]">
          <Zap size={32} className="text-[#D1D5DB]" />
          <p className="text-sm font-medium">No trigger configured</p>
          <p className="text-xs text-center text-[#6B7280]">
            Click <strong>Event</strong> or <strong>Schedule</strong> on the trigger node to configure when this workflow runs.
          </p>
        </div>
      ) : (
        <>
          {/* Summary header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              {triggerType === "event" ? (
                <CalendarSync size={18} className="text-amber-500" />
              ) : (
                <Clock size={18} className="text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                {triggerType === "event" ? "Event Trigger" : "Schedule Trigger"}
              </p>
              <p className="text-xs text-[#6B7280]">
                {triggerType === "event"
                  ? "Fires when a service event occurs"
                  : "Fires on a recurring schedule"}
              </p>
            </div>
          </div>

          {triggerType === "event" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarSync size={14} className="text-[#9CA3AF] shrink-0" />
                <span className="text-sm font-medium text-[#111827]">Service</span>
              </div>
              <p className="text-sm text-[#6B7280] pl-6">
                {EVENT_LABELS[eventService] || eventService}
              </p>

              {Object.keys(eventConfig).length > 0 && (
                <>
                  <div className="space-y-2 mt-4">
                    {Object.entries(eventConfig).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-1">
                          <Hash size={14} className="text-[#9CA3AF] shrink-0" />
                          <span className="text-sm font-medium text-[#111827] capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B7280] pl-6">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#9CA3AF] shrink-0" />
                <span className="text-sm font-medium text-[#111827]">Frequency</span>
              </div>
              <p className="text-sm text-[#6B7280] pl-6">
                {FREQ_LABELS[scheduleFreq] || scheduleFreq || "Not set"}
              </p>

              {scheduleFreq === "custom" && scheduleCron && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Type size={14} className="text-[#9CA3AF] shrink-0" />
                    <span className="text-sm font-medium text-[#111827]">Cron Expression</span>
                  </div>
                  <p className="text-sm text-[#6B7280] pl-6 font-mono">{scheduleCron}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[#9CA3AF] shrink-0" />
                <span className="text-sm font-medium text-[#111827]">Timezone</span>
              </div>
              <p className="text-sm text-[#6B7280] pl-6">{scheduleTz}</p>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
          Close
        </Button>
      </div>
    </div>
  );
}
