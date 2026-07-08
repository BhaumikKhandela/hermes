"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/stores";
import { updateNodeConfig } from "@/stores/agentBuilderSlice";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  nodeId: string;
  instructions: string;
  description: string;
  onClose: () => void;
};

export function AgentConfigPanel({
  nodeId,
  instructions,
  description,
  onClose,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [localInstructions, setLocalInstructions] = useState(instructions || "");
  const [localDescription, setLocalDescription] = useState(description || "");

  useEffect(() => {
    setLocalInstructions(instructions || "");
    setLocalDescription(description || "");
  }, [instructions, description]);

  const handleSave = useCallback(() => {
    dispatch(
      updateNodeConfig({
        id: nodeId,
        config: {
          instructions: localInstructions,
          description: localDescription,
        },
      }),
    );
    onClose();
  }, [nodeId, localInstructions, localDescription, dispatch, onClose]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Instructions</label>
        <p className="text-xs text-muted-foreground">
          Instructions for this agent. Used as the system prompt during execution.
        </p>
        <Textarea
          value={localInstructions}
          onChange={(e) => setLocalInstructions(e.target.value)}
          placeholder="e.g. You are a senior software engineer..."
          rows={6}
          className="resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role Description</label>
        <p className="text-xs text-muted-foreground">
          Brief description of the agent's role and responsibilities.
        </p>
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="e.g. Analyze requirements and generate code"
          rows={4}
          className="resize-none"
        />
      </div>

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
