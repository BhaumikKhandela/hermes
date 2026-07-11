"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { VisualBlock, NotionContent, EditorMode, VisualDraftState, MarkdownDraftState, JsonDraftState } from "@/lib/workflow-tools/tools/notion/types";
import type { WarningState } from "@/lib/workflow-tools/tools/notion/editorState";
import { attemptModeSwitch as computeTransition, applyLossyConversion, applySwitchAnyway, applyEditorChange, makeInitialVisualState, makeInitialMarkdownState, makeInitialJsonState } from "@/lib/workflow-tools/tools/notion/editorState";
import { VisualBlockEditor } from "./VisualBlockEditor";
import { MarkdownEditor } from "./MarkdownEditor";
import { JsonEditor } from "./JsonEditor";
import { LossyConversionDialog, UnsupportedTransitionDialog } from "./ModeWarningDialog";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

type Props = {
  value: NotionContent | undefined;
  onChange: (content: NotionContent | undefined) => void;
  layout?: "compact" | "expanded";
};

export function NotionContentEditor({ value, onChange, layout = "compact" }: Props) {
  const [mode, setMode] = useState<EditorMode>(value?.mode || "visual");

  const [visualState, setVisualState] = useState<VisualDraftState>(() => makeInitialVisualState(value));
  const [markdownState, setMarkdownState] = useState<MarkdownDraftState>(() => makeInitialMarkdownState(value));
  const [jsonState, setJsonState] = useState<JsonDraftState>(() => makeInitialJsonState(value));

  const [warning, setWarning] = useState<WarningState>(null);
  const [showExpanded, setShowExpanded] = useState(false);

  const visualBlocks = visualState.value;
  const markdown = markdownState.value;
  const json = jsonState.value;

  // Track the value from the latest render for use in callbacks
  const latestVisualRef = useRef(visualBlocks);
  const latestMarkdownRef = useRef(markdown);
  const latestJsonRef = useRef(json);
  latestVisualRef.current = visualBlocks;
  latestMarkdownRef.current = markdown;
  latestJsonRef.current = json;

  useEffect(() => {
    switch (mode) {
      case "visual":
        if (visualBlocks.length > 0) {
          onChange({ mode: "visual", blocks: visualBlocks });
        } else {
          onChange(undefined);
        }
        break;
      case "markdown":
        if (markdown.trim()) {
          onChange({ mode: "markdown", markdown });
        } else {
          onChange(undefined);
        }
        break;
      case "json":
        if (json.trim()) {
          onChange({ mode: "json", json });
        } else {
          onChange(undefined);
        }
        break;
    }
  }, [mode, visualBlocks, markdown, json, onChange]);

  const setTarget = useCallback((target: EditorMode, state: VisualDraftState | MarkdownDraftState | JsonDraftState) => {
    switch (target) {
      case "visual": setVisualState(state as VisualDraftState); break;
      case "markdown": setMarkdownState(state as MarkdownDraftState); break;
      case "json": setJsonState(state as JsonDraftState); break;
    }
  }, []);

  const handleAttemptModeSwitch = useCallback((target: EditorMode) => {
    if (target === mode) return;
    const result = computeTransition(
      mode, target,
      latestVisualRef.current, latestMarkdownRef.current, latestJsonRef.current,
      visualState, markdownState, jsonState,
    );
    switch (result.kind) {
      case "switch":
        setTarget(target, result.newState);
        setMode(target);
        break;
      case "show-lossy-confirmation":
        setWarning({
          type: "lossy",
          unsupportedFeatures: result.unsupportedFeatures,
          targetMode: result.targetMode,
          convertedBlocks: result.convertedBlocks,
        });
        break;
      case "show-unsupported-confirmation":
        setWarning({
          type: "unsupported",
          unsupportedFeatures: result.unsupportedFeatures,
          targetMode: result.targetMode,
        });
        break;
    }
  }, [mode, visualState, markdownState, jsonState, setTarget]);

  const handleStayInMode = useCallback(() => {
    setWarning(null);
  }, []);

  const handleConvertAnyway = useCallback(() => {
    if (!warning || warning.type !== "lossy") return;
    const result = applyLossyConversion(warning.targetMode, mode, warning.convertedBlocks);
    setTarget(result.targetMode, result.newState);
    setMode(result.targetMode);
    setWarning(null);
  }, [warning, mode, setTarget]);

  const handleSwitchAnyway = useCallback(() => {
    if (!warning || warning.type !== "unsupported") return;
    const result = applySwitchAnyway(warning.targetMode);
    setTarget(result.targetMode, result.newState);
    setMode(result.targetMode);
    setWarning(null);
  }, [warning, setTarget]);

  const handleEditorChange = useCallback((newValue: string | VisualBlock[]) => {
    const prev = mode === "visual" ? visualState : mode === "markdown" ? markdownState : jsonState;
    const updated = applyEditorChange(mode, newValue, prev);
    switch (mode) {
      case "visual": setVisualState(updated as VisualDraftState); break;
      case "markdown": setMarkdownState(updated as MarkdownDraftState); break;
      case "json": setJsonState(updated as JsonDraftState); break;
    }
  }, [mode, visualState, markdownState, jsonState]);

  const modes: { key: EditorMode; label: string }[] = [
    { key: "visual", label: "Visual Blocks" },
    { key: "markdown", label: "Markdown" },
    { key: "json", label: "Block JSON" },
  ];

  const renderTabs = (insideDialog?: boolean) => (
    <div className="flex gap-1 bg-[#F0F0F0] rounded-lg p-0.5">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => handleAttemptModeSwitch(m.key)}
          className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            mode === m.key
              ? "bg-white text-[#111827] shadow-sm"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          {m.label}
        </button>
      ))}
      {!insideDialog && layout === "compact" && (
        <button
          onClick={() => setShowExpanded(true)}
          className="p-1.5 rounded-md text-[#6B7280] hover:text-[#111827] hover:bg-white/50 transition-colors"
          title="Expand editor"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );

  const renderEditorBody = (expanded: boolean) => (
    <div className={expanded ? "min-h-[400px]" : ""}>
      {mode === "visual" && (
        <VisualBlockEditor blocks={visualBlocks} onChange={(v) => handleEditorChange(v)} />
      )}
      {mode === "markdown" && (
        <MarkdownEditor value={markdown} onChange={(v) => handleEditorChange(v)} rows={expanded ? 16 : 8} />
      )}
      {mode === "json" && (
        <JsonEditor value={json} onChange={(v) => handleEditorChange(v)} rows={expanded ? 16 : 8} />
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-2">
        {renderTabs()}
        {renderEditorBody(false)}

        {warning && warning.type === "unsupported" && (
          <UnsupportedTransitionDialog
            unsupportedFeatures={warning.unsupportedFeatures}
            onStay={handleStayInMode}
            onSwitchAnyway={handleSwitchAnyway}
          />
        )}
        {warning && warning.type === "lossy" && (
          <LossyConversionDialog
            unsupportedFeatures={warning.unsupportedFeatures}
            onCancel={handleStayInMode}
            onConvertAnyway={handleConvertAnyway}
          />
        )}
      </div>

      {showExpanded && (
        <Dialog open onOpenChange={(open) => !open && setShowExpanded(false)}>
          <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogTitle>Notion Content Editor</DialogTitle>
            <div className="space-y-4 pt-2">
              {renderTabs(true)}
              {renderEditorBody(true)}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowExpanded(false)} className="rounded-xl">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
