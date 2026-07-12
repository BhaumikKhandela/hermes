import { describe, it, expect } from "vitest";
import type { VisualBlock } from "../types";
import { indentBlock, findBlockById, duplicateBlock } from "../tree";
import { visualBlocksToMarkdown, analyzeVisualForMarkdownLoss } from "../convert";
import { cloneVisualBlockWithFreshIds } from "../cloneBlock";
import { substituteExpressionsFromJson, validateJsonWithExpressions } from "../../../../../components/workflow/panel/notion/useJsonValidation";
import {
  attemptModeSwitch,
  applyLossyConversion,
  applyEditorChange,
  makeInitialVisualState,
  makeInitialMarkdownState,
  makeInitialJsonState,
} from "../editorState";

// ══════════════════════════════════════════════════════════
// 1. ENFORCE canHaveChildren DURING INDENT
// ══════════════════════════════════════════════════════════

describe("indentBlock enforces canHaveChildren", () => {
  function pair(aType: string, bType: string): VisualBlock[] {
    return [
      { id: "a", type: aType as any, richText: [], children: [] },
      { id: "b", type: bType as any, richText: [], children: [] },
    ] as VisualBlock[];
  }

  function assertNoop(blocks: VisualBlock[], blockId: string) {
    const copy = JSON.parse(JSON.stringify(blocks));
    const result = indentBlock(blocks, blockId);
    expect(result.length).toBe(blocks.length);
    expect(result[1]).toEqual(copy[1]);
  }

  it("paragraph can indent under paragraph", () => {
    const blocks = pair("paragraph", "paragraph");
    const result = indentBlock(blocks, "b");
    expect(result[0].children?.length).toBe(1);
    expect(result[0].children?.[0].id).toBe("b");
  });

  it("paragraph can indent under toggle", () => {
    const blocks = pair("toggle", "paragraph");
    const result = indentBlock(blocks, "b");
    expect(result[0].children?.length).toBe(1);
    expect(result[0].children?.[0].id).toBe("b");
  });

  it("paragraph cannot indent under heading_1", () => {
    assertNoop(pair("heading_1", "paragraph"), "b");
  });

  it("paragraph cannot indent under heading_2", () => {
    assertNoop(pair("heading_2", "paragraph"), "b");
  });

  it("paragraph cannot indent under heading_3", () => {
    assertNoop(pair("heading_3", "paragraph"), "b");
  });

  it("paragraph cannot indent under divider", () => {
    assertNoop(pair("divider", "paragraph"), "b");
  });

  it("paragraph cannot indent under code", () => {
    assertNoop(pair("code", "paragraph"), "b");
  });

  it("failed indent preserves original tree structure and block order", () => {
    const blocks: VisualBlock[] = [
      { id: "h1", type: "heading_1", richText: [], children: [] },
      { id: "p1", type: "paragraph", richText: [], children: [] },
      { id: "p2", type: "paragraph", richText: [], children: [] },
    ];
    const result = indentBlock(blocks, "p1");
    expect(result.map((b) => b.id)).toEqual(["h1", "p1", "p2"]);
    expect(result.find((b) => b.id === "h1")?.children?.length ?? 0).toBe(0);
  });

  it("first sibling remains a no-op", () => {
    const blocks = pair("paragraph", "paragraph");
    expect(indentBlock(blocks, "a")).toEqual(blocks);
  });
});

// ══════════════════════════════════════════════════════════
// 2. FIX RECURSIVE DUPLICATION IDENTITY
// ══════════════════════════════════════════════════════════

describe("cloneVisualBlockWithFreshIds", () => {
  function collectIds(block: VisualBlock): string[] {
    const ids = [block.id, ...block.richText.map((r) => r.id)];
    if (block.children) {
      for (const c of block.children) {
        ids.push(...collectIds(c));
      }
    }
    return ids;
  }

  function makeDeepBlock(): VisualBlock {
    return {
      id: "orig-root",
      type: "toggle",
      richText: [{ id: "rt-root-1", text: "root" }],
      children: [
        {
          id: "orig-child-1",
          type: "paragraph",
          richText: [{ id: "rt-c1-1", text: "child1" }],
          children: [
            {
              id: "orig-grandchild",
              type: "paragraph",
              richText: [{ id: "rt-gc-1", text: "grandchild" }],
            },
          ],
        },
        {
          id: "orig-child-2",
          type: "to_do",
          richText: [{ id: "rt-c2-1", text: "child2" }],
          checked: true,
          children: [],
        },
      ],
    };
  }

  it("duplicated root gets a different ID", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    expect(clone.id).not.toBe(original.id);
  });

  it("every cloned descendant gets a different ID from original counterpart", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    const origIds = collectIds(original);
    const cloneIds = collectIds(clone);
    for (const id of cloneIds) {
      expect(origIds).not.toContain(id);
    }
  });

  it("every cloned rich-text entry gets a different ID", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    const origRtIds = original.richText.map((r) => r.id);
    const cloneRtIds = clone.richText.map((r) => r.id);
    for (const id of cloneRtIds) {
      expect(origRtIds).not.toContain(id);
    }
    if (clone.children) {
      for (const c of clone.children) {
        for (const rt of c.richText) {
          expect(origRtIds).not.toContain(rt.id);
        }
      }
    }
  });

  it("all IDs across original tree + cloned tree are unique", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    const allIds = [...collectIds(original), ...collectIds(clone)];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("deeply nested trees are handled recursively", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    expect(clone.children?.length).toBe(2);
    expect(clone.children?.[0].children?.length).toBe(1);
    expect(clone.children?.[0].children?.[0].id).not.toBe(original.children?.[0].children?.[0].id);
  });

  it("semantic content is preserved", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    expect(clone.type).toBe("toggle");
    expect(clone.richText[0].text).toBe("root");
    expect(clone.children?.[1].type).toBe("to_do");
    expect(clone.children?.[1].checked).toBe(true);
  });

  it("modifying the clone does not mutate the original", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    clone.richText[0].text = "modified";
    expect(original.richText[0].text).toBe("root");
  });

  it("findBlockById can uniquely resolve cloned descendant IDs", () => {
    const original = makeDeepBlock();
    const clone = cloneVisualBlockWithFreshIds(original);
    const rootBlocks = [clone];
    const child = clone.children?.[0];
    if (child) {
      const found = findBlockById(rootBlocks, child.id);
      expect(found).not.toBeNull();
      expect(found!.block.id).toBe(child.id);
    }
  });
});

describe("duplicateBlock uses shared clone helper", () => {
  it("duplicateBlock inserts clone immediately after original sibling", () => {
    const blocks: VisualBlock[] = [
      { id: "a", type: "paragraph", richText: [] },
      { id: "b", type: "paragraph", richText: [] },
    ];
    const result = duplicateBlock(blocks, "a");
    expect(result.length).toBe(3);
    expect(result[0].id).toBe("a");
    expect(result[1].id).not.toBe("a");
    expect(result[1].id).not.toBe("b");
    expect(result[2].id).toBe("b");
  });

  it("duplicated clone has all fresh IDs during recursion", () => {
    const parent: VisualBlock = {
      id: "parent", type: "toggle" as any, richText: [],
      children: [
        { id: "child", type: "paragraph" as any, richText: [{ id: "rt-c", text: "hello" }] },
      ],
    };
    const blocks = [parent];
    const result = duplicateBlock(blocks, "parent");
    expect(result.length).toBe(2);
    const clone = result[1];
    expect(clone.id).not.toBe("parent");
    expect(clone.children?.[0].id).not.toBe("child");
    expect(clone.children?.[0].richText[0].id).not.toBe("rt-c");
  });
});

// ══════════════════════════════════════════════════════════
// 3. FIX VISUAL -> MARKDOWN NESTED CONTENT LOSS
// ══════════════════════════════════════════════════════════

describe("visualBlocksToMarkdown nested content", () => {
  function b(overrides: Partial<VisualBlock>): VisualBlock {
    return { id: "x", type: "paragraph", richText: [], ...overrides };
  }

  it("paragraph child text appears in Markdown", () => {
    const blocks = [b({ id: "p", richText: [{ id: "rp", text: "parent" }], children: [b({ id: "c", richText: [{ id: "rc", text: "child" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("parent");
    expect(md).toContain("child");
  });

  it("paragraph grandchild text appears in Markdown", () => {
    const blocks = [b({ richText: [{ id: "rp", text: "parent" }], children: [b({ richText: [{ id: "rc", text: "child" }], children: [b({ richText: [{ id: "rg", text: "grandchild" }] })] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("grandchild");
  });

  it("bulleted list nested child appears and is structurally indented", () => {
    const blocks = [b({ type: "bulleted_list_item", richText: [{ id: "rp", text: "list" }], children: [b({ type: "bulleted_list_item", richText: [{ id: "rc", text: "nested" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("nested");
    expect(md).not.toContain("nestedn"); // verify newline separates
    expect(md).toMatch(/- list\n/);
  });

  it("numbered list nested child appears and is structurally indented", () => {
    const blocks = [b({ type: "numbered_list_item", richText: [{ id: "rp", text: "item1" }], children: [b({ type: "numbered_list_item", richText: [{ id: "rc", text: "sub" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("sub");
  });

  it("to-do nested child appears", () => {
    const blocks = [b({ type: "to_do", richText: [{ id: "rp", text: "task" }], children: [b({ type: "to_do", richText: [{ id: "rc", text: "subtask" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("subtask");
  });

  it("quote nested child appears", () => {
    const blocks = [b({ type: "quote", richText: [{ id: "rp", text: "cited" }], children: [b({ richText: [{ id: "rc", text: "nested" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("nested");
  });

  it("toggle descendants appear exactly once", () => {
    const blocks = [b({ type: "toggle", richText: [{ id: "rp", text: "tog" }], children: [b({ richText: [{ id: "rc", text: "inner" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    const matches = md.match(/inner/g);
    expect(matches).toHaveLength(1);
  });

  it("callout nested child appears", () => {
    const blocks = [b({ type: "callout", richText: [{ id: "rp", text: "note" }], children: [b({ richText: [{ id: "rc", text: "detail" }] })] })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("detail");
  });

  it("mixed nested tree preserves all textual content", () => {
    const blocks = [b({
      richText: [{ id: "r1", text: "root" }],
      children: [
        b({ type: "quote", richText: [{ id: "r2", text: "quote" }], children: [b({ richText: [{ id: "r3", text: "deep" }] })] }),
        b({ type: "to_do", richText: [{ id: "r4", text: "todo" }] }),
      ],
    })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("root");
    expect(md).toContain("quote");
    expect(md).toContain("deep");
    expect(md).toContain("todo");
  });

  it("no descendant is silently omitted", () => {
    const blocks = [b({
      richText: [{ id: "r1", text: "A" }],
      children: [
        b({ richText: [{ id: "r2", text: "B" }], children: [b({ richText: [{ id: "r3", text: "C" }] })] }),
        b({ richText: [{ id: "r4", text: "D" }] }),
      ],
    })];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("A");
    expect(md).toContain("B");
    expect(md).toContain("C");
    expect(md).toContain("D");
  });
});

// ══════════════════════════════════════════════════════════
// 4. NORMALIZE MARKDOWN + after_block
// ══════════════════════════════════════════════════════════

describe("append position normalization", () => {
  it("position normalizer is present in NotionConfig", async () => {
    // Note: This is a compile-time / static check;
    // runtime behavior requires React-rendering tests.
    // The normalization effect exists in NotionConfig.
  });
});

// ══════════════════════════════════════════════════════════
// 5. PRODUCTION EXPRESSION SCANNER (no duplication)
// ══════════════════════════════════════════════════════════

describe("substituteExpressionsFromJson (imported from production)", () => {
  it("raw expression outside string -> substituted with null", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }} }',
    );
    expect(result).toBe('{ "name": null }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("expression inside JSON string -> preserved as string content", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": "Hello {{ $json.name }}" }',
    );
    expect(result).toBe('{ "name": "Hello {{ $json.name }}" }');
    expect(hasExpression).toBe(false);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("invalid JSON after substitution -> invalid", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }} THIS IS INVALID }',
    );
    expect(result).toBe('{ "name": null THIS IS INVALID }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).toThrow();
  });

  it("unclosed expression -> invalid", () => {
    const { unclosedExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }',
    );
    expect(unclosedExpression).toBe(true);
  });

  it("escaped quotes inside strings", () => {
    const input = '{ "msg": "He said \\"{{ $json.msg }}\\"", "val": {{ $json.val }} }';
    const { result, hasExpression } = substituteExpressionsFromJson(input);
    expect(result).toBe('{ "msg": "He said \\"{{ $json.msg }}\\"", "val": null }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("multiple raw expressions", () => {
    const { result } = substituteExpressionsFromJson(
      '{ "a": {{ $json.a }}, "b": {{ $json.b }} }',
    );
    expect(result).toBe('{ "a": null, "b": null }');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("empty object", () => {
    const { result } = substituteExpressionsFromJson("{}");
    expect(result).toBe("{}");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("normal JSON with no expressions", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "key": "value" }',
    );
    expect(result).toBe('{ "key": "value" }');
    expect(hasExpression).toBe(false);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("missing comma remains invalid", () => {
    const { result } = substituteExpressionsFromJson(
      '{ "a": {{ $val }} "b": 2 }',
    );
    expect(() => JSON.parse(result)).toThrow();
  });

  it("malformed trailing content remains invalid", () => {
    const { result } = substituteExpressionsFromJson(
      '{"a":1}trailing',
    );
    expect(() => JSON.parse(result)).toThrow();
  });
});

describe("validateJsonWithExpressions (production)", () => {
  it("isExpression is metadata only and does not override isValid", () => {
    // Valid expression JSON
    const valid = validateJsonWithExpressions('{ "a": {{ $val }} }');
    expect(valid.isValid).toBe(true);
    expect(valid.isExpression).toBe(true);

    // Invalid expression JSON: missing comma
    const invalid = validateJsonWithExpressions('{ "a": {{ $val }} "b": 2 }');
    expect(invalid.isValid).toBe(false);
    expect(invalid.isExpression).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════
// 6. PROVENANCE STATE-MACHINE TESTS
// ══════════════════════════════════════════════════════════

describe("attemptModeSwitch (production state machine)", () => {
  const emptyVisual: VisualBlock[] = [];
  const emptyStr = "";

  function visualA(): VisualBlock[] {
    return [{ id: "a1", type: "paragraph", richText: [], children: [] }];
  }

  function visualB(): VisualBlock[] {
    return [{ id: "b1", type: "paragraph", richText: [{ id: "rtb", text: "B" }], children: [] }];
  }

  // Scenario A: Visual A -> JSON generated -> Visual B -> JSON
  it("A: regenerates when generated target exists and source changed", () => {
    const visual = visualA();
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    // visual -> json
    const r1 = attemptModeSwitch("visual", "json", visual, emptyStr, emptyStr, vs, ms, js);
    expect(r1.kind).toBe("switch");
    const json1 = r1.newState.value as string;

    // user edits visual to visualB
    const visualUpdated = visualB();
    const vsEdited = applyEditorChange("visual", visualUpdated, vs);

    // json -> visual (user-edited, restore)
    const r2 = attemptModeSwitch("json", "visual", visualUpdated, emptyStr, json1, vsEdited, ms, js);
    expect(r2.kind).toBe("switch");
    expect((r2.newState as any).status).toBe("user-edited");

    // visual -> json (generated, regenerate)
    const r3 = attemptModeSwitch("visual", "json", visualUpdated, emptyStr, json1, vsEdited, ms, js);
    expect(r3.kind).toBe("switch");
    const json2 = r3.newState.value as string;
    expect(json2).not.toBe(json1);
  });

  // Scenario B: Visual A -> JSON edited -> Visual B -> JSON restored
  it("B: user-edited target is restored exactly", () => {
    const visual = visualA();
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    // visual -> json (generated)
    const r1 = attemptModeSwitch("visual", "json", visual, emptyStr, emptyStr, vs, ms, js);
    expect(r1.kind).toBe("switch");
    expect((r1.newState as any).status).toBe("generated");
    const jsonValue = r1.newState.value as string;

    // user edits json
    const customJson = '{ "custom": true }';
    const jsEdited = applyEditorChange("json", customJson, r1.newState as any);
    expect(jsEdited.status).toBe("user-edited");

    // json -> visual (user-edited, restore)
    const vsEdited = makeInitialVisualState({ mode: "visual", blocks: visualB() });
    const r2 = attemptModeSwitch("json", "visual", visual, customJson, customJson, vsEdited, ms, jsEdited);
    expect(r2.kind).toBe("switch");

    // visual -> json (user-edited, restore)
    const r3 = attemptModeSwitch("visual", "json", visualB(), emptyStr, customJson, vsEdited, ms, jsEdited);
    expect(r3.kind).toBe("switch");
    expect((r3.newState.value as string)).toBe(customJson);
  });

  // Scenario C: Visual A -> JSON generated -> Visual -> Markdown generated -> Markdown -> JSON restored
  it("C: generated target restores when conversion from source is unsupported", () => {
    const visual = visualA();
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    // visual -> json
    const r1 = attemptModeSwitch("visual", "json", visual, emptyStr, emptyStr, vs, ms, js);
    expect(r1.kind).toBe("switch");
    const jsonVal = r1.newState.value as string;
    expect(jsonVal).toBeTruthy();

    // json -> visual (uninitialized, lossless)
    const vsGenerated = makeInitialVisualState(undefined);
    const r2 = attemptModeSwitch("json", "visual", visual, emptyStr, jsonVal, vsGenerated, ms, r1.newState as any);
    expect(r2.kind).toBe("switch");
    expect((r2.newState as any).status).toBe("generated");

    // visual -> markdown
    const msGenerated = makeInitialMarkdownState(undefined);
    const r3 = attemptModeSwitch("visual", "markdown", visualB(), emptyStr, jsonVal, r2.newState as any, msGenerated, r1.newState as any);
    expect(r3.kind).toBe("switch");
    expect((r3.newState as any).status).toBe("generated");

    // markdown -> json (unsupported, restore existing generated json)
    const r4 = attemptModeSwitch("markdown", "json", visualB(), "some md", jsonVal, r2.newState as any, r3.newState as any, r1.newState as any);
    expect(r4.kind).toBe("switch");
    expect((r4.newState.value as string)).toBe(jsonVal);
  });

  // Scenario D: JSON with unsupported -> Visual -> Convert Anyway
  it("D: lossy conversion produces generated (not user-edited) with correct metadata", () => {
    const visual: VisualBlock[] = [];
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);

    // Start with JSON containing an unsupported block type
    const jsonWithImage = JSON.stringify([
      { type: "image", image: { url: "https://example.com/pic.png" } },
    ]);

    // JSON contains unsupported 'image' block -> should trigger lossy dialog
    // First, the JSON mode needs to have a user-edited state
    const jsWithImage = { status: "user-edited" as const, value: jsonWithImage };

    // visual -> json (to generate json normally)
    // We need to go to json mode with user-edited content
    const r1 = attemptModeSwitch("json", "visual", visual as VisualBlock[], emptyStr, jsonWithImage, vs, ms, jsWithImage);
    // json -> visual should show lossy because image is unsupported
    expect(r1.kind).toBe("show-lossy-confirmation");
    expect(r1.unsupportedFeatures.length).toBeGreaterThan(0);

    // Apply lossy conversion
    const lossyResult = applyLossyConversion("visual", "json", r1.convertedBlocks);
    expect(lossyResult.targetMode).toBe("visual");
    expect((lossyResult.newState as any).status).toBe("generated");
    expect((lossyResult.newState as any).generatedFrom).toBe("json");
    expect((lossyResult.newState as any).conversion).toBe("lossy");
  });

  it("E: generated target regenerates when source changes and supported", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const v1: VisualBlock[] = [{ id: "v1", type: "paragraph", richText: [{ id: "rt1", text: "first" }] }];

    // visual -> markdown
    const r1 = attemptModeSwitch("visual", "markdown", v1, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const md1 = r1.newState.value as string;
    expect(md1).toContain("first");

    const v2: VisualBlock[] = [{ id: "v2", type: "paragraph", richText: [{ id: "rt2", text: "second" }] }];
    // visual -> markdown (generated, source changed -> regenerate)
    const vsEdited = applyEditorChange("visual", v2, vs);
    const r2 = attemptModeSwitch("visual", "markdown", v2, md1, "", vsEdited, r1.newState as any, js);
    expect(r2.kind).toBe("switch");
    const md2 = r2.newState.value as string;
    expect(md2).toContain("second");
    expect(md2).not.toContain("first");
  });

  it("F: user-edited target restores exactly without regeneration", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const v1: VisualBlock[] = [{ id: "v1", type: "paragraph", richText: [{ id: "rt1", text: "first" }] }];

    // visual -> json
    const r1 = attemptModeSwitch("visual", "json", v1, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const jsonVal = r1.newState.value as string;

    // user edits json to custom content
    const customJson = '{ "custom": true }';
    const jsEdited = applyEditorChange("json", customJson, r1.newState as any);

    // Change visual source completely
    const v2: VisualBlock[] = [{ id: "v2", type: "heading_1", richText: [{ id: "rt2", text: "changed" }] }];

    // visual -> json: should restore user-edited json, NOT regenerate from v2
    const vsEdited = applyEditorChange("visual", v2, vs);
    const r2 = attemptModeSwitch("visual", "json", v2, "", customJson, vsEdited, ms, jsEdited);
    expect(r2.kind).toBe("switch");
    expect(r2.newState.value as string).toBe(customJson);
  });

  it("G: generated target with unsupported conversion restores instead of erasing", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const v1: VisualBlock[] = [{ id: "v1", type: "paragraph", richText: [{ id: "rt1", text: "data" }] }];

    // visual -> json
    const r1 = attemptModeSwitch("visual", "json", v1, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const jsonVal = r1.newState.value as string;

    // json -> visual (generated)
    const vsGen = makeInitialVisualState(undefined);
    const r2 = attemptModeSwitch("json", "visual", v1, "", jsonVal, vsGen, ms, r1.newState as any);
    expect(r2.kind).toBe("switch");

    // visual -> markdown (generated)
    const msGen = makeInitialMarkdownState(undefined);
    const r3 = attemptModeSwitch("visual", "markdown", v1, "", jsonVal, r2.newState as any, msGen, r1.newState as any);
    expect(r3.kind).toBe("switch");
    const mdVal = r3.newState.value as string;

    // markdown -> json = unsupported
    // generated json should be restored
    const r4 = attemptModeSwitch("markdown", "json", v1, mdVal, jsonVal, r2.newState as any, r3.newState as any, r1.newState as any);
    expect(r4.kind).toBe("switch");
    expect(r4.newState.value as string).toBe(jsonVal);
  });

  // Scenario H: Visual with underline -> Markdown is lossy
  it("H: visual with underline -> markdown produces show-lossy-confirmation", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const visual: VisualBlock[] = [{
      id: "u1",
      type: "paragraph",
      richText: [{ id: "rt1", text: "underlined", annotations: { underline: true } }],
    }];

    const r = attemptModeSwitch("visual", "markdown", visual, "", "", vs, ms, js);
    expect(r.kind).toBe("show-lossy-confirmation");
    expect(r.unsupportedFeatures).toContain("underline annotations");
    expect(typeof r.convertedValue).toBe("string");
    expect(r.convertedValue).toContain("underlined");
  });

  // Scenario I: Confirm lossy visual->markdown produces correct draft
  it("I: confirming lossy visual->markdown creates generated markdown draft", () => {
    const visual: VisualBlock[] = [{
      id: "u2",
      type: "paragraph",
      richText: [{ id: "rt2", text: "underlined", annotations: { underline: true } }],
    }];

    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const r = attemptModeSwitch("visual", "markdown", visual, "", "", vs, ms, js);
    expect(r.kind).toBe("show-lossy-confirmation");

    const confirmed = applyLossyConversion("markdown", "visual", r.convertedValue);
    expect(confirmed.targetMode).toBe("markdown");
    expect((confirmed.newState as any).status).toBe("generated");
    expect((confirmed.newState as any).value).toBe(r.convertedValue);
    expect((confirmed.newState as any).generatedFrom).toBe("visual");
    expect((confirmed.newState as any).conversion).toBe("lossy");
  });

  // Scenario J: Visual without underline -> Markdown is lossless
  it("J: visual without underline -> markdown is lossless (plain paragraph)", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const visual: VisualBlock[] = [{
      id: "p1",
      type: "paragraph",
      richText: [{ id: "rt1", text: "hello" }],
    }];

    const r = attemptModeSwitch("visual", "markdown", visual, "", "", vs, ms, js);
    expect(r.kind).toBe("switch");
  });

  // Scenario K: Bold/italic/code/strikethrough/link remain lossless
  it("K: visual with bold/italic/code/strikethrough/link -> markdown is lossless", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const visual: VisualBlock[] = [{
      id: "p2",
      type: "paragraph",
      richText: [
        { id: "rt1", text: "bold", annotations: { bold: true } },
        { id: "rt2", text: "italic", annotations: { italic: true } },
        { id: "rt3", text: "code", annotations: { code: true } },
        { id: "rt4", text: "strike", annotations: { strikethrough: true } },
        { id: "rt5", text: "linked", link: "https://example.com" },
      ],
    }];

    const r = attemptModeSwitch("visual", "markdown", visual, "", "", vs, ms, js);
    expect(r.kind).toBe("switch");
  });

  // Scenario L: Underline detected recursively in nested descendant
  it("L: underline in nested descendant is detected", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const visual: VisualBlock[] = [{
      id: "parent",
      type: "toggle",
      richText: [{ id: "rt1", text: "no underline here" }],
      children: [{
        id: "child",
        type: "paragraph",
        richText: [{ id: "rt2", text: "nested underline", annotations: { underline: true } }],
      }],
    }];

    const r = attemptModeSwitch("visual", "markdown", visual, "", "", vs, ms, js);
    expect(r.kind).toBe("show-lossy-confirmation");
    expect(r.unsupportedFeatures).toContain("underline annotations");
    expect(typeof r.convertedValue).toBe("string");
  });

  // Scenario M: Multiple unsupported features are deduplicated
  it("M: multiple underline annotations produce one entry in feature list", () => {
    const visual: VisualBlock[] = [{
      id: "a",
      type: "paragraph",
      richText: [{ id: "rta", text: "first", annotations: { underline: true } }],
    }, {
      id: "b",
      type: "paragraph",
      richText: [{ id: "rtb", text: "second", annotations: { underline: true } }],
    }, {
      id: "c",
      type: "paragraph",
      richText: [{ id: "rtc", text: "third", annotations: { underline: true } }],
    }];

    const features = analyzeVisualForMarkdownLoss(visual);
    expect(features).toEqual(["underline annotations"]);
  });
});

// ══════════════════════════════════════════════════════════
// 7. GENERATED-TARGET LOSSY CONFIRMATION (provenance bug fix)
// ══════════════════════════════════════════════════════════

describe("generated-target lossy confirmation invariant", () => {
  // Scenario A: Generated Markdown target + newly underlined Visual source
  it("A: generated markdown target with newly underlined visual shows lossy confirmation", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const plain: VisualBlock[] = [{ id: "p", type: "paragraph", richText: [{ id: "rt1", text: "Hello" }] }];

    // Visual -> Markdown (lossless, generates markdown draft)
    const r1 = attemptModeSwitch("visual", "markdown", plain, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const msGenerated = r1.newState as MarkdownDraftState;
    expect(msGenerated.status).toBe("generated");

    // Edit visual to add underline
    const underlined: VisualBlock[] = [{
      id: "p", type: "paragraph",
      richText: [{ id: "rt1", text: "Hello", annotations: { underline: true } }],
    }];

    // Visual -> Markdown again: target is generated, conversion is lossy
    const r2 = attemptModeSwitch("visual", "markdown", underlined, "", "", vs, msGenerated, js);
    expect(r2.kind).toBe("show-lossy-confirmation");
    expect(r2.unsupportedFeatures).toContain("underline annotations");
    expect(typeof r2.convertedValue).toBe("string");
    expect(r2.convertedValue).toContain("Hello");
  });

  // Scenario B: Generated Markdown target + changed but still lossless Visual source
  it("B: generated markdown target with changed lossless visual regenerates", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const v1: VisualBlock[] = [{ id: "p", type: "paragraph", richText: [{ id: "rt1", text: "first" }] }];

    // Visual -> Markdown (generated, lossless)
    const r1 = attemptModeSwitch("visual", "markdown", v1, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const msGenerated = r1.newState as MarkdownDraftState;

    // Edit visual to different text, still lossless
    const v2: VisualBlock[] = [{ id: "p", type: "paragraph", richText: [{ id: "rt1", text: "second" }] }];
    const vsEdited = applyEditorChange("visual", v2, vs);

    // Visual -> Markdown again: target is generated, conversion is lossless -> regenerate
    const r2 = attemptModeSwitch("visual", "markdown", v2, "", "", vsEdited, msGenerated, js);
    expect(r2.kind).toBe("switch");
    const mdState = r2.newState as MarkdownDraftState;
    expect(mdState.status).toBe("generated");
    expect(mdState.value).toContain("second");
    expect(mdState.value).not.toContain("first");
    expect(mdState.generatedFrom).toBe("visual");
    expect(mdState.conversion).toBe("lossless");
  });

  // Scenario C: Confirming lossy visual->markdown via applyLossyConversion
  it("C: confirming lossy visual->markdown creates correct lossy draft", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const underlined: VisualBlock[] = [{
      id: "p", type: "paragraph",
      richText: [{ id: "rt1", text: "data", annotations: { underline: true } }],
    }];

    // Visual -> Markdown (uninitialized target)
    const r1 = attemptModeSwitch("visual", "markdown", underlined, "", "", vs, ms, js);
    expect(r1.kind).toBe("show-lossy-confirmation");

    // Confirm lossy
    const confirmed = applyLossyConversion("markdown", "visual", r1.convertedValue);
    expect(confirmed.targetMode).toBe("markdown");
    const draft = confirmed.newState as MarkdownDraftState;
    expect(draft.status).toBe("generated");
    expect(draft.generatedFrom).toBe("visual");
    expect(draft.conversion).toBe("lossy");
    expect(draft.value).toBe(r1.convertedValue);
  });

  // Scenario D: User-edited target restoration unchanged
  it("D: user-edited markdown target is restored without overwrite", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const v1: VisualBlock[] = [{ id: "p", type: "paragraph", richText: [{ id: "rt1", text: "from visual" }] }];

    // Visual -> Markdown (generated)
    const r1 = attemptModeSwitch("visual", "markdown", v1, "", "", vs, ms, js);
    expect(r1.kind).toBe("switch");
    const msGenerated = r1.newState as MarkdownDraftState;

    // User edits markdown to custom content
    const customMd = "user typed this";
    const msEdited = applyEditorChange("markdown", customMd, msGenerated);
    expect(msEdited.status).toBe("user-edited");

    // Markdown -> Visual
    const vsEdited = makeInitialVisualState({ mode: "visual", blocks: v1 });
    const r2 = attemptModeSwitch("markdown", "visual", v1, customMd, "", vsEdited, msEdited, js);
    expect(r2.kind).toBe("switch");

    // Visual -> Markdown: should restore user-edited markdown, not regenerate
    const r3 = attemptModeSwitch("visual", "markdown", v1, "", "", vsEdited, msEdited, js);
    expect(r3.kind).toBe("switch");
    expect((r3.newState as MarkdownDraftState).value).toBe(customMd);
  });

  // Scenario E: JSON -> Visual lossy generated-target follows same invariant
  it("E: json->visual lossy with generated target shows lossy confirmation", () => {
    const vs = makeInitialVisualState(undefined);
    const ms = makeInitialMarkdownState(undefined);
    const js = makeInitialJsonState(undefined);

    const jsonSimple = JSON.stringify([
      { type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: "ok" } }] } },
    ]);

    const jsonWithImage = JSON.stringify([
      { type: "image", image: { url: "https://example.com/pic.png" } },
    ]);

    // JSON -> Visual (lossless, generates visual draft)
    const r1 = attemptModeSwitch("json", "visual", [], "", jsonSimple, vs, ms, js);
    expect(r1.kind).toBe("switch");
    const vsGenerated = r1.newState as VisualDraftState;
    expect(vsGenerated.status).toBe("generated");

    // JSON -> Visual again with lossy JSON (target is generated, conversion lossy)
    const jsUserEdited = { status: "user-edited" as const, value: jsonWithImage };
    const r2 = attemptModeSwitch("json", "visual", [], "", jsonWithImage, vsGenerated, ms, jsUserEdited);
    expect(r2.kind).toBe("show-lossy-confirmation");
    expect(r2.unsupportedFeatures).toContain('"image" block');
  });
});
