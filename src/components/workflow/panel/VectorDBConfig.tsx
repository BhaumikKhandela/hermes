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

type VecOp = "query" | "upsert" | "delete";
type DeleteMode = "byId" | "byFilter";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

export function VectorDBConfig({
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
  const [vecOp, setVecOp] = useState<VecOp>(config?.action || "query");
  const [vector, setVector] = useState<string>(
    config?.vector ? JSON.stringify(config.vector) : "",
  );
  const [topK, setTopK] = useState<string>(
    config?.topK ? String(config.topK) : "5",
  );
  const [namespace, setNamespace] = useState<string>(config?.namespace || "");
  const [filter, setFilter] = useState<string>(
    config?.filter ? JSON.stringify(config.filter, null, 2) : "",
  );
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(
    config?.includeMetadata !== false,
  );
  const [upsertId, setUpsertId] = useState<string>(config?.id || "");
  const [metadata, setMetadata] = useState<string>(
    config?.metadata ? JSON.stringify(config.metadata, null, 2) : "",
  );
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(
    config?.filter && !config?.id ? "byFilter" : "byId",
  );
  const [deleteId, setDeleteId] = useState<string>(config?.id || "");
  const [deleteFilter, setDeleteFilter] = useState<string>(
    config?.filter ? JSON.stringify(config.filter, null, 2) : "",
  );
  const [deleteAll, setDeleteAll] = useState<boolean>(config?.deleteAll || false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      saveConfig.action = vecOp;
      saveConfig.namespace = namespace;

      if (vecOp === "query") {
        try { saveConfig.vector = JSON.parse(vector); } catch {}
        if (topK) {
          const parsed = parseInt(topK, 10);
          if (!isNaN(parsed)) saveConfig.topK = parsed;
        }
        saveConfig.includeMetadata = includeMetadata;
        try { saveConfig.filter = JSON.parse(filter); } catch {}
      } else if (vecOp === "upsert") {
        try { saveConfig.vector = JSON.parse(vector); } catch {}
        saveConfig.id = upsertId;
        try { saveConfig.metadata = JSON.parse(metadata); } catch {}
      } else if (vecOp === "delete") {
        if (deleteMode === "byId") {
          saveConfig.id = deleteId;
          saveConfig.deleteAll = false;
        } else {
          try { saveConfig.filter = JSON.parse(deleteFilter); } catch {}
          saveConfig.deleteAll = deleteAll;
        }
      }
    }
    save(saveConfig, selectedId);
  }, [save, vecOp, vector, topK, namespace, filter, includeMetadata, upsertId, metadata, deleteMode, deleteId, deleteFilter, deleteAll, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const dbIcon = resolveToolIcon("pinecone");

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Pinecone Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={dbIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No Pinecone credentials found</ComboboxEmpty>
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
            Add new Pinecone credential
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("pinecone", "apiKey")!}
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
            {/* Operation Selector */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Operation</label>
              <p className="text-xs text-[#6B7280] mb-2">Select the vector database operation to perform.</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "query" as VecOp, label: "Query", desc: "Search vectors" },
                  { value: "upsert" as VecOp, label: "Upsert", desc: "Insert or update" },
                  { value: "delete" as VecOp, label: "Delete", desc: "Remove vectors" },
                ].map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setVecOp(op.value)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                      vecOp === op.value
                        ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                        : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                    }`}
                  >
                    <span>{op.label}</span>
                    <span className="text-[10px] opacity-70">{op.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Namespace */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Namespace</label>
              <p className="text-xs text-[#6B7280] mb-2">Pinecone namespace (leave empty for default).</p>
              <input
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                placeholder="my-namespace"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Per-operation fields */}
            <div className="p-4">
              {vecOp === "query" && (
                <>
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Vector (JSON array)</label>
                  <p className="text-xs text-[#6B7280] mb-2">The query vector to search with.</p>
                  <Textarea
                    value={vector}
                    onChange={(e) => setVector(e.target.value)}
                    placeholder="[0.1, 0.2, 0.3, ...]"
                    rows={3}
                    className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Top K</label>
                      <input
                        type="number"
                        value={topK}
                        onChange={(e) => setTopK(e.target.value)}
                        min={1}
                        max={10000}
                        className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </div>
                    <label className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="w-4 h-4 rounded border-[#E7E7E7] text-[#5B5CEB] focus:ring-[rgba(91,92,235,0.15)]"
                      />
                      <span className="text-sm text-[#111827]">Include Metadata</span>
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">Filter (JSON, optional)</label>
                    <p className="text-xs text-[#6B7280] mb-2">Metadata filter to narrow results.</p>
                    <Textarea
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder='{ "genre": "rock" }'
                      rows={2}
                      className="min-h-[48px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                    />
                  </div>
                </>
              )}
              {vecOp === "upsert" && (
                <>
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Vector (JSON array)</label>
                  <p className="text-xs text-[#6B7280] mb-2">The vector to insert or update.</p>
                  <Textarea
                    value={vector}
                    onChange={(e) => setVector(e.target.value)}
                    placeholder="[0.1, 0.2, 0.3, ...]"
                    rows={3}
                    className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                  <div className="mt-3">
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">ID</label>
                    <p className="text-xs text-[#6B7280] mb-2">Unique identifier for this vector.</p>
                    <input
                      type="text"
                      value={upsertId}
                      onChange={(e) => setUpsertId(e.target.value)}
                      placeholder="vec-001"
                      className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">Metadata (JSON, optional)</label>
                    <p className="text-xs text-[#6B7280] mb-2">Metadata to attach to the vector.</p>
                    <Textarea
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      placeholder='{ "title": "My Document", "genre": "rock" }'
                      rows={3}
                      className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                    />
                  </div>
                </>
              )}
              {vecOp === "delete" && (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setDeleteMode("byId")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        deleteMode === "byId"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      By ID
                    </button>
                    <button
                      onClick={() => setDeleteMode("byFilter")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        deleteMode === "byFilter"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      By Filter
                    </button>
                  </div>
                  {deleteMode === "byId" ? (
                    <div>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">ID</label>
                      <p className="text-xs text-[#6B7280] mb-2">ID of the vector to delete.</p>
                      <input
                        type="text"
                        value={deleteId}
                        onChange={(e) => setDeleteId(e.target.value)}
                        placeholder="vec-001"
                        className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={deleteAll}
                            onChange={(e) => setDeleteAll(e.target.checked)}
                            className="w-4 h-4 rounded border-[#E7E7E7] text-[#5B5CEB] focus:ring-[rgba(91,92,235,0.15)]"
                          />
                          <span className="text-sm text-[#111827]">Delete All</span>
                        </label>
                      </div>
                      {!deleteAll && (
                        <div>
                          <label className="text-sm font-medium text-[#111827] mb-1.5 block">Filter (JSON)</label>
                          <p className="text-xs text-[#6B7280] mb-2">Metadata filter to match vectors to delete.</p>
                          <Textarea
                            value={deleteFilter}
                            onChange={(e) => setDeleteFilter(e.target.value)}
                            placeholder='{ "genre": "rock" }'
                            rows={3}
                            className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
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
