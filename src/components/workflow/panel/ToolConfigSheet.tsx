"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores";
import { setSelectedNode, updateNodeCredential, updateNodeConfig } from "@/stores/agentBuilderSlice";
import { getRegistration } from "@/lib/workflow-tools/registry";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolConfigForm } from "./ToolConfigForm";
import { CredentialForm } from "./CredentialForm";
import { ModelNodeConfig } from "./ModelNodeConfig";
import { SubAgentConfigPanel } from "./SubAgentConfigPanel";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { CredentialMetadata, CredentialRequirement } from "@/lib/credentials/types";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";

export function ToolConfigSheet() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedNodeId = useSelector(
    (state: RootState) => state.builder.selectedNodeId,
  );
  const nodes = useSelector((state: RootState) => state.builder.nodes);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  const reg = selectedNode?.data?.nodeRegistry
    ? getRegistration(selectedNode.data.nodeRegistry)
    : null;

  const existingCredentialId = selectedNode?.data?.credentialId as string | null | undefined;
  const existingConfig = selectedNode?.data?.config ?? {};

  const [config, setConfig] = useState<Record<string, any>>(existingConfig);
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(existingCredentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const credReq: CredentialRequirement | undefined = reg?.credentialRequirement;

  useEffect(() => {
    // Re-initialize form state when a different node is selected
    setConfig(existingConfig);
    setSelectedId(existingCredentialId || null);
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!credReq) return;
    setLoading(true);
    fetch(`/api/credentials?provider=${credReq.providers[0]}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.credentials || []).filter((c: CredentialMetadata) =>
          credReq.providers.includes(c.provider) && credReq.authMethods.includes(c.authMethod),
        );
        setCredentials(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [credReq]);

  const handleClose = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  const handleSelect = useCallback(
    (credentialId: string | null) => {
      setSelectedId(credentialId);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!selectedNode) return;
    dispatch(updateNodeCredential({ id: selectedNode.id, credentialId: selectedId }));
    dispatch(updateNodeConfig({ id: selectedNode.id, config }));
    dispatch(setSelectedNode(null));
  }, [selectedNode, selectedId, config, dispatch]);

  const handleCredentialCreated = useCallback((credentialId: string) => {
    setShowCreateForm(false);
    setSelectedId(credentialId);
    setCredentials((prev) => [...prev, { _id: credentialId } as CredentialMetadata]);
  }, []);

  if (!selectedNode) return null;

  if (selectedNode.type === "subAgent") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-80 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>
              {selectedNode.data?.label || "Sub Agent"}
            </SheetTitle>
            <SheetDescription>
              Configure this sub-agent for execution
            </SheetDescription>
          </SheetHeader>
          <Separator />
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <SubAgentConfigPanel
              nodeId={selectedNode.id}
              instructions={
                selectedNode.data?.config?.instructions ||
                selectedNode.data?.instructions ||
                ""
              }
              description={
                selectedNode.data?.config?.description ||
                selectedNode.data?.description ||
                ""
              }
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!reg) return null;

  const selectedCred = credentials.find((c) => c._id === selectedId);

  const isModelNode = selectedNode.data?.nodeRegistry === "model";

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{reg.label}</SheetTitle>
          {reg.description && <SheetDescription>{reg.description}</SheetDescription>}
        </SheetHeader>
        <Separator />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isModelNode ? (
            <ModelNodeConfig
              nodeId={selectedNode.id}
              nodeRegistry={reg.nodeRegistry}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          ) : (
            <>
              {credReq ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Credential</label>
                    <Combobox value={selectedId || ""} onValueChange={handleSelect}>
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
                        {selectedCred.lastUsedAt && (
                          <span>Last used: {new Date(selectedCred.lastUsedAt).toLocaleDateString()}</span>
                        )}
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
                  ) : credReq ? (
                    <CredentialForm
                      schema={getCredentialSchema(
                        credReq.providers[0] as any,
                        credReq.authMethods[0] as any,
                      )!}
                      onCreated={handleCredentialCreated}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  ) : null}
                </>
              ) : null}

              {reg.configFields && reg.configFields.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Node Configuration</label>
                    <ToolConfigForm
                      fields={reg.configFields}
                      values={config}
                      onChange={(key, value) => setConfig((prev) => ({ ...prev, [key]: value }))}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 p-4 pt-0">
                <Button onClick={handleSave} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
