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

const CRED_SCHEMAS = [
  { provider: "google-sheets" as const, authMethod: "apiKey" as const, label: "API Key" },
  { provider: "google-sheets" as const, authMethod: "serviceAccount" as const, label: "Service Account" },
];

export function SheetConfig({
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
  const [action, setAction] = useState<"read" | "update" | "append">(config?.action || "read");
  const [spreadsheetId, setSpreadsheetId] = useState<string>(config?.spreadsheetId || "");
  const [range, setRange] = useState<string>(config?.range || "");
  const [values, setValues] = useState<string>(
    config?.values ? JSON.stringify(config.values) : "",
  );
  const [insertDataOption, setInsertDataOption] = useState<"INSERT_ROWS" | "OVERWRITE">(
    config?.insertDataOption || "INSERT_ROWS",
  );
  const [authMethod, setAuthMethod] = useState<"apiKey" | "serviceAccount">("apiKey");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      saveConfig.action = action;
      saveConfig.spreadsheetId = spreadsheetId;
      saveConfig.range = range;
      if ((action === "update" || action === "append") && values) {
        try { saveConfig.values = JSON.parse(values); } catch { saveConfig.values = values; }
      }
      if (action === "append") {
        saveConfig.insertDataOption = insertDataOption;
      }
    }
    save(saveConfig, selectedId);
  }, [save, action, spreadsheetId, range, values, insertDataOption, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const sheetIcon = resolveToolIcon("sheet");

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">Google Sheets Credential</h3>

        {selectedCred ? (
          <div className="rounded-xl border border-[#E7E7E7] bg-white p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5FF] flex items-center justify-center shrink-0">
                <img src={sheetIcon} alt="" className="w-4 h-4" />
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
                <ComboboxEmpty>No Google Sheets credentials found</ComboboxEmpty>
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
          <div className="mt-2 space-y-2">
            <p className="text-xs text-[#6B7280]">Select an auth method to create:</p>
            <div className="flex gap-2">
              {CRED_SCHEMAS.map((s) => (
                <button
                  key={s.authMethod}
                  onClick={() => {
                    setAuthMethod(s.authMethod);
                    setShowCreateForm(true);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF] hover:text-[#5B5CEB] transition-colors duration-150"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema("google-sheets", authMethod)!}
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
            {/* Operation */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Operation</label>
              <p className="text-xs text-[#6B7280] mb-2">Read cells, update a range, or append rows to the sheet.</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "read" as const, label: "Read", desc: "Get cell values" },
                  { value: "update" as const, label: "Update", desc: "Overwrite cells" },
                  { value: "append" as const, label: "Append", desc: "Add rows" },
                ].map((op) => (
                  <button
                    key={op.value}
                    onClick={() => setAction(op.value)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                      action === op.value
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

            {/* Spreadsheet ID */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Spreadsheet ID</label>
              <p className="text-xs text-[#6B7280] mb-2">The ID from the spreadsheet URL.</p>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Range */}
            <div className="p-4">
              <label className="text-sm font-medium text-[#111827] mb-1.5 block">Range</label>
              <p className="text-xs text-[#6B7280] mb-2">Sheet name and cell range.</p>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Sheet1!A1:B10"
                className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
              />
            </div>

            {/* Values (update and append) */}
            {(action === "update" || action === "append") && (
              <div className="p-4">
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Values (JSON)</label>
                <p className="text-xs text-[#6B7280] mb-2">Array of values or 2D array of rows.</p>
                <Textarea
                  value={values}
                  onChange={(e) => setValues(e.target.value)}
                  placeholder='["value1", "value2"]'
                  rows={4}
                  className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                />
              </div>
            )}

            {/* Insert mode (append only) */}
            {action === "append" && (
              <div className="p-4">
                <label className="text-sm font-medium text-[#111827] mb-1.5 block">Insert Mode</label>
                <p className="text-xs text-[#6B7280] mb-2">How to handle existing rows when appending.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInsertDataOption("INSERT_ROWS")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      insertDataOption === "INSERT_ROWS"
                        ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                        : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                    }`}
                  >
                    Insert Rows
                  </button>
                  <button
                    onClick={() => setInsertDataOption("OVERWRITE")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      insertDataOption === "OVERWRITE"
                        ? "bg-[#F5F5FF] text-[#5B5CEB] border border-[#C7C8FF]"
                        : "bg-[#F8F9FC] text-[#6B7280] border border-[#E7E7E7] hover:border-[#C7C8FF]"
                    }`}
                  >
                    Overwrite
                  </button>
                </div>
              </div>
            )}
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
