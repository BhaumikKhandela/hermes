"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores";
import { setSelectedNode, updateNodeCredential, updateNodeConfig, renameNode } from "@/stores/agentBuilderSlice";
import { getRegistration } from "@/lib/workflow-tools/registry";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ToolConfigForm } from "./ToolConfigForm";
import { CredentialForm } from "./CredentialForm";
import { ModelNodeConfig } from "./ModelNodeConfig";
import { SubAgentConfigPanel } from "./SubAgentConfigPanel";
import { AgentConfigPanel } from "./AgentConfigPanel";
import { TriggerConfigPanel } from "./TriggerConfigPanel";
import { TriggerManagePanel } from "./TriggerManagePanel";
import { ImageGeneratorConfig } from "./ImageGeneratorConfig";
import { ImageEditorConfig } from "./ImageEditorConfig";
import { ImageReaderConfig } from "./ImageReaderConfig";
import { EmbeddingConfig } from "./EmbeddingConfig";
import { SendMailConfig } from "./SendMailConfig";
import { DatabaseQueryConfig } from "./DatabaseQueryConfig";
import { VectorDBConfig } from "./VectorDBConfig";
import { SearchConfig } from "./SearchConfig";
import { MemoryConfig } from "./MemoryConfig";
import { WebScraperConfig } from "./WebScraperConfig";
import { SheetConfig } from "./SheetConfig";
import { CalendarConfig } from "./CalendarConfig";
import { NotionConfig } from "./notion/NotionConfig";
import { SlackConfig } from "./slack/SlackConfig";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Pencil } from "lucide-react";
import type { CredentialMetadata, CredentialRequirement } from "@/lib/credentials/types";
import { getCredentialSchema } from "@/lib/credentials/credentialSchemas";

function InlineRenameTitle({ nodeId, label, badge }: { nodeId: string; label: string; badge?: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitRename = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== label) {
      dispatch(renameNode({ id: nodeId, label: trimmed }));
    }
    setIsEditing(false);
  }, [dispatch, nodeId, label]);

  const handleStartEditing = useCallback(() => {
    setEditValue(label);
    setIsEditing(true);
  }, [label]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitRename((e.target as HTMLInputElement).value);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  }, [commitRename]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        commitRename(inputRef.current.value);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, commitRename]);

  return (
    <div className="flex items-center gap-1.5 group/title relative" onDoubleClick={handleStartEditing}>
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-[#F5F5FF] border border-[#C7C8FF] rounded-md px-1.5 py-0.5 text-base font-semibold text-[#111827] outline-none w-[180px]"
        />
      ) : (
        <>
          <span className="text-base font-semibold text-[#111827]">{label}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleStartEditing(); }}
            className="p-0.5 rounded hover:bg-[#F5F5F5]"
          >
            <Pencil size={14} className="text-[#6B7280]" />
          </button>
        </>
      )}
      {badge}
    </div>
  );
}

function SubAgentConfigSheet({ selectedNode, handleClose }: { selectedNode: any; handleClose: () => void }) {
  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 min-w-0">
            <InlineRenameTitle
              nodeId={selectedNode.id}
              label={selectedNode.data?.label || "Sub Agent"}
              badge={
                <span className="ml-1.5 text-[10px] font-medium text-[#F59E0B] bg-[#FEF3C7] px-1.5 py-0.5 rounded-full font-normal shrink-0">
                  Worker
                </span>
              }
            />
          </SheetTitle>
          <SheetDescription>
            Configure this sub-agent&apos;s instructions and tool interface
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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

function InputConfigSheet({ selectedNode, handleClose }: { selectedNode: any; handleClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [localInstructions, setLocalInstructions] = useState(
    selectedNode.data?.config?.instructions || selectedNode.data?.instructions || ""
  );
  const [localDescription, setLocalDescription] = useState(
    selectedNode.data?.config?.description || selectedNode.data?.description || ""
  );

  useEffect(() => {
    setLocalInstructions(selectedNode.data?.config?.instructions || selectedNode.data?.instructions || "");
    setLocalDescription(selectedNode.data?.config?.description || selectedNode.data?.description || "");
  }, [selectedNode.data?.config?.instructions, selectedNode.data?.config?.description, selectedNode.data?.instructions, selectedNode.data?.description]);

  const handleSave = useCallback(() => {
    dispatch(updateNodeConfig({
      id: selectedNode.id,
      config: { instructions: localInstructions, description: localDescription },
    }));
    handleClose();
  }, [selectedNode.id, localInstructions, localDescription, dispatch, handleClose]);

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>
            <InlineRenameTitle
              nodeId={selectedNode.id}
              label={selectedNode.data?.label || "Input"}
            />
          </SheetTitle>
          <SheetDescription>
            Configure the workflow input
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#111827]">Description</label>
            <p className="text-xs text-[#6B7280]">
              Describe what input this workflow expects.
            </p>
            <Textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              placeholder="e.g. A JSON object containing repository URL and branch name"
              rows={3}
              className="min-h-[64px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">
              Save
            </Button>
            <Button variant="ghost" onClick={handleClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ToolConfigSheet() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedNodeId = useSelector(
    (state: RootState) => state.builder.selectedNodeId,
  );
  const nodes = useSelector((state: RootState) => state.builder.nodes);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  const nodeReg = selectedNode?.data?.nodeRegistry;
  const isModelNode = nodeReg === "model" || nodeReg?.startsWith("model-");
  const reg = nodeReg ? getRegistration(nodeReg) : null;
  const regForModel = isModelNode ? reg : null;

  const existingCredentialId = selectedNode?.data?.credentialId as string | null | undefined;
  const existingConfig = selectedNode?.data?.config ?? {};

  const [config, setConfig] = useState<Record<string, any>>(existingConfig);
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(existingCredentialId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const credReq: CredentialRequirement | undefined = regForModel?.credentialRequirement ?? reg?.credentialRequirement;

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
      <SubAgentConfigSheet selectedNode={selectedNode} handleClose={handleClose} />
    );
  }

  if (selectedNode.type === "agent") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Agent"}
              />
            </SheetTitle>
            <SheetDescription>
              Configure this agent&apos;s instructions and tool interface
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <AgentConfigPanel
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

  if (selectedNode.type === "inputNode") {
    return <InputConfigSheet selectedNode={selectedNode} handleClose={handleClose} />;
  }

  if (selectedNode.type === "triggerNode") {
    const triggerTab = selectedNode.data?.config?._triggerTab;

    if (triggerTab === "manage") {
      return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
              <SheetTitle>
                <InlineRenameTitle
                  nodeId={selectedNode.id}
                  label={selectedNode.data?.label || "Trigger"}
                />
              </SheetTitle>
              <SheetDescription>
                View configured trigger
              </SheetDescription>
            </SheetHeader>
  
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <TriggerManagePanel
                nodeId={selectedNode.id}
                onClose={handleClose}
              />
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-80 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Trigger"}
              />
            </SheetTitle>
            <SheetDescription>
              Configure when this workflow runs
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            <TriggerConfigPanel
              nodeId={selectedNode.id}
              onClose={handleClose}
              initialTab={triggerTab}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "imageGenerator") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Image Generator"}
              />
            </SheetTitle>
            <SheetDescription>Configure image generation defaults.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ImageGeneratorConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "imageEditor") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Image Editor"}
              />
            </SheetTitle>
            <SheetDescription>Configure image editing defaults.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ImageEditorConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "imageReader") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Image Reader"}
              />
            </SheetTitle>
            <SheetDescription>Configure image analysis behavior.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ImageReaderConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "embedding") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Embedding"}
              />
            </SheetTitle>
            <SheetDescription>Convert text to vector embeddings.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <EmbeddingConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "sendMail") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Send Mail"}
              />
            </SheetTitle>
            <SheetDescription>Send emails via SMTP.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SendMailConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "memory") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Redis"}
              />
            </SheetTitle>
            <SheetDescription>Persistent key-value store backed by Redis.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <MemoryConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "sheet") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Sheet"}
              />
            </SheetTitle>
            <SheetDescription>Read or write data to Google Sheets.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SheetConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "calendarEvent") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Calendar"}
              />
            </SheetTitle>
            <SheetDescription>Create Google Calendar events.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <CalendarConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "notion") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Notion"}
              />
            </SheetTitle>
            <SheetDescription>Query data sources and manage pages and content in Notion.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <NotionConfig
              key={selectedNode.id}
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "slack") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Slack"}
              />
            </SheetTitle>
            <SheetDescription>Send, update, delete, and retrieve Slack messages, reactions, pins, conversations, users, files, bookmarks, canvases, and search.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SlackConfig
              key={selectedNode.id}
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "search") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Search"}
              />
            </SheetTitle>
            <SheetDescription>Search the web using Tavily.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SearchConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "vectorDB") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Pinecone"}
              />
            </SheetTitle>
            <SheetDescription>Query, upsert, and delete Pinecone vectors.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <VectorDBConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (nodeReg === "webscraper") {
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || "Web Scraper"}
              />
            </SheetTitle>
            <SheetDescription>Scrape or crawl web pages using Firecrawl.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <WebScraperConfig
              nodeId={selectedNode.id}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (["postgresDB", "mysqlDB", "mongoDB"].includes(nodeReg)) {
    const dbType = nodeReg === "postgresDB" ? "postgres"
                 : nodeReg === "mysqlDB" ? "mysql"
                 : "mongodb";
    return (
      <Sheet open onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              <InlineRenameTitle
                nodeId={selectedNode.id}
                label={selectedNode.data?.label || (dbType === "postgres" ? "PostgreSQL" : dbType === "mysql" ? "MySQL" : "MongoDB")}
              />
            </SheetTitle>
            <SheetDescription>Query your {dbType} database.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <DatabaseQueryConfig
              nodeId={selectedNode.id}
              dbType={dbType}
              credentialId={existingCredentialId}
              config={existingConfig}
              credentials={credentials}
              loading={loading}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!reg && !isModelNode) return null;

  const selectedCred = credentials.find((c) => c._id === selectedId);

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{isModelNode ? (regForModel?.label ?? "Model") : reg.label}</SheetTitle>
          {regForModel?.description && <SheetDescription>{regForModel.description}</SheetDescription>}
          {!isModelNode && reg.description && <SheetDescription>{reg.description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {isModelNode ? (
            <ModelNodeConfig
              nodeId={selectedNode.id}
              nodeRegistry={regForModel?.nodeRegistry ?? nodeReg}
              label={selectedNode.data?.label}
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
                    <label className="text-[13px] font-semibold text-[#111827]">Credential</label>
                    <Combobox value={selectedId || ""} onValueChange={handleSelect}>
                      <ComboboxInput placeholder="Search credentials..." className="w-full rounded-xl bg-[#F5F5F5] border-[#E7E7E7]" />
                      <ComboboxContent>
                        <ComboboxList>
                          {loading && <div className="p-2 text-sm text-[#6B7280]">Loading...</div>}
                          <ComboboxEmpty>No credentials found</ComboboxEmpty>
                          {credentials.map((c) => (
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
                      className="w-full rounded-xl"
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
        
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#111827]">Node Configuration</label>
                    <ToolConfigForm
                      fields={reg.configFields}
                      values={config}
                      onChange={(key, value) => setConfig((prev) => ({ ...prev, [key]: value }))}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] text-white">
                  Save
                </Button>
                <Button variant="ghost" onClick={handleClose} className="rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F5F5]">
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
