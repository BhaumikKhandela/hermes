"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores";
import { updateNodeConfig } from "@/stores/agentBuilderSlice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EVENT_SERVICES = [
  { value: "stripe", label: "Stripe" },
  { value: "google_docs", label: "Google Docs" },
  { value: "calendar", label: "Calendar" },
  { value: "gmail", label: "Gmail" },
];

const FREQUENCY_OPTIONS = [
  { value: "every_5min", label: "Every 5 minutes" },
  { value: "every_15min", label: "Every 15 minutes" },
  { value: "every_30min", label: "Every 30 minutes" },
  { value: "every_1hr", label: "Every 1 hour" },
  { value: "every_6hr", label: "Every 6 hours" },
  { value: "every_12hr", label: "Every 12 hours" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom (cron expression)" },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type EventService = "stripe" | "google_docs" | "calendar" | "gmail";

const EVENT_CONFIG_FIELDS: Record<EventService, { key: string; label: string; placeholder: string }[]> = {
  stripe: [
    { key: "events", label: "Event Types", placeholder: "e.g. payment_intent.succeeded, charge.refunded" },
  ],
  google_docs: [
    { key: "documentId", label: "Document ID", placeholder: "Google Document ID to watch" },
  ],
  calendar: [
    { key: "calendarId", label: "Calendar ID", placeholder: "primary or specific calendar ID" },
  ],
  gmail: [
    { key: "label", label: "Label / Filter", placeholder: "e.g. INBOX, label:important" },
  ],
};

export function TriggerConfigPanel({ nodeId, onClose, initialTab }: { nodeId: string; onClose: () => void; initialTab?: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const node = useSelector((state: RootState) =>
    state.builder.nodes.find((n) => n.id === nodeId),
  );

  const existingData = node?.data || {};
  const existingConfig = existingData.config || {};

  const [triggerType, setTriggerType] = useState<"event" | "schedule">(
    (initialTab as "event" | "schedule") || existingConfig.triggerType || existingData.triggerType || "event",
  );
  const [eventService, setEventService] = useState<string | null>(
    existingConfig.event?.service || existingData.event?.service || null,
  );
  const [eventConfig, setEventConfig] = useState<Record<string, string>>(
    existingConfig.event?.config || existingData.event?.config || {},
  );
  const [scheduleFreq, setScheduleFreq] = useState<string>(
    existingConfig.schedule?.frequency || existingData.schedule?.frequency || "",
  );
  const [cronExpression, setCronExpression] = useState<string>(
    existingConfig.schedule?.cronExpression || existingData.schedule?.cronExpression || "",
  );
  const [timezone, setTimezone] = useState<string>(
    existingConfig.schedule?.timezone || existingData.schedule?.timezone || "UTC",
  );

  useEffect(() => {
    setTriggerType((initialTab as "event" | "schedule") || existingConfig.triggerType || existingData.triggerType || "event");
    setEventService(existingConfig.event?.service || existingData.event?.service || null);
    setEventConfig(existingConfig.event?.config || existingData.event?.config || {});
    setScheduleFreq(existingConfig.schedule?.frequency || existingData.schedule?.frequency || "");
    setCronExpression(existingConfig.schedule?.cronExpression || existingData.schedule?.cronExpression || "");
    setTimezone(existingConfig.schedule?.timezone || existingData.schedule?.timezone || "UTC");
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    const payload: any = {
      triggerType,
      event: { service: eventService, config: eventConfig },
      schedule: { frequency: scheduleFreq, cronExpression, timezone },
    };
    dispatch(updateNodeConfig({ id: nodeId, config: payload }));
    onClose();
  }, [nodeId, triggerType, eventService, eventConfig, scheduleFreq, cronExpression, timezone, dispatch, onClose]);

  const handleEventConfigChange = (key: string, value: string) => {
    setEventConfig((prev) => ({ ...prev, [key]: value }));
  };

  const currentService = eventService as EventService | null;
  const serviceConfigFields = currentService ? EVENT_CONFIG_FIELDS[currentService] : [];

  return (
    <div className="space-y-4">
      <Tabs
        value={triggerType}
        onValueChange={(v) => setTriggerType(v as "event" | "schedule")}
      >
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="event" className="flex-1 text-[13px]">Event</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 text-[13px]">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="event" className="space-y-6 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Service</Label>
            <Select
              value={eventService || ""}
              onValueChange={(v) => {
                setEventService(v);
                setEventConfig({});
              }}
            >
              <SelectTrigger className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]">
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_SERVICES.map((svc) => (
                  <SelectItem key={svc.value} value={svc.value}>
                    {svc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceConfigFields.length > 0 && (
            <>
              {serviceConfigFields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label className="text-[13px] font-semibold text-[#111827]">{field.label}</Label>
                  <Input
                    value={eventConfig[field.key] || ""}
                    onChange={(e) => handleEventConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                  />
                </div>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 pt-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Frequency</Label>
            <Select value={scheduleFreq} onValueChange={setScheduleFreq}>
              <SelectTrigger className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]">
                <SelectValue placeholder="Select frequency..." />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduleFreq === "custom" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Cron Expression</Label>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="e.g. */5 * * * *"
                className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              />
              <p className="text-xs text-[#6B7280]">
                Use standard cron syntax: minute hour day month weekday
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-6">
        <Button onClick={handleSave} className="flex-1 rounded-xl">
          Save
        </Button>
        <Button variant="outline" onClick={onClose} className="rounded-xl">
          Cancel
        </Button>
      </div>
    </div>
  );
}
