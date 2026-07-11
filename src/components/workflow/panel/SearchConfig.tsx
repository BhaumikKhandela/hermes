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

export function SearchConfig({
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
  const [query, setQuery] = useState<string>(config?.query || "");
  const [maxResults, setMaxResults] = useState<string>(
    config?.maxResults ? String(config.maxResults) : "5",
  );
  const [searchDepth, setSearchDepth] = useState<"basic" | "advanced">(
    config?.searchDepth || "basic",
  );
  const [includeAnswer, setIncludeAnswer] = useState<boolean>(
    config?.includeAnswer ?? false,
  );
  const [includeImages, setIncludeImages] = useState<boolean>(
    config?.includeImages ?? false,
  );
  const [includeDomains, setIncludeDomains] = useState<string>(
    config?.includeDomains?.join(", ") || "",
  );
  const [excludeDomains, setExcludeDomains] = useState<string>(
    config?.excludeDomains?.join(", ") || "",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      saveConfig.query = query;
      if (maxResults) {
        const parsed = parseInt(maxResults, 10);
        if (!isNaN(parsed)) saveConfig.maxResults = parsed;
      }
      saveConfig.searchDepth = searchDepth;
      saveConfig.includeAnswer = includeAnswer;
      saveConfig.includeImages = includeImages;
      saveConfig.includeDomains = includeDomains
        ? includeDomains.split(",").map((d) => d.trim()).filter(Boolean)
        : undefined;
      saveConfig.excludeDomains = excludeDomains
        ? excludeDomains.split(",").map((d) => d.trim()).filter(Boolean)
        : undefined;
    }
    save(saveConfig, selectedId);
  }, [save, query, maxResults, searchDepth, includeAnswer, includeImages, includeDomains, excludeDomains, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const searchIcon = resolveToolIcon("search");

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Tavily Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={searchIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No Tavily credentials found</ComboboxEmpty>
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
            Add new Tavily credential
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("tavily", "apiKey")!}
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
            {/* Query */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Search Query</label>
              <p className="text-xs text-[#6B7280] mb-2">What to search for on the web.</p>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="latest developments in AI"
                rows={3}
                className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Max Results + Search Depth */}
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Max Results</label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(e.target.value)}
                    min={1}
                    max={10}
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Search Depth</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSearchDepth("basic")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        searchDepth === "basic"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setSearchDepth("advanced")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        searchDepth === "advanced"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Include Answer + Include Images */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Response Options</label>
              <p className="text-xs text-[#6B7280] mb-2">Extra data to include in the response.</p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeAnswer}
                    onChange={(e) => setIncludeAnswer(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E7E7E7] text-[#5B5CEB] focus:ring-[rgba(91,92,235,0.15)]"
                  />
                  <span className="text-sm text-[#111827]">Include Answer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E7E7E7] text-[#5B5CEB] focus:ring-[rgba(91,92,235,0.15)]"
                  />
                  <span className="text-sm text-[#111827]">Include Images</span>
                </label>
              </div>
            </div>

            {/* Include Domains */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Include Domains (optional)</label>
              <p className="text-xs text-[#6B7280] mb-2">Comma-separated list. Only return results from these domains.</p>
              <input
                type="text"
                value={includeDomains}
                onChange={(e) => setIncludeDomains(e.target.value)}
                placeholder="techcrunch.com, arstechnica.com"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Exclude Domains */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Exclude Domains (optional)</label>
              <p className="text-xs text-[#6B7280] mb-2">Comma-separated list. Exclude results from these domains.</p>
              <input
                type="text"
                value={excludeDomains}
                onChange={(e) => setExcludeDomains(e.target.value)}
                placeholder="spam-site.com, clickbait.xyz"
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
