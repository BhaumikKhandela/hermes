"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNodeConfig } from "@/hooks/useNodeConfig";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { CredentialForm } from "@/components/workflow/panel/CredentialForm";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";
import type { CredentialMetadata } from "@/lib/credentials/types";
import { objectStorageActions } from "@/lib/workflow-tools/tools/object-storage/schema";

const PROVIDER_OPTIONS = [
  { value: "s3", label: "AWS S3" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "gcs", label: "Google Cloud Storage" },
  { value: "azure-blob", label: "Azure Blob Storage" },
] as const;

type ProviderValue = typeof PROVIDER_OPTIONS[number]["value"];

const ACTIONS_WITH_BODY = new Set(["put_object"]);
const ACTIONS_WITH_DESTINATION = new Set(["copy_object", "move_object"]);
const ACTIONS_WITH_METADATA = new Set(["put_object", "update_metadata"]);
const ACTIONS_WITH_IF_EXISTS = new Set(["put_object", "copy_object", "move_object"]);
const ACTIONS_WITH_EXPIRES = new Set(["generate_upload_url", "generate_download_url"]);
const ACTIONS_WITH_PREFIX = new Set(["list_objects"]);
const ACTIONS_WITH_RETURN_ENCODING = new Set(["read_object"]);

export function ObjectStorageConfig({
  nodeId,
  credentialId: existingCredentialId,
  config: existingConfig,
  credentials: externalCredentials,
  loading: externalLoading,
  onClose,
}: {
  nodeId: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
}) {
  const { save } = useNodeConfig(nodeId, onClose);

  const [provider, setProvider] = useState<ProviderValue>(
    (existingConfig?.provider as ProviderValue) || "s3",
  );
  const [action, setAction] = useState(existingConfig?.action || "");
  const [creds, setCreds] = useState<CredentialMetadata[]>(externalCredentials);
  const [selectedId, setSelectedId] = useState<string | null>(existingCredentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(externalLoading);
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({
    ...existingConfig,
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/credentials?provider=${provider}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.credentials || []).filter(
          (c: CredentialMetadata) =>
            c.provider === provider && c.authMethod === getAuthMethodForProvider(provider),
        );
        setCreds(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [provider]);

  const handleChange = useCallback((key: string, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const config = {
      ...localConfig,
      provider,
      action,
    };
    save(config, selectedId);
  }, [localConfig, provider, action, selectedId, save]);

  const selectedCred = creds.find((c) => c._id === selectedId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Provider</Label>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setProvider(opt.value);
                setSelectedId(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                provider === opt.value
                  ? "bg-[#5B5CEB] text-white border-[#5B5CEB]"
                  : "bg-white text-[#374151] border-[#E7E7E7] hover:border-[#5B5CEB]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Credential</Label>
        <Combobox
          value={selectedId || ""}
          onValueChange={(val) => setSelectedId(val || null)}
        >
          <ComboboxInput
            placeholder="Search credentials..."
            className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]"
          />
          <ComboboxContent>
            <ComboboxList>
              {loading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
              <ComboboxEmpty>No credentials found</ComboboxEmpty>
              {creds.map((c) => (
                <ComboboxItem key={c._id} value={c._id}>
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    {c.providerAccountId && (
                      <span className="text-xs text-[#6B7280]">{c.providerAccountId}</span>
                    )}
                  </div>
                  <Badge
                    variant={c.status === "active" ? "default" : "destructive"}
                    className="ml-auto text-[10px]"
                  >
                    {c.status}
                  </Badge>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {selectedCred && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
            <Badge variant="outline" className="text-[10px] rounded-full">{selectedCred.provider}</Badge>
            <span>{selectedCred.authMethod}</span>
          </div>
        )}

        {!showCreateForm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => setShowCreateForm(true)}
          >
            Add New Credential
          </Button>
        ) : (
          <CredentialForm
            schema={getCredentialSchema(provider as any, getAuthMethodForProvider(provider) as any)!}
            onCreated={(id) => {
              setShowCreateForm(false);
              setSelectedId(id);
              setCreds((prev) => [...prev, { _id: id } as CredentialMetadata]);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px] font-semibold text-[#111827]">Action</Label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
        >
          <option value="">Select action...</option>
          {objectStorageActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {action && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Bucket</Label>
            <Input
              value={localConfig.bucket || ""}
              onChange={(e) => handleChange("bucket", e.target.value)}
              placeholder="my-bucket"
              className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-semibold text-[#111827]">Object Key</Label>
            <Input
              value={localConfig.key || ""}
              onChange={(e) => handleChange("key", e.target.value)}
              placeholder="path/to/object"
              className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
            />
          </div>

          {ACTIONS_WITH_DESTINATION.has(action) && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#111827]">Destination Bucket</Label>
                <Input
                  value={localConfig.destinationBucket || ""}
                  onChange={(e) => handleChange("destinationBucket", e.target.value)}
                  placeholder="dest-bucket"
                  className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#111827]">Destination Key</Label>
                <Input
                  value={localConfig.destinationKey || ""}
                  onChange={(e) => handleChange("destinationKey", e.target.value)}
                  placeholder="dest/path"
                  className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                />
              </div>
            </>
          )}

          {ACTIONS_WITH_BODY.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Body</Label>
              <Textarea
                value={localConfig.body || ""}
                onChange={(e) => handleChange("body", e.target.value)}
                placeholder="Object content"
                rows={4}
                className="min-h-[80px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              />
              <div className="flex gap-2 mt-1">
                <Label className="text-[11px] text-[#6B7280]">Encoding:</Label>
                <select
                  value={localConfig.encoding || "utf-8"}
                  onChange={(e) => handleChange("encoding", e.target.value)}
                  className="text-[11px] bg-transparent border-none text-[#6B7280] focus:outline-none"
                >
                  <option value="utf-8">utf-8</option>
                  <option value="base64">base64</option>
                  <option value="json">json</option>
                </select>
              </div>
            </div>
          )}

          {ACTIONS_WITH_RETURN_ENCODING.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Return Encoding</Label>
              <select
                value={localConfig.returnEncoding || "utf-8"}
                onChange={(e) => handleChange("returnEncoding", e.target.value)}
                className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              >
                <option value="utf-8">utf-8 (text)</option>
                <option value="base64">base64</option>
                <option value="json">json (parsed)</option>
                <option value="raw">raw (base64 binary)</option>
              </select>
            </div>
          )}

          {ACTIONS_WITH_IF_EXISTS.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">If Object Exists</Label>
              <select
                value={localConfig.ifExists || "overwrite"}
                onChange={(e) => handleChange("ifExists", e.target.value)}
                className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              >
                <option value="overwrite">Overwrite</option>
                <option value="error">Error (fail if exists)</option>
                <option value="skip">Skip (keep existing)</option>
              </select>
            </div>
          )}

          {ACTIONS_WITH_METADATA.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Metadata (JSON)</Label>
              <Textarea
                value={localConfig.metadata || ""}
                onChange={(e) => handleChange("metadata", e.target.value)}
                placeholder='{"key": "value"}'
                rows={3}
                className="min-h-[60px] resize-y rounded-xl bg-[#F5F5F5] border-[#E7E7E7] font-mono text-sm focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              />
            </div>
          )}

          {action === "put_object" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#111827]">Content Type</Label>
                <Input
                  value={localConfig.contentType || ""}
                  onChange={(e) => handleChange("contentType", e.target.value)}
                  placeholder="text/plain"
                  className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px] font-semibold text-[#111827]">Cache Control</Label>
                <Input
                  value={localConfig.cacheControl || ""}
                  onChange={(e) => handleChange("cacheControl", e.target.value)}
                  placeholder="public, max-age=3600"
                  className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
                />
              </div>
            </>
          )}

          {ACTIONS_WITH_PREFIX.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Prefix</Label>
              <Input
                value={localConfig.prefix || ""}
                onChange={(e) => handleChange("prefix", e.target.value)}
                placeholder="folder/"
                className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="recursive"
                  checked={localConfig.recursive !== false}
                  onChange={(e) => handleChange("recursive", e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="recursive" className="text-[11px] text-[#6B7280]">Recursive</label>
              </div>
            </div>
          )}

          {ACTIONS_WITH_EXPIRES.has(action) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-semibold text-[#111827]">Expires In (seconds)</Label>
              <Input
                type="number"
                value={localConfig.expiresIn ?? 3600}
                onChange={(e) => handleChange("expiresIn", parseInt(e.target.value) || 3600)}
                placeholder="3600"
                className="rounded-xl bg-[#F5F5F5] border-[#E7E7E7] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)]"
              />
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">
          Save
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function getAuthMethodForProvider(provider: string): string {
  switch (provider) {
    case "s3":
    case "r2":
      return "accessKey";
    case "gcs":
      return "serviceAccount";
    case "azure-blob":
      return "connectionString";
    default:
      return "accessKey";
  }
}
