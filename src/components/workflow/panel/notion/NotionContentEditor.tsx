"use client";

import { useState, useCallback, useEffect } from "react";
import type { VisualBlock, NotionContent } from "@/lib/workflow-tools/tools/notion/types";
import { visualBlocksToNotionJson, tryConvertNotionJsonToVisual, visualBlocksToMarkdown } from "@/lib/workflow-tools/tools/notion/convert";
import { VisualBlockEditor } from "./VisualBlockEditor";
import { MarkdownEditor } from "./MarkdownEditor";
import { JsonEditor } from "./JsonEditor";
import { LossyConversionDialog, UnsupportedTransitionDialog } from "./ModeWarningDialog";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

type EditorMode = "visual" | "markdown" | "json";

type Props = {
  value: NotionContent | undefined;
  onChange: (content: NotionContent | undefined) => void;
  layout?: "compact" | "expanded";
};

type WarningState =
  | { type: "unsupported"; unsupportedFeatures: string[]; targetMode: EditorMode }
  | { type: "lossy"; unsupportedFeatures: string[]; targetMode: EditorMode; convertedBlocks: VisualBlock[] }
  | null;

export function NotionContentEditor({ value, onChange, layout = "compact" }: Props) {
  const [mode, setMode] = useState<EditorMode>(value?.mode || "visual");
  const [visualBlocks, setVisualBlocks] = useState<VisualBlock[]>(
    value?.mode === "visual" ? value.blocks : [],
  );
  const [markdown, setMarkdown] = useState<string>(
    value?.mode === "markdown" ? value.markdown : "",
  );
  const [json, setJson] = useState<string>(
    value?.mode === "json" ? value.json : "",
  );

  const [warning, setWarning] = useState<WarningState>(null);
  const [showExpanded, setShowExpanded] = useState(false);

  const [draftVisual, setDraftVisual] = useState<VisualBlock[] | null>(null);
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const [draftJson, setDraftJson] = useState<string | null>(null);

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

  const attemptModeSwitch = useCallback((target: EditorMode) => {
    if (target === mode) return;

    if (target === "visual") {
      if (mode === "markdown") {
        setWarning({
          type: "unsupported",
          unsupportedFeatures: [
            "Markdown-to-Visual conversion is not supported",
            "Annotations, tables, and complex formatting cannot be converted to blocks",
          ],
          targetMode: "visual",
        });
        return;
      }
      if (mode === "json") {
        const result = tryConvertNotionJsonToVisual(json);
        if (!result.success) {
          setWarning({
            type: "lossy",
            unsupportedFeatures: result.unsupportedFeatures,
            targetMode: "visual",
            convertedBlocks: result.blocks,
          });
          return;
        }
        setVisualBlocks(result.blocks);
        setMode("visual");
        return;
      }
    }

    if (target === "markdown") {
      if (mode === "visual") {
        const md = visualBlocksToMarkdown(visualBlocks);
        setMarkdown(md);
        setMode("markdown");
        return;
      }
      if (mode === "json") {
        setWarning({
          type: "unsupported",
          unsupportedFeatures: [
            "JSON-to-Markdown conversion is not supported",
            "Switch to Visual first or edit Markdown directly",
          ],
          targetMode: "markdown",
        });
        return;
      }
    }

    if (target === "json") {
      if (mode === "visual") {
        const jsonStr = JSON.stringify(visualBlocksToNotionJson(visualBlocks), null, 2);
        setJson(jsonStr);
        setMode("json");
        return;
      }
      if (mode === "markdown") {
        setWarning({
          type: "unsupported",
          unsupportedFeatures: [
            "Markdown-to-JSON conversion is not supported",
            "Switch to Visual first or edit JSON directly",
          ],
          targetMode: "json",
        });
        return;
      }
    }

    setMode(target);
  }, [mode, visualBlocks, json, markdown]);

  const handleStayInMode = useCallback(() => {
    setWarning(null);
  }, []);

  const handleConvertAnyway = useCallback(() => {
    if (!warning || warning.type !== "lossy") return;

    if (warning.targetMode === "visual") {
      setVisualBlocks(warning.convertedBlocks);
      setMode("visual");
    }

    setWarning(null);
  }, [warning]);

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
        <VisualBlockEditor blocks={visualBlocks} onChange={setVisualBlocks} />
      )}
      {mode === "markdown" && (
        <MarkdownEditor value={markdown} onChange={setMarkdown} rows={expanded ? 16 : 8} />
      )}
      {mode === "json" && (
        <JsonEditor value={json} onChange={setJson} rows={expanded ? 16 : 8} />
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
