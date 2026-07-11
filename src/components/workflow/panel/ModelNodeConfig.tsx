"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { updateNodeCredential, updateNodeConfig } from "@/stores/agentBuilderSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Plus, Thermometer } from "lucide-react";
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
import type { ModelInfo } from "@/lib/providers";
import { resolveModelIcon } from "@/lib/workflow-tools/iconMap";

const NODE_REGISTRY_TO_PROVIDER: Record<string, string> = {
  "model-openai": "openai",
  "model-anthropic": "anthropic",
  "model-gemini": "gemini",
  "model-deepseek": "deepseek",
  "model-mistral": "mistral",
  "model-qwen": "qwen",
  "model-kimi": "kimi",
  "model-meta": "meta",
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: "openai/gpt-4o-mini",
  anthropic: "anthropic/claude-3-haiku",
  gemini: "google/gemini-2.5-flash",
  deepseek: "deepseek/deepseek-chat",
  mistral: "mistralai/mistral-nemo",
  qwen: "qwen/qwen-2.5-72b-instruct",
  kimi: "moonshotai/kimi-k2.5",
  meta: "meta-llama/llama-3.1-8b-instruct",
};

function inferProviderFromLabel(label: string): string {
  const labelMap: Record<string, string> = {
    openai: "openai", gpt: "openai",
    claude: "anthropic", anthropic: "anthropic",
    gemini: "gemini", google: "gemini",
    deepseek: "deepseek",
    mistral: "mistral",
    qwen: "qwen",
    kimi: "kimi", moonshot: "kimi",
    llama: "meta", meta: "meta",
  };
  const lower = label.toLowerCase();
  for (const [key, val] of Object.entries(labelMap)) {
    if (lower.includes(key)) return val;
  }
  return "openai";
}

function formatContextWindow(window: number): string {
  if (window >= 1_000_000) return `${(window / 1_000).toFixed(0)}K`;
  if (window >= 1_000) return `${(window / 1_000).toFixed(0)}K`;
  return `${window}`;
}

type Props = {
  nodeId: string;
  nodeRegistry: string;
  label?: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

export function ModelNodeConfig({
  nodeId,
  nodeRegistry,
  label,
  credentialId,
  config,
  credentials,
  loading,
  onClose,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const targetProvider = NODE_REGISTRY_TO_PROVIDER[nodeRegistry] || inferProviderFromLabel(label || "");

  const defaultModel = DEFAULT_MODELS[targetProvider] || "";
  const [selectedId, setSelectedId] = useState<string>(credentialId || "");
  const [selectedModel, setSelectedModel] = useState<string>(config?.modelName || defaultModel);
  const [temperature, setTemperature] = useState<number>(config?.temperature ?? 0.7);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedId(credentialId || "");
  }, [credentialId]);

  useEffect(() => {
    setSelectedModel(config?.modelName || "");
  }, [config?.modelName]);

  useEffect(() => {
    setModelsLoading(true);
    fetch(`/api/models?provider=${targetProvider}`)
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [targetProvider]);

  const filteredModels = searchQuery
    ? models.filter((m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : models;

  const handleSave = useCallback(() => {
    dispatch(
      updateNodeCredential({ id: nodeId, credentialId: selectedId || null }),
    );
    dispatch(
      updateNodeConfig({
        id: nodeId,
        config: { modelName: selectedModel, temperature },
      }),
    );
    onClose();
  }, [nodeId, selectedId, selectedModel, temperature, dispatch, onClose]);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleTemperatureInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0 && val <= 2) {
      setTemperature(val);
    }
  }, []);

  const providerIcon = resolveModelIcon(targetProvider);
  const selectedCred = credentials.find((c) => c._id === selectedId);

  return (
    <div className="space-y-8">
      {/* ── Credential Section ── */}
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
              schema={getCredentialSchema(
                targetProvider as any,
                "apiKey" as any,
              )!}
              onCreated={handleCredentialCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </section>

      {/* ── Model Selection Section ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Model</h3>

        {modelsLoading ? (
          <div className="text-sm text-[#6B7280] py-3 text-center">Loading models...</div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-[#F8F9FC] border border-[#E7E7E7] pl-9 pr-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[#E7E7E7] bg-white divide-y divide-[#F0F0F0]">
              {filteredModels.length === 0 && (
                <div className="py-6 text-sm text-[#6B7280] text-center">No models found</div>
              )}
              {filteredModels.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left px-3.5 py-3 transition-all duration-150 flex flex-col gap-1.5
                      ${isSelected
                        ? "bg-[#F5F5FF]"
                        : "hover:bg-[#F8F9FC] active:bg-[#F0F0F5]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#5B5CEB] shrink-0" />
                      )}
                      <span className={`text-sm truncate ${isSelected ? "font-semibold text-[#5B5CEB]" : "font-medium text-[#111827]"}`}>
                        {m.label}
                      </span>
                    </div>
                    {(m.contextWindow || m.supportsVision || m.supportsTools || m.supportsReasoning) && (
                      <div className="flex items-center gap-1.5 flex-wrap pl-6">
                        {m.contextWindow && (
                          <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium bg-[#F0F0F5] text-[#6B7280] whitespace-nowrap">
                            {formatContextWindow(m.contextWindow)}
                          </span>
                        )}
                        {m.supportsVision && (
                          <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium bg-[#F0F0F5] text-[#6B7280] whitespace-nowrap">
                            Vision
                          </span>
                        )}
                        {m.supportsTools && (
                          <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium bg-[#F0F0F5] text-[#6B7280] whitespace-nowrap">
                            Tool Calling
                          </span>
                        )}
                        {m.supportsReasoning && (
                          <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-medium bg-[#F0F0F5] text-[#6B7280] whitespace-nowrap">
                            Reasoning
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Generation Settings Section ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Generation Settings</h3>

        <div className="rounded-xl border border-[#E7E7E7] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#6B7280]" />
              <span className="text-sm font-medium text-[#111827]">Temperature</span>
            </div>
            <span className="text-sm font-semibold text-[#111827] tabular-nums">{temperature.toFixed(1)}</span>
          </div>
          <p className="text-xs text-[#6B7280] mb-3">Controls randomness in generated responses. Lower values produce more predictable outputs.</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none bg-[#E7E7E7] cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5B5CEB] [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(91,92,235,0.3)] [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={handleTemperatureInput}
              className="w-14 rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-2 py-1 text-sm text-center text-[#111827] tabular-nums focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#9CA3AF]">Precise</span>
            <span className="text-[10px] text-[#9CA3AF]">Creative</span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-dashed border-[#E7E7E7] p-4">
          <p className="text-xs text-[#9CA3AF] text-center">Additional parameters coming soon</p>
        </div>
      </section>

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