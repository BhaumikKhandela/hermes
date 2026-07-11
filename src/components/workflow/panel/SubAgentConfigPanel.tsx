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

export function SubAgentConfigPanel({
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
    <div className="space-y-10">
      {/* Instructions */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-[#111827]">
            Instructions
          </h3>
          <p className="text-xs text-[#6B7280]">
            Define how this worker should behave during execution.
          </p>
        </div>

        {/* Prompt toolbar */}
        <div className="flex gap-1">
          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-2 py-1 rounded-md hover:bg-[#E7E7E7] transition cursor-default">
            Improve
          </span>
          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-2 py-1 rounded-md hover:bg-[#E7E7E7] transition cursor-default">
            Templates
          </span>
          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-2 py-1 rounded-md hover:bg-[#E7E7E7] transition cursor-default">
            Variables
          </span>
          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-2 py-1 rounded-md hover:bg-[#E7E7E7] transition cursor-default">
            Expand
          </span>
          <span className="text-[10px] font-medium text-[#6B7280] bg-[#F5F5F5] px-2 py-1 rounded-md hover:bg-[#E7E7E7] transition cursor-default">
            Clear
          </span>
        </div>

        <Textarea
          value={localInstructions}
          onChange={(e) => setLocalInstructions(e.target.value)}
          placeholder="e.g. You are a database specialist. Execute SQL queries..."
          rows={12}
          className="min-h-[240px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-5 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
        />
      </section>

      {/* Tool Interface */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-[#111827]">
            Tool Interface
          </h3>
          <p className="text-xs text-[#6B7280]">
            Shown to parent agents when deciding whether to delegate work.
          </p>
        </div>

        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="e.g. Execute SQL queries against PostgreSQL and MySQL databases."
          rows={3}
          className="min-h-[64px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
        />
      </section>

      {/* Attached Resources */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-[#111827]">
            Attached Resources
          </h3>
          <p className="text-xs text-[#6B7280]">
            Models, memory, storage, and integrations are provided through connected tool nodes.
          </p>
        </div>

        <div className="bg-[#F8F9FC] rounded-xl p-4 space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Models</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">OpenAI</span>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Anthropic</span>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Gemini</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Memory</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Vector Store</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Storage</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Database</span>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">File Storage</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Integrations</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Slack</span>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Email</span>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E7E7E7] px-2 py-0.5 rounded-md">Web Search</span>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
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
