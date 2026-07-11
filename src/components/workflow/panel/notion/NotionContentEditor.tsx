"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { VisualBlock, NotionContent, EditorMode, VisualDraftState, MarkdownDraftState, JsonDraftState } from "@/lib/workflow-tools/tools/notion/types";
import { visualBlocksToNotionJson, tryConvertNotionJsonToVisual, visualBlocksToMarkdown } from "@/lib/workflow-tools/tools/notion/convert";
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

type WarningState =
  | { type: "unsupported"; unsupportedFeatures: string[]; targetMode: EditorMode }
  | { type: "lossy"; unsupportedFeatures: string[]; targetMode: EditorMode; convertedBlocks: VisualBlock[] }
  | null;

function makeInitialVisualState(value: NotionContent | undefined): VisualDraftState {
  if (value?.mode === "visual") {
    return { status: "user-edited", value: value.blocks };
  }
  return { status: "uninitialized", value: [] };
}

function makeInitialMarkdownState(value: NotionContent | undefined): MarkdownDraftState {
  if (value?.mode === "markdown") {
    return { status: "user-edited", value: value.markdown };
  }
  return { status: "uninitialized", value: "" };
}

function makeInitialJsonState(value: NotionContent | undefined): JsonDraftState {
  if (value?.mode === "json") {
    return { status: "user-edited", value: value.json };
  }
  return { status: "uninitialized", value: "" };
}

function getConversionSupport(
  source: EditorMode,
  target: EditorMode,
  sourceValue: string | VisualBlock[],
):
  | { supported: false; unsupportedFeatures: string[] }
  | { supported: true; lossless: false; unsupportedFeatures: string[]; convertedValue: VisualBlock[] }
  | { supported: true; lossless: true; convertedValue: string | VisualBlock[] }
{
  if (source === "visual" && target === "markdown") {
    const md = visualBlocksToMarkdown(sourceValue as VisualBlock[]);
    return { supported: true, lossless: true, convertedValue: md };
  }
  if (source === "visual" && target === "json") {
    const jsonStr = JSON.stringify(visualBlocksToNotionJson(sourceValue as VisualBlock[]), null, 2);
    return { supported: true, lossless: true, convertedValue: jsonStr };
  }
  if (source === "json" && target === "visual") {
    const result = tryConvertNotionJsonToVisual(sourceValue as string);
    if (!result.success) {
      return { supported: true, lossless: false, unsupportedFeatures: result.unsupportedFeatures, convertedValue: result.partialBlocks };
    }
    return { supported: true, lossless: true, convertedValue: result.blocks };
  }
  return { supported: false, unsupportedFeatures: [`${source} to ${target} conversion is not supported`] };
}

function getCurrentValue(mode: EditorMode, visual: VisualBlock[], md: string, js: string): string | VisualBlock[] {
  switch (mode) {
    case "visual": return visual;
    case "markdown": return md;
    case "json": return js;
  }
}

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

  const getTargetState = useCallback((target: EditorMode): VisualDraftState | MarkdownDraftState | JsonDraftState => {
    switch (target) {
      case "visual": return visualState;
      case "markdown": return markdownState;
      case "json": return jsonState;
    }
  }, [visualState, markdownState, jsonState]);

  const attemptModeSwitch = useCallback((target: EditorMode) => {
    if (target === mode) return;
    const source = mode;

    const targetProv = getTargetState(target);

    if (targetProv.status === "user-edited") {
      setMode(target);
      return;
    }

    if (targetProv.status === "generated") {
      const conv = getConversionSupport(
        source,
        target,
        getCurrentValue(source, latestVisualRef.current, latestMarkdownRef.current, latestJsonRef.current),
      );
      if (conv.supported) {
        setTarget(target, {
          status: "generated",
          value: conv.convertedValue as any,
          generatedFrom: source,
          conversion: conv.lossless ? "lossless" : "lossy",
        });
        setMode(target);
      } else {
        setMode(target);
      }
      return;
    }

    // targetProv.status === "uninitialized"
    const conv = getConversionSupport(
      source,
      target,
      getCurrentValue(source, latestVisualRef.current, latestMarkdownRef.current, latestJsonRef.current),
    );

    if (conv.supported && conv.lossless) {
      setTarget(target, {
        status: "generated",
        value: conv.convertedValue as any,
        generatedFrom: source,
        conversion: "lossless",
      });
      setMode(target);
      return;
    }

    if (conv.supported && !conv.lossless) {
      setWarning({
        type: "lossy",
        unsupportedFeatures: conv.unsupportedFeatures,
        targetMode: target,
        convertedBlocks: conv.convertedValue,
      });
      return;
    }

    if (!conv.supported) {
      setWarning({
        type: "unsupported",
        unsupportedFeatures: conv.unsupportedFeatures,
        targetMode: target,
      });
      return;
    }
  }, [mode, getTargetState, setTarget]);

  const handleStayInMode = useCallback(() => {
    setWarning(null);
  }, []);

  const handleConvertAnyway = useCallback(() => {
    if (!warning || warning.type !== "lossy") return;

    const target = warning.targetMode;
    setTarget(target, {
      status: "generated",
      value: warning.convertedBlocks as any,
      generatedFrom: mode,
      conversion: "lossy",
    });
    setMode(target);
    setWarning(null);
  }, [warning, mode, setTarget]);

  const handleSwitchAnyway = useCallback(() => {
    if (!warning || warning.type !== "unsupported") return;

    const target = warning.targetMode;
    switch (target) {
      case "visual":
        setTarget(target, { status: "user-edited", value: [] });
        break;
      case "markdown":
        setTarget(target, { status: "user-edited", value: "" });
        break;
      case "json":
        setTarget(target, { status: "user-edited", value: "" });
        break;
    }
    setMode(target);
    setWarning(null);
  }, [warning, mode, setTarget]);

  const handleEditorChange = useCallback((newValue: string | VisualBlock[]) => {
    switch (mode) {
      case "visual":
        setVisualState((prev) => ({
          status: "user-edited",
          value: newValue as VisualBlock[],
          generatedFrom: prev.generatedFrom,
          conversion: prev.conversion,
        }));
        break;
      case "markdown":
        setMarkdownState((prev) => ({
          status: "user-edited",
          value: newValue as string,
          generatedFrom: prev.generatedFrom,
          conversion: prev.conversion,
        }));
        break;
      case "json":
        setJsonState((prev) => ({
          status: "user-edited",
          value: newValue as string,
          generatedFrom: prev.generatedFrom,
          conversion: prev.conversion,
        }));
        break;
    }
  }, [mode]);

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
          onClick={() => attemptModeSwitch(m.key)}
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
