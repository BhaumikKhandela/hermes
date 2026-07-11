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
import { resolveModelIcon } from "@/lib/workflow-tools/iconMap";
import { useNodeConfig } from "@/hooks/useNodeConfig";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

export function ImageGeneratorConfig({
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
  const [prompt, setPrompt] = useState<string>(config?.prompt || "");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) saveConfig.prompt = prompt;
    save(saveConfig, selectedId);
  }, [save, prompt, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const providerIcon = resolveModelIcon("openai");

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={providerIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No credentials found</ComboboxEmpty>
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
            Add new credential
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("openai" as any, "apiKey" as any)!}
              onCreated={handleCredentialCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </section>

      {!isToolMode && (
        <section>
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Runtime Inputs</h3>
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-4">
            <label className="text-sm font-medium text-[#111827] mb-1.5 block">Prompt</label>
            <p className="text-xs text-[#6B7280] mb-2">Describe the image to generate.</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene mountain landscape at sunset..."
              rows={4}
              className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
            />
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