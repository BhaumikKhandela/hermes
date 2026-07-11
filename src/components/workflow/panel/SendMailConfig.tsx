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

export function SendMailConfig({
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
  const [to, setTo] = useState<string>(config?.to || "");
  const [subject, setSubject] = useState<string>(config?.subject || "");
  const [body, setBody] = useState<string>(config?.body || "");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      saveConfig.to = to;
      saveConfig.subject = subject;
      saveConfig.body = body;
    }
    save(saveConfig, selectedId);
  }, [save, to, subject, body, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const mailIcon = resolveToolIcon("sendMail");

  return (
    <div className="space-y-8">
      {/* ── SMTP Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">SMTP Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={mailIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No SMTP credentials found</ComboboxEmpty>
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
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#5B5CEB] transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Add new SMTP credential
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("smtp" as any, "smtp" as any)!}
              onCreated={handleCredentialCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </section>

      {!isToolMode && (
        <section>
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Runtime Inputs</h3>
          <div className="rounded-xl border border-[#E7E7E7] bg-white divide-y divide-[#F0F0F0]">
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">To</label>
              <p className="text-xs text-[#6B7280] mb-2">Recipient email address.</p>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Subject</label>
              <p className="text-xs text-[#6B7280] mb-2">Email subject line.</p>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Meeting reminder"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Body</label>
              <p className="text-xs text-[#6B7280] mb-2">Email body text.</p>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Don't forget about the meeting tomorrow at 10am."
                rows={4}
                className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
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
