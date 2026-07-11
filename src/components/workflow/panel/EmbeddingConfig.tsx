"use client";

import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus, Loader2 } from "lucide-react";
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

type EmbeddingModel = {
  id: string;
  label: string;
  contextWindow: number;
};

const EMBEDDING_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "cohere", label: "Cohere" },
  { value: "gemini", label: "Gemini" },
  { value: "mistral", label: "Mistral" },
  { value: "voyage", label: "Voyage AI" },
  { value: "jina", label: "Jina AI" },
];

export function EmbeddingConfig({
  nodeId,
  credentialId,
  config,
  credentials,
  loading: credentialsLoading,
  onClose,
}: Props) {
  const { save } = useNodeConfig(nodeId, onClose);
  const edges = useSelector((state: RootState) => state.builder.edges);
  const isToolMode = edges.some(
    (e) => e.target === nodeId && e.targetHandle === "tool_in",
  );

  const [selectedId, setSelectedId] = useState<string>(credentialId || "");
  const [provider, setProvider] = useState<string>(config?.provider || "openai");
  const [modelId, setModelId] = useState<string>(config?.model || "");
  const [text, setText] = useState<string>(config?.text || "");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [models, setModels] = useState<EmbeddingModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    setModelsLoading(true);
    setModelId("");
    fetch(`/api/models?provider=${provider}&type=embedding`)
      .then((r) => r.json())
      .then((data) => {
        const allModels: EmbeddingModel[] = (data.models || []).map((m: any) => ({
          id: m.id,
          label: m.id.split("/").pop() || m.label || m.id,
          contextWindow: m.contextWindow || 0,
        }));
        setModels(allModels);
        if (allModels.length > 0 && !modelId) {
          setModelId(allModels[0].id);
        }
      })
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {
      provider,
      model: modelId,
    };
    if (!isToolMode) saveConfig.text = text;
    save(saveConfig, selectedId);
  }, [save, provider, modelId, text, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const providerIcon = resolveModelIcon(provider);

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={resolveModelIcon(selectedCred.provider)} alt="" className="w-4 h-4" />
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
                {credentialsLoading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
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

      {/* ── Embedding Settings ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Embedding Settings</h3>
        <div className="rounded-xl border border-[#E7E7E7] bg-white divide-y divide-[#F0F0F0]">
          {/* Provider */}
          <div className="p-4">
            <label className="text-sm font-medium text-[#111827] mb-1.5 block">Provider</label>
            <p className="text-xs text-[#6B7280] mb-2">The embedding provider to use.</p>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              >
                {EMBEDDING_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Model */}
          <div className="p-4">
            <label className="text-sm font-medium text-[#111827] mb-1.5 block">Model</label>
            <p className="text-xs text-[#6B7280] mb-2">Select an embedding model.</p>
            {modelsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#6B7280] py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading models...
              </div>
            ) : models.length > 0 ? (
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelId(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 ${
                      modelId === m.id
                        ? "bg-[#F5F5FF] border border-[#C7C8FF]"
                        : "bg-[#F8F9FC] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                    }`}
                  >
                    <img src={providerIcon} alt="" className="w-5 h-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#111827] truncate block">{m.label}</span>
                      <span className="text-[10px] text-[#6B7280]">{m.id}</span>
                    </div>
                    {m.contextWindow > 0 && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {m.contextWindow.toLocaleString()}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280] py-2">No embedding models found for {provider}.</p>
            )}
          </div>
        </div>
      </section>

      {!isToolMode && (
        <section>
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Runtime Inputs</h3>
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-4">
            <label className="text-sm font-medium text-[#111827] mb-1.5 block">Text</label>
            <p className="text-xs text-[#6B7280] mb-2">Text to convert into a vector embedding.</p>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to embed..."
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
