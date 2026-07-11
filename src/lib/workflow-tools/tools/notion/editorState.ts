import type { VisualBlock, EditorMode, VisualDraftState, MarkdownDraftState, JsonDraftState, NotionContent } from "./types";
import { visualBlocksToNotionJson, tryConvertNotionJsonToVisual, visualBlocksToMarkdown } from "./convert";

export type WarningState =
  | { type: "unsupported"; unsupportedFeatures: string[]; targetMode: EditorMode }
  | { type: "lossy"; unsupportedFeatures: string[]; targetMode: EditorMode; convertedBlocks: VisualBlock[] }
  | null;

export function makeInitialVisualState(value: NotionContent | undefined): VisualDraftState {
  if (value?.mode === "visual") {
    return { status: "user-edited", value: value.blocks };
  }
  return { status: "uninitialized", value: [] };
}

export function makeInitialMarkdownState(value: NotionContent | undefined): MarkdownDraftState {
  if (value?.mode === "markdown") {
    return { status: "user-edited", value: value.markdown };
  }
  return { status: "uninitialized", value: "" };
}

export function makeInitialJsonState(value: NotionContent | undefined): JsonDraftState {
  if (value?.mode === "json") {
    return { status: "user-edited", value: value.json };
  }
  return { status: "uninitialized", value: "" };
}

export type ConversionInfo =
  | { supported: false; unsupportedFeatures: string[] }
  | { supported: true; lossless: false; unsupportedFeatures: string[]; convertedValue: VisualBlock[] }
  | { supported: true; lossless: true; convertedValue: string | VisualBlock[] };

export function getConversionSupport(
  source: EditorMode,
  target: EditorMode,
  sourceValue: string | VisualBlock[],
): ConversionInfo {
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

export function getCurrentValue(
  mode: EditorMode,
  visual: VisualBlock[],
  md: string,
  js: string,
): string | VisualBlock[] {
  switch (mode) {
    case "visual": return visual;
    case "markdown": return md;
    case "json": return js;
  }
}

export type ModeTransitionResult =
  | { kind: "switch"; targetMode: EditorMode; newState: VisualDraftState | MarkdownDraftState | JsonDraftState }
  | { kind: "show-lossy-confirmation"; targetMode: EditorMode; unsupportedFeatures: string[]; convertedBlocks: VisualBlock[] }
  | { kind: "show-unsupported-confirmation"; targetMode: EditorMode; unsupportedFeatures: string[] };

export function attemptModeSwitch(
  currentMode: EditorMode,
  targetMode: EditorMode,
  visual: VisualBlock[],
  markdown: string,
  json: string,
  visualState: VisualDraftState,
  markdownState: MarkdownDraftState,
  jsonState: JsonDraftState,
): ModeTransitionResult {
  if (targetMode === currentMode) {
    throw new Error("attemptModeSwitch called with same mode");
  }
  const source = currentMode;

  const getTargetState = (): VisualDraftState | MarkdownDraftState | JsonDraftState => {
    switch (targetMode) {
      case "visual": return visualState;
      case "markdown": return markdownState;
      case "json": return jsonState;
    }
  };

  const targetProv = getTargetState();

  if (targetProv.status === "user-edited") {
    return { kind: "switch", targetMode, newState: targetProv };
  }

  const sourceValue = getCurrentValue(source, visual, markdown, json);

  if (targetProv.status === "generated") {
    const conv = getConversionSupport(source, targetMode, sourceValue);
    if (conv.supported) {
      return {
        kind: "switch",
        targetMode,
        newState: {
          status: "generated",
          value: conv.convertedValue as any,
          generatedFrom: source,
          conversion: conv.lossless ? "lossless" : "lossy",
        },
      };
    }
    return { kind: "switch", targetMode, newState: targetProv };
  }

  // uninitialized
  const conv = getConversionSupport(source, targetMode, sourceValue);

  if (conv.supported && conv.lossless) {
    return {
      kind: "switch",
      targetMode,
      newState: {
        status: "generated",
        value: conv.convertedValue as any,
        generatedFrom: source,
        conversion: "lossless",
      },
    };
  }

  if (conv.supported && !conv.lossless) {
    return {
      kind: "show-lossy-confirmation",
      targetMode,
      unsupportedFeatures: conv.unsupportedFeatures,
      convertedBlocks: conv.convertedValue,
    };
  }

  return {
    kind: "show-unsupported-confirmation",
    targetMode,
    unsupportedFeatures: conv.unsupportedFeatures,
  };
}

export function applyLossyConversion(
  targetMode: EditorMode,
  sourceMode: EditorMode,
  convertedBlocks: VisualBlock[],
): { targetMode: EditorMode; newState: VisualDraftState | MarkdownDraftState | JsonDraftState } {
  return {
    targetMode,
    newState: {
      status: "generated",
      value: convertedBlocks as any,
      generatedFrom: sourceMode,
      conversion: "lossy",
    },
  };
}

export function applySwitchAnyway(
  targetMode: EditorMode,
): { targetMode: EditorMode; newState: VisualDraftState | MarkdownDraftState | JsonDraftState } {
  switch (targetMode) {
    case "visual":
      return { targetMode, newState: { status: "user-edited", value: [] } };
    case "markdown":
      return { targetMode, newState: { status: "user-edited", value: "" } };
    case "json":
      return { targetMode, newState: { status: "user-edited", value: "" } };
  }
}

export function applyEditorChange(
  currentMode: EditorMode,
  newValue: string | VisualBlock[],
  prev: VisualDraftState | MarkdownDraftState | JsonDraftState,
): VisualDraftState | MarkdownDraftState | JsonDraftState {
  return {
    status: "user-edited",
    value: newValue as any,
    generatedFrom: prev.generatedFrom,
    conversion: prev.conversion,
  } as any;
}
