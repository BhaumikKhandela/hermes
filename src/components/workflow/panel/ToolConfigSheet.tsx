"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores";
import { setSelectedNode, updateNodeConfig } from "@/stores/agentBuilderSlice";
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
import { ToolConfigForm } from "./ToolConfigForm";

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

  const existingConfig = selectedNode?.data?.config || {};

  const [config, setConfig] = useState<Record<string, any>>(existingConfig);
  const [selectedAuth, setSelectedAuth] = useState<string | undefined>(
    reg?.authMethods?.[0]?.key,
  );

  useEffect(() => {
    setConfig(existingConfig);
    setSelectedAuth(reg?.authMethods?.[0]?.key);
  }, [selectedNodeId, existingConfig, reg]);

  const handleChange = useCallback((key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedNode) return;
    dispatch(
      updateNodeConfig({ id: selectedNode.id, config }),
    );
    dispatch(setSelectedNode(null));
  }, [selectedNode, config, dispatch]);

  const handleClose = useCallback(() => {
    dispatch(setSelectedNode(null));
  }, [dispatch]);

  if (!selectedNode) return null;

  if (!reg) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>
            {reg?.label || selectedNode.data?.label || "Configure"}
          </SheetTitle>
          {reg?.description && (
            <SheetDescription>{reg.description}</SheetDescription>
          )}
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto px-4">
          <ToolConfigForm
            fields={reg?.configFields || []}
            values={config}
            onChange={handleChange}
            authMethods={reg?.authMethods}
            selectedAuth={selectedAuth}
            onAuthChange={setSelectedAuth}
          />
        </div>
        {reg && reg.configFields && reg.configFields.length > 0 && (
          <div className="flex gap-2 p-4 pt-0">
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
