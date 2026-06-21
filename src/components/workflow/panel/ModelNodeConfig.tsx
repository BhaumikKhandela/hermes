"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { updateNodeCredential, updateNodeConfig } from "@/stores/agentBuilderSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type Props = {
  nodeId: string;
  nodeRegistry: string;
  credentialId: string | null | undefined;
  config: Record<string, any>;
  credentials: CredentialMetadata[];
  loading: boolean;
  onClose: () => void;
};

export function ModelNodeConfig({
  nodeId,
  nodeRegistry,
  credentialId,
  config,
  credentials,
  loading,
  onClose,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [selectedId, setSelectedId] = useState<string>(credentialId || "");
  const [selectedModel, setSelectedModel] = useState<string>(config?.modelName || "");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setSelectedId(credentialId || "");
  }, [credentialId]);

  useEffect(() => {
    setSelectedModel(config?.modelName || "");
  }, [config?.modelName]);

  useEffect(() => {
    if (!selectedId) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    fetch(`/api/providers/models?credentialId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [selectedId]);

  const handleSave = useCallback(() => {
    dispatch(
      updateNodeCredential({ id: nodeId, credentialId: selectedId || null }),
    );
    dispatch(
      updateNodeConfig({
        id: nodeId,
        config: { modelName: selectedModel },
      }),
    );
    onClose();
  }, [nodeId, selectedId, selectedModel, dispatch, onClose]);

  const handleCredentialCreated = useCallback((newId: string) => {
    setShowCreateForm(false);
    setSelectedId(newId);
  }, []);

  const selectedCred = credentials.find((c) => c._id === selectedId);

  return (
    <div className="space-y-4">
      {/* Credential */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Credential</label>
        <Combobox value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <ComboboxInput placeholder="Search credentials..." className="w-full" />
          <ComboboxContent>
            <ComboboxList>
              {loading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
              <ComboboxEmpty>No credentials found</ComboboxEmpty>
              {credentials.map((c) => (
                <ComboboxItem key={c._id} value={c._id}>
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    {c.providerAccountId && (
                      <span className="text-xs text-muted-foreground">{c.providerAccountId}</span>
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="text-[10px]">{selectedCred.provider}</Badge>
            <span>{selectedCred.authMethod}</span>
          </div>
        )}
      </div>

      {!showCreateForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowCreateForm(true)}
        >
          Add New Credential
        </Button>
      ) : (
        <CredentialForm
          schema={getCredentialSchema(
            credentials[0]?.provider as any || "openai",
            "apiKey" as any,
          )!}
          onCreated={handleCredentialCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Model</label>
        {selectedId ? (
          <Combobox value={selectedModel} onValueChange={(v) => setSelectedModel(v ?? "")}>
            <ComboboxInput placeholder="Select a model..." className="w-full" />
            <ComboboxContent>
              <ComboboxList>
                {modelsLoading && <div className="p-2 text-sm text-muted-foreground">Loading models...</div>}
                <ComboboxEmpty>No models found</ComboboxEmpty>
                {models.map((m) => (
                  <ComboboxItem key={m.id} value={m.id}>
                    {m.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select a credential to see available models
          </p>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">
          Save
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
