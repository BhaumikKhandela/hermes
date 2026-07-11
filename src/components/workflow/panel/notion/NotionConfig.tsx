"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CredentialForm } from "../CredentialForm";
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
import { NotionContentEditor } from "./NotionContentEditor";
import type { NotionContent } from "@/lib/workflow-tools/tools/notion/types";
import { useJsonValidation } from "./useJsonValidation";

type Props = {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

type ActionType = "query" | "create" | "update" | "retrieve" | "append";

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: "query", label: "Query Source" },
  { value: "create", label: "Create Page" },
  { value: "update", label: "Update Page" },
  { value: "retrieve", label: "Retrieve Page" },
  { value: "append", label: "Add Content" },
];

function JsonField({
  value,
  onChange,
  label,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const { isValid, error } = useJsonValidation(value);

  return (
    <div className="p-4">
      <label className="text-sm font-medium text-[#111827] mb-1.5 block">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`min-h-[${rows ? rows * 24 + 16 : 64}px] resize-y bg-[#F8F9FC] border rounded-xl p-3 text-xs font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] transition-all duration-150 ${
          value.trim() && !isValid
            ? "border-red-300 focus:border-red-400"
            : "border-[#E7E7E7] focus:border-[#5B5CEB]"
        }`}
      />
      {value.trim() && !isValid && error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {value.trim() && isValid && (
        <p className="mt-1 text-xs text-emerald-500">Valid JSON</p>
      )}
    </div>
  );
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center align-middle ml-1 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function NotionConfig({
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Action
  const [action, setAction] = useState<ActionType>(config?.action || "query");

  // Query fields
  const [dataSourceId, setDataSourceId] = useState<string>(config?.dataSourceId || "");
  const [returnAll, setReturnAll] = useState<boolean>(config?.returnAll ?? false);
  const [maxItems, setMaxItems] = useState<number>(config?.maxItems || 10000);
  const [pageSize, setPageSize] = useState<number>(config?.pageSize || 100);
  const [startCursor, setStartCursor] = useState<string>(config?.startCursor || "");

  // Query JSON fields
  const [filterJson, setFilterJson] = useState<string>(
    config?.filter ? JSON.stringify(config.filter, null, 2) : "",
  );
  const [sortsJson, setSortsJson] = useState<string>(
    config?.sorts ? JSON.stringify(config.sorts, null, 2) : "",
  );

  // Create fields
  const [parentId, setParentId] = useState<string>(config?.parentId || "");
  const [parentType, setParentType] = useState<"data_source_id" | "page_id">(
    config?.parentType || "data_source_id",
  );
  const [propertiesJson, setPropertiesJson] = useState<string>(
    config?.properties ? JSON.stringify(config.properties, null, 2) : "",
  );
  const [content, setContent] = useState<NotionContent | undefined>(config?.content);

  // Update fields
  const [updatePageId, setUpdatePageId] = useState<string>(config?.pageId || "");
  const [updatePropertiesJson, setUpdatePropertiesJson] = useState<string>(
    config?.properties ? JSON.stringify(config.properties, null, 2) : "",
  );

  // Retrieve fields
  const [retrievePageId, setRetrievePageId] = useState<string>(config?.pageId || "");
  const [retrieveFormat, setRetrieveFormat] = useState<"metadata" | "markdown" | "blocks">(
    config?.retrieveFormat || "metadata",
  );
  const [includeProperties, setIncludeProperties] = useState<boolean>(
    config?.includeProperties ?? true,
  );

  // Append fields
  const [appendBlockId, setAppendBlockId] = useState<string>(config?.blockId || "");
  const [appendPosition, setAppendPosition] = useState<"start" | "end" | "after_block">(
    config?.position?.type || "end",
  );
  const [appendAfterBlockId, setAppendAfterBlockId] = useState<string>(
    config?.position?.afterBlockId || "",
  );
  const [appendContent, setAppendContent] = useState<NotionContent | undefined>(config?.content);

  // JSON validation
  const filterValidation = useJsonValidation(filterJson);
  const sortsValidation = useJsonValidation(sortsJson);
  const createPropsValidation = useJsonValidation(propertiesJson);
  const updatePropsValidation = useJsonValidation(updatePropertiesJson);

  const hasJsonErrors =
    (!filterJson.trim() ? false : !filterValidation.isValid) ||
    (!sortsJson.trim() ? false : !sortsValidation.isValid) ||
    (!propertiesJson.trim() ? false : !createPropsValidation.isValid) ||
    (!updatePropertiesJson.trim() ? false : !updatePropsValidation.isValid);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};

    if (!isToolMode) {
      saveConfig.action = action;

      switch (action) {
        case "query":
          saveConfig.dataSourceId = dataSourceId;
          if (filterJson.trim()) {
            try { saveConfig.filter = JSON.parse(filterJson); } catch { saveConfig.filter = filterJson; }
          }
          if (sortsJson.trim()) {
            try { saveConfig.sorts = JSON.parse(sortsJson); } catch { saveConfig.sorts = sortsJson; }
          }
          saveConfig.pageSize = pageSize;
          saveConfig.startCursor = startCursor;
          saveConfig.returnAll = returnAll;
          saveConfig.maxItems = maxItems;
          break;
        case "create":
          saveConfig.parentId = parentId;
          saveConfig.parentType = parentType;
          if (propertiesJson.trim()) {
            try { saveConfig.properties = JSON.parse(propertiesJson); } catch { saveConfig.properties = propertiesJson; }
          }
          saveConfig.content = content;
          break;
        case "update":
          saveConfig.pageId = updatePageId;
          if (updatePropertiesJson.trim()) {
            try { saveConfig.properties = JSON.parse(updatePropertiesJson); } catch { saveConfig.properties = updatePropertiesJson; }
          }
          break;
        case "retrieve":
          saveConfig.pageId = retrievePageId;
          saveConfig.retrieveFormat = retrieveFormat;
          saveConfig.includeProperties = includeProperties;
          break;
        case "append":
          saveConfig.blockId = appendBlockId;
          saveConfig.position = {
            type: appendPosition,
            ...(appendPosition === "after_block" ? { afterBlockId: appendAfterBlockId } : {}),
          };
          saveConfig.content = appendContent;
          break;
      }
    }

    save(saveConfig, selectedId);
  }, [
    save, action, selectedId, isToolMode,
    dataSourceId, filterJson, sortsJson, pageSize, startCursor, returnAll, maxItems,
    parentId, parentType, propertiesJson, content,
    updatePageId, updatePropertiesJson,
    retrievePageId, retrieveFormat, includeProperties,
    appendBlockId, appendPosition, appendAfterBlockId, appendContent,
  ]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const notionIcon = resolveToolIcon("notion");

  return (
    <TooltipProvider>
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Notion Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={notionIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No Notion credentials found</ComboboxEmpty>
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
              schema={getCredentialSchema("notion", "apiKey")!}
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
            {/* Action selector */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Action</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ACTION_OPTIONS.map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setAction(op.value)}
                    className={`flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                      action === op.value
                        ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                        : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                    }`}
                  >
                    <span className="leading-tight text-center">{op.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── QUERY FIELDS ── */}
            {action === "query" && (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">
                    Data Source ID
                    <InfoTooltip content="The ID of the Notion data source to query." />
                  </label>
                  <input
                    type="text"
                    value={dataSourceId}
                    onChange={(e) => setDataSourceId(e.target.value)}
                    placeholder="abc123..."
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB]"
                  />
                </div>
                <JsonField
                  value={filterJson}
                  onChange={setFilterJson}
                  label="Filter (JSON)"
                  placeholder='{ "property": "Status", "status": { "equals": "Done" } }'
                  rows={3}
                />
                <JsonField
                  value={sortsJson}
                  onChange={setSortsJson}
                  label="Sorts (JSON)"
                  placeholder='[{ "property": "Created", "direction": "descending" }]'
                  rows={2}
                />
                <div className="p-4">
                  <label className="flex items-center gap-2 text-sm text-[#111827]">
                    <input
                      type="checkbox"
                      checked={returnAll}
                      onChange={(e) => setReturnAll(e.target.checked)}
                      className="rounded border-[#D1D5DB]"
                    />
                    <span className="font-medium">Return all results</span>
                  </label>
                  <p className="text-xs text-[#6B7280] mt-1 ml-5">
                    Automatically paginate through results up to the maximum item limit.
                  </p>
                </div>
                {returnAll ? (
                  <div className="p-4">
                    <label className="text-sm font-medium text-[#111827] mb-1.5 block">Maximum Items</label>
                    <input
                      type="number"
                      value={maxItems}
                      onChange={(e) => setMaxItems(parseInt(e.target.value) || 10000)}
                      min={1}
                      max={10000}
                      className="w-24 rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="p-4">
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Page Size</label>
                      <input
                        type="number"
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value) || 100)}
                        min={1}
                        max={100}
                        className="w-24 rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                      />
                    </div>
                    <div className="p-4">
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Start Cursor</label>
                      <input
                        type="text"
                        value={startCursor}
                        onChange={(e) => setStartCursor(e.target.value)}
                        placeholder="Optional cursor for pagination"
                        className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── CREATE FIELDS ── */}
            {action === "create" && (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Parent Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setParentType("data_source_id")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        parentType === "data_source_id"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      Data Source
                    </button>
                    <button
                      onClick={() => setParentType("page_id")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        parentType === "page_id"
                          ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                          : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                      }`}
                    >
                      Page
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Parent ID</label>
                  <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder={parentType === "data_source_id" ? "Data source UUID" : "Page UUID"}
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                  />
                </div>
                <JsonField
                  value={propertiesJson}
                  onChange={setPropertiesJson}
                  label="Properties (JSON)"
                  placeholder='{ "Name": { "title": [{ "type": "text", "text": { "content": "My Page" } }] } }'
                  rows={4}
                />
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Content</label>
                  <NotionContentEditor value={content} onChange={setContent} />
                </div>
              </>
            )}

            {/* ── UPDATE FIELDS ── */}
            {action === "update" && (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">
                    Page ID
                    <InfoTooltip content="The ID of the Notion page used by this operation." />
                  </label>
                  <input
                    type="text"
                    value={updatePageId}
                    onChange={(e) => setUpdatePageId(e.target.value)}
                    placeholder="Page UUID"
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                  />
                </div>
                <JsonField
                  value={updatePropertiesJson}
                  onChange={setUpdatePropertiesJson}
                  label="Properties (JSON)"
                  placeholder='{ "Status": { "select": { "name": "Done" } } }'
                  rows={4}
                />
              </>
            )}

            {/* ── RETRIEVE FIELDS ── */}
            {action === "retrieve" && (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">
                    Page ID
                    <InfoTooltip content="The ID of the Notion page used by this operation." />
                  </label>
                  <input
                    type="text"
                    value={retrievePageId}
                    onChange={(e) => setRetrievePageId(e.target.value)}
                    placeholder="Page UUID"
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                  />
                </div>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Retrieve As</label>
                  <div className="flex gap-2">
                    {(["metadata", "markdown", "blocks"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setRetrieveFormat(f)}
                        className={`flex flex-col items-center flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          retrieveFormat === f
                            ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                            : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                        }`}
                      >
                        <span>{f === "metadata" ? "Page" : f === "markdown" ? "Markdown" : "Blocks"}</span>
                        <span className="text-[10px] font-normal mt-0.5 opacity-70">
                          {f === "metadata" ? "Page metadata & properties" : f === "markdown" ? "Content as Markdown" : "Content as block JSON"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <label className="flex items-center gap-2 text-sm text-[#111827]">
                    <input
                      type="checkbox"
                      checked={includeProperties}
                      onChange={(e) => setIncludeProperties(e.target.checked)}
                      className="rounded border-[#D1D5DB]"
                    />
                    <span className="font-medium">Include properties</span>
                  </label>
                </div>
              </>
            )}

            {/* ── APPEND FIELDS ── */}
            {action === "append" && (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">
                    Target Block ID
                    <InfoTooltip content="The block that will receive the new content. A page ID can also be used when adding content to the page root." />
                  </label>
                  <input
                    type="text"
                    value={appendBlockId}
                    onChange={(e) => setAppendBlockId(e.target.value)}
                    placeholder="Block UUID (or Page UUID)"
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                  />
                </div>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Position</label>
                  <div className="flex gap-2 mb-2">
                    {(["start", "end", "after_block"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setAppendPosition(p)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          appendPosition === p
                            ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                            : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                        }`}
                      >
                        {p === "start" ? "Start" : p === "end" ? "End" : "After Block"}
                      </button>
                    ))}
                  </div>
                  {appendPosition === "after_block" && (
                    <input
                      type="text"
                      value={appendAfterBlockId}
                      onChange={(e) => setAppendAfterBlockId(e.target.value)}
                      placeholder="Block UUID to insert after"
                      className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                    />
                  )}
                </div>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Content</label>
                  <NotionContentEditor value={appendContent} onChange={setAppendContent} />
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={hasJsonErrors} className="flex-1 rounded-xl">
          Save
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827]">
          Cancel
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
}
