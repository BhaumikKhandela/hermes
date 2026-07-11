"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CredentialForm } from "./CredentialForm";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { CredentialMetadata } from "@/lib/credentials/types";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";
import { resolveToolIcon } from "@/lib/workflow-tools/iconMap";
import { useNodeConfig } from "@/hooks/useNodeConfig";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

export function CalendarConfig({
  nodeId,
  credentialId,
  config,
  credentials,
  loading,
  onClose,
}: Props) {
  const { save } = useNodeConfig(nodeId, onClose);
  const edges = useSelector((state: RootState) => state.builder.edges);
  const isToolMode = edges.some(
    (e) => e.target === nodeId && e.targetHandle === "tool_in",
  );

  const [selectedId, setSelectedId] = useState<string>(credentialId || "");
  const [summary, setSummary] = useState<string>(config?.summary || "");
  const [description, setDescription] = useState<string>(config?.description || "");
  const [startTime, setStartTime] = useState<string>(config?.startTime || "");
  const [endTime, setEndTime] = useState<string>(config?.endTime || "");
  const [timeZone, setTimeZone] = useState<string>(config?.timeZone || "UTC");
  const [calendarId, setCalendarId] = useState<string>(config?.calendarId || "primary");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      saveConfig.summary = summary;
      saveConfig.description = description;
      saveConfig.startTime = startTime;
      saveConfig.endTime = endTime;
      saveConfig.timeZone = timeZone;
      saveConfig.calendarId = calendarId;
    }
    save(saveConfig, selectedId);
  }, [save, summary, description, startTime, endTime, timeZone, calendarId, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const calendarIcon = resolveToolIcon("calendar");

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Google Calendar Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={calendarIcon} alt="" className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#111827] truncate">{selectedCred.name}</span>
                  {selectedCred.status === "active" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#6B7280]">{selectedCred.provider}</span>
                  {selectedCred.providerAccountId && (
                    <>
                      <span className="text-[#E7E7E7]">·</span>
                      <span className="text-xs text-[#6B7280]">{selectedCred.providerAccountId}</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#6B7280] hover:text-[#111827] shrink-0"
                onClick={() => setSelectedId("")}
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Combobox value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
            <ComboboxInput placeholder="Search credentials..." className="w-full rounded-xl bg-[#F8F9FC] border border-[#E7E7E7] focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]" />
            <ComboboxContent>
              <ComboboxList>
                {loading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
                <ComboboxEmpty>No Google Calendar credentials found</ComboboxEmpty>
                {credentials.map((c) => (
                  <ComboboxItem key={c._id} value={c._id}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm truncate">{c.name}</span>
                      {c.status === "active" && (
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{c.status}</Badge>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}

        {!showCreateForm ? (
          <div className="mt-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF] hover:text-[#5B5CEB] transition-colors duration-150"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              Create New Credential
            </button>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("google-calendar", "serviceAccount")!}
              onCreated={handleCredentialCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </section>

      {!isToolMode && (
        <section>
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Runtime Inputs</h3>
          <p className="text-xs text-[#6B7280] mb-3">Configure default values for the event. These are used when the LLM or upstream node doesn&apos;t provide them.</p>
          <div className="rounded-xl border border-[#E7E7E7] bg-white divide-y divide-[#F0F0F0]">
            {/* Summary */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Summary (Event Title)</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Weekly Standup"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Description */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Weekly team sync to review progress"
                rows={3}
                className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Start Time */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Start Time</label>
              <p className="text-xs text-[#6B7280] mb-2">ISO 8601 format.</p>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="2025-01-01T10:00:00Z"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* End Time */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">End Time</label>
              <p className="text-xs text-[#6B7280] mb-2">ISO 8601 format.</p>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="2025-01-01T11:00:00Z"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Time Zone */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Time Zone</label>
              <p className="text-xs text-[#6B7280] mb-2">IANA timezone (default: UTC).</p>
              <input
                type="text"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                placeholder="America/New_York"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Calendar ID */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Calendar ID</label>
              <p className="text-xs text-[#6B7280] mb-2">Defaults to primary calendar.</p>
              <input
                type="text"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="primary"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} className="flex-1 rounded-xl">
          Save
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827]">
          Cancel
        </Button>
      </div>
    </div>
  );
}
