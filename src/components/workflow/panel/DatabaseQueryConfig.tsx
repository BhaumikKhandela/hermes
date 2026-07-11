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
import type { CredentialMetadata, CredentialProvider, AuthMethod } from "@/lib/credentials/types";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";
import { resolveToolIcon } from "@/lib/workflow-tools/iconMap";
import { useNodeConfig } from "@/hooks/useNodeConfig";

type DbType = "postgres" | "mysql" | "mongodb";
type MongoOp = "find" | "aggregate" | "insertOne" | "insertMany" | "update" | "delete";

type Props = {
  nodeId: string;
  dbType: DbType;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

const DB_ICONS: Record<DbType, string> = {
  postgres: "postgresDB",
  mysql: "mysqlDB",
  mongodb: "mongoDB",
};

const DB_LABELS: Record<DbType, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
};

function getProvider(dbType: DbType): [CredentialProvider, AuthMethod] {
  switch (dbType) {
    case "postgres": return ["postgres", "userPassword"];
    case "mysql": return ["mysql", "userPassword"];
    case "mongodb": return ["mongodb", "connectionString"];
  }
}

export function DatabaseQueryConfig({
  nodeId,
  dbType,
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
  const [sql, setSql] = useState<string>(config?.sql || "");
  const [values, setValues] = useState<string>(
    config?.values ? JSON.stringify(config.values) : "",
  );
  const [collection, setCollection] = useState<string>(config?.collection || "");
  const [mongoOp, setMongoOp] = useState<MongoOp>(
    config?.pipeline ? "aggregate"
    : config?.action === "insert" && config?.documents ? "insertMany"
    : config?.action === "insert" ? "insertOne"
    : config?.action === "update" ? "update"
    : config?.action === "delete" ? "delete"
    : "find",
  );
  const [filter, setFilter] = useState<string>(
    config?.filter ? JSON.stringify(config.filter, null, 2) : "",
  );
  const [pipeline, setPipeline] = useState<string>(
    config?.pipeline ? JSON.stringify(config.pipeline, null, 2) : "",
  );
  const [mongoDocument, setMongoDocument] = useState<string>(
    config?.document ? JSON.stringify(config.document, null, 2) : "",
  );
  const [mongoDocuments, setMongoDocuments] = useState<string>(
    config?.documents ? JSON.stringify(config.documents, null, 2) : "",
  );
  const [updateData, setUpdateData] = useState<string>(
    config?.data ? JSON.stringify(config.data, null, 2) : "",
  );
  const [mongoLimit, setMongoLimit] = useState<string>(
    config?.limit ? String(config.limit) : "",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const handleSave = useCallback(() => {
    const saveConfig: Record<string, any> = {};
    if (!isToolMode) {
      if (dbType === "mongodb") {
        saveConfig.collection = collection;
        if (mongoOp === "find") {
          saveConfig.action = "query";
          try { saveConfig.filter = JSON.parse(filter); } catch {}
          if (mongoLimit) {
            const parsed = parseInt(mongoLimit, 10);
            if (!isNaN(parsed)) saveConfig.limit = parsed;
          }
        } else if (mongoOp === "aggregate") {
          saveConfig.action = "query";
          try { saveConfig.pipeline = JSON.parse(pipeline); } catch {}
        } else if (mongoOp === "insertOne") {
          saveConfig.action = "insert";
          try { saveConfig.document = JSON.parse(mongoDocument); } catch {}
        } else if (mongoOp === "insertMany") {
          saveConfig.action = "insert";
          try { saveConfig.documents = JSON.parse(mongoDocuments); } catch {}
        } else if (mongoOp === "update") {
          saveConfig.action = "update";
          try { saveConfig.filter = JSON.parse(filter); } catch {}
          try { saveConfig.data = JSON.parse(updateData); } catch {}
        } else if (mongoOp === "delete") {
          saveConfig.action = "delete";
          try { saveConfig.filter = JSON.parse(filter); } catch {}
        }
      } else {
        saveConfig.sql = sql;
        try { saveConfig.values = JSON.parse(values); } catch {}
      }
    }
    save(saveConfig, selectedId);
  }, [save, dbType, sql, values, collection, mongoOp, filter, pipeline, mongoDocument, mongoDocuments, updateData, mongoLimit, selectedId, isToolMode]);

  const selectedCred = credentials.find((c) => c._id === selectedId);
  const dbIcon = resolveToolIcon(DB_ICONS[dbType]);

  return (
    <div className="space-y-8">
      {/* ── Credential ── */}
      <section>
        <h3 className="text-[13px] font-semibold text-[#111827] mb-3">{DB_LABELS[dbType]} Credential</h3>

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
                <ComboboxEmpty>No {dbType} credentials found</ComboboxEmpty>
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
            Add new {dbType} credential
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E7E7E7] p-3 bg-white">
            <CredentialForm
              schema={getCredentialSchema(getProvider(dbType)[0], getProvider(dbType)[1])!}
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
            {dbType === "mongodb" ? (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Collection</label>
                  <p className="text-xs text-[#6B7280] mb-2">MongoDB collection name.</p>
                  <input
                    type="text"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    placeholder="users"
                    className="w-full rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                </div>

                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Operation</label>
                  <p className="text-xs text-[#6B7280] mb-2">Select the database operation to perform.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "find" as MongoOp, label: "Find", desc: "Query documents" },
                      { value: "aggregate" as MongoOp, label: "Aggregate", desc: "Pipeline stages" },
                      { value: "insertOne" as MongoOp, label: "Insert One", desc: "Single document" },
                      { value: "insertMany" as MongoOp, label: "Insert Many", desc: "Batch documents" },
                      { value: "update" as MongoOp, label: "Update", desc: "Modify documents" },
                      { value: "delete" as MongoOp, label: "Delete", desc: "Remove documents" },
                    ].map((op) => (
                      <button
                        key={op.value}
                        onClick={() => setMongoOp(op.value)}
                        className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                          mongoOp === op.value
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

                <div className="p-4">
                  {mongoOp === "find" && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-[#111827] flex-1">Filter (JSON)</label>
                        <input
                          type="text"
                          value={mongoLimit}
                          onChange={(e) => setMongoLimit(e.target.value)}
                          placeholder="Limit"
                          className="w-20 rounded-lg border border-[#E7E7E7] bg-[#F8F9FC] px-2 py-1.5 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                        />
                      </div>
                      <p className="text-xs text-[#6B7280] mb-2">MongoDB filter document. Use <code>{}</code> for all documents.</p>
                      <Textarea
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder='{ "status": "active", "age": { "$gt": 21 } }'
                        rows={4}
                        className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                  {mongoOp === "aggregate" && (
                    <>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Pipeline (JSON)</label>
                      <p className="text-xs text-[#6B7280] mb-2">MongoDB aggregation pipeline array.</p>
                      <Textarea
                        value={pipeline}
                        onChange={(e) => setPipeline(e.target.value)}
                        placeholder='[{ "$match": { "status": "active" } }, { "$group": { "_id": "$category", "count": { "$sum": 1 } } }]'
                        rows={6}
                        className="min-h-[144px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                  {mongoOp === "insertOne" && (
                    <>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Document (JSON)</label>
                      <p className="text-xs text-[#6B7280] mb-2">The document to insert.</p>
                      <Textarea
                        value={mongoDocument}
                        onChange={(e) => setMongoDocument(e.target.value)}
                        placeholder='{ "name": "John", "email": "john@example.com", "role": "admin" }'
                        rows={5}
                        className="min-h-[120px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                  {mongoOp === "insertMany" && (
                    <>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Documents (JSON array)</label>
                      <p className="text-xs text-[#6B7280] mb-2">Array of documents to insert in batch.</p>
                      <Textarea
                        value={mongoDocuments}
                        onChange={(e) => setMongoDocuments(e.target.value)}
                        placeholder='[{ "name": "John" }, { "name": "Jane" }, { "name": "Bob" }]'
                        rows={5}
                        className="min-h-[120px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                  {mongoOp === "update" && (
                    <>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Filter (JSON)</label>
                      <p className="text-xs text-[#6B7280] mb-2">Select documents to update.</p>
                      <Textarea
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder='{ "status": "inactive" }'
                        rows={3}
                        className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block mt-3">Update (JSON)</label>
                      <p className="text-xs text-[#6B7280] mb-2">Update operators to apply.</p>
                      <Textarea
                        value={updateData}
                        onChange={(e) => setUpdateData(e.target.value)}
                        placeholder='{ "$set": { "status": "active", "updatedAt": "2025-01-01" } }'
                        rows={3}
                        className="min-h-[72px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                  {mongoOp === "delete" && (
                    <>
                      <label className="text-sm font-medium text-[#111827] mb-1.5 block">Filter (JSON)</label>
                      <p className="text-xs text-[#6B7280] mb-2">MongoDB filter to match documents to delete. Use <code>{}</code> to delete all.</p>
                      <Textarea
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder='{ "status": "archived" }'
                        rows={4}
                        className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                      />
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">SQL Query</label>
                  <p className="text-xs text-[#6B7280] mb-2">Raw SQL query. Use <code>$1</code>, <code>$2</code> (PostgreSQL) or <code>?</code> (MySQL) for parameterized values.</p>
                  <Textarea
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    placeholder="SELECT * FROM users WHERE status = $1 AND age > $2"
                    rows={4}
                    className="min-h-[96px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                </div>
                <div className="p-4">
                  <label className="text-sm font-medium text-[#111827] mb-1.5 block">Values (JSON, optional)</label>
                  <p className="text-xs text-[#6B7280] mb-2">Parameterized values array for the SQL query.</p>
                  <Textarea
                    value={values}
                    onChange={(e) => setValues(e.target.value)}
                    placeholder='["active", 21]'
                    rows={2}
                    className="min-h-[48px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
                  />
                </div>
              </>
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
