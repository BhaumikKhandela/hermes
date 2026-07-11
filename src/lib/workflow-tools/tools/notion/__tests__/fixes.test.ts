import { describe, it, expect } from "vitest";
import type { VisualBlock } from "../types";
import { indentBlock, outdentBlock, findBlockById } from "../tree";
import { blockRegistry } from "../registry";
import { visualBlocksToNotionJson, visualBlocksToMarkdown } from "../convert";

// ── 1. tree.ts: outdentBlock fix ──

describe("tree.ts", () => {
  function makeBlocks(): VisualBlock[] {
    return [
      {
        id: "root-1",
        type: "toggle",
        richText: [],
        children: [
          { id: "child-1", type: "paragraph", richText: [], children: [] },
          { id: "child-2", type: "paragraph", richText: [], children: [] },
        ],
      },
      {
        id: "root-2",
        type: "toggle",
        richText: [],
        children: [
          { id: "child-3", type: "paragraph", richText: [], children: [] },
        ],
      },
    ];
  }

  it("outdent: moves block after its former parent", () => {
    const blocks = makeBlocks();
    const result = outdentBlock(blocks, "child-1");
    const child1 = result.find((b) => b.id === "root-1");
    expect(child1?.children?.length).toBe(1);
    expect(child1?.children?.[0].id).toBe("child-2");
    expect(result.map((b) => b.id)).toEqual(["root-1", "child-1", "root-2"]);
  });

  it("outdent: no-op for root-level block", () => {
    const blocks = makeBlocks();
    const result = outdentBlock(blocks, "root-1");
    expect(result.length).toBe(2);
  });

  it("indent: moves block under previous sibling", () => {
    const blocks: VisualBlock[] = [
      { id: "a", type: "paragraph", richText: [], children: [] },
      { id: "b", type: "paragraph", richText: [], children: [] },
    ];
    const result = indentBlock(blocks, "b");
    const a = result.find((b) => b.id === "a");
    expect(a?.children?.length).toBe(1);
    expect(a?.children?.[0].id).toBe("b");
  });

  it("indent: no-op for first child", () => {
    const blocks: VisualBlock[] = [
      { id: "a", type: "paragraph", richText: [], children: [] },
    ];
    expect(indentBlock(blocks, "a")).toEqual(blocks);
  });

  it("outdent: works from nested depth 2", () => {
    const blocks: VisualBlock[] = [
      {
        id: "l1",
        type: "toggle",
        richText: [],
        children: [
          {
            id: "l2",
            type: "bulleted_list_item",
            richText: [],
            children: [
              { id: "l3", type: "paragraph", richText: [], children: [] },
            ],
          },
        ],
      },
    ];
    const result = outdentBlock(blocks, "l3");
    const l2 = result[0].children!.find((b) => b.id === "l2");
    expect(l2?.children?.length).toBe(0);
    expect(l2?.children?.find((b) => b.id === "l3")).toBeUndefined();
    expect(result[0].children!.length).toBe(2);
    expect(result[0].children![1].id).toBe("l3");
  });

  it("findBlockById: finds at any depth", () => {
    const blocks = makeBlocks();
    const found = findBlockById(blocks, "child-1");
    expect(found).not.toBeNull();
    expect(found!.block.id).toBe("child-1");
    expect(found!.block.type).toBe("paragraph");
  });

  it("findBlockById: returns null for missing", () => {
    expect(findBlockById(makeBlocks(), "nonexistent")).toBeNull();
  });
});

// ── 2. registry.ts: canHaveChildren + children serialization ──

describe("registry.ts", () => {
  it("all 12 block types have canHaveChildren", () => {
    const types = [
      "paragraph", "heading_1", "heading_2", "heading_3",
      "bulleted_list_item", "numbered_list_item", "to_do",
      "quote", "toggle", "divider", "code", "callout",
    ];
    for (const t of types) {
      const def = blockRegistry[t];
      expect(def).toBeDefined();
      expect(typeof def.canHaveChildren).toBe("boolean");
    }
  });

  it("types with canHaveChildren=true include children in createDefault", () => {
    const childTypes = ["paragraph", "bulleted_list_item", "numbered_list_item", "to_do", "quote", "toggle", "callout"];
    for (const t of childTypes) {
      const def = blockRegistry[t];
      const block = def.createDefault();
      expect(Array.isArray(block.children)).toBe(true);
    }
  });

  it("types with canHaveChildren=false do not include children", () => {
    const terminalTypes = ["heading_1", "heading_2", "heading_3", "divider", "code"];
    for (const t of terminalTypes) {
      const def = blockRegistry[t];
      const block = def.createDefault();
      expect(block.children).toBeUndefined();
    }
  });

  it("paragraph toNotionBlock serializes children", () => {
    const def = blockRegistry["paragraph"];
    const block = def.createDefault();
    block.children = [{
      id: "nested",
      type: "paragraph" as any,
      richText: [{ id: "rt1", text: "nested" }],
    }];
    const result = def.toNotionBlock(block);
    expect(result.paragraph.children).toBeDefined();
    expect(Array.isArray(result.paragraph.children)).toBe(true);
    expect(result.paragraph.children.length).toBe(1);
  });

  it("to_do toNotionBlock serializes children", () => {
    const def = blockRegistry["to_do"];
    const block = def.createDefault();
    block.children = [{
      id: "nested",
      type: "paragraph" as any,
      richText: [{ id: "rt1", text: "nested" }],
    }];
    const result = def.toNotionBlock(block);
    expect(result.to_do.children).toBeDefined();
  });

  it("quote toNotionBlock serializes children", () => {
    const def = blockRegistry["quote"];
    const block = def.createDefault();
    block.children = [{
      id: "nested",
      type: "paragraph" as any,
      richText: [{ id: "rt1", text: "nested" }],
    }];
    const result = def.toNotionBlock(block);
    expect(result.quote.children).toBeDefined();
  });

  it("callout toNotionBlock serializes children", () => {
    const def = blockRegistry["callout"];
    const block = def.createDefault();
    block.children = [{
      id: "nested",
      type: "paragraph" as any,
      richText: [{ id: "rt1", text: "nested" }],
    }];
    const result = def.toNotionBlock(block);
    expect(result.callout.children).toBeDefined();
  });
});

// ── 3. convert.ts: children through visualBlocksToNotionJson ──

describe("convert.ts", () => {
  it("visualBlocksToNotionJson propagates children for all child-capable types", () => {
    const blocks: VisualBlock[] = [
      {
        id: "p1",
        type: "paragraph",
        richText: [],
        children: [
          { id: "c1", type: "paragraph", richText: [], children: [] },
          { id: "c2", type: "paragraph", richText: [], children: [] },
        ],
      },
      {
        id: "t1",
        type: "to_do",
        richText: [],
        checked: false,
        children: [
          { id: "c3", type: "paragraph", richText: [], children: [] },
        ],
      },
      {
        id: "q1",
        type: "quote",
        richText: [],
        children: [
          { id: "c4", type: "paragraph", richText: [], children: [] },
        ],
      },
      {
        id: "ca1",
        type: "callout",
        richText: [],
        children: [
          { id: "c5", type: "paragraph", richText: [], children: [] },
        ],
      },
    ];
    const json = visualBlocksToNotionJson(blocks);
    expect(json[0].paragraph.children.length).toBe(2);
    expect(json[1].to_do.children.length).toBe(1);
    expect(json[2].quote.children.length).toBe(1);
    expect(json[3].callout.children.length).toBe(1);
  });

  it("paragraph children appear in visualBlocksToMarkdown", () => {
    const blocks: VisualBlock[] = [
      {
        id: "p1",
        type: "paragraph",
        richText: [{ id: "rt1", text: "parent" }],
        children: [
          { id: "c1", type: "paragraph", richText: [{ id: "rt2", text: "child" }] },
        ],
      },
    ];
    const md = visualBlocksToMarkdown(blocks);
    expect(md).toContain("parent");
  });
});

// ── 4. Expression scanner test (useJsonValidation) ──

describe("useJsonValidation expression scanner", () => {
  function substituteExpressionsFromJson(input: string): {
    result: string;
    hasExpression: boolean;
    unclosedExpression: boolean;
  } {
    let output = "";
    let inString = false;
    let escaped = false;
    let exprOpenAt = -1;
    let hasExpression = false;
    let i = 0;

    while (i < input.length) {
      const ch = input[i];

      if (escaped) {
        escaped = false;
        if (exprOpenAt === -1) output += ch;
        i++;
        continue;
      }

      if (ch === "\\" && inString) {
        escaped = true;
        if (exprOpenAt === -1) output += ch;
        i++;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        if (exprOpenAt === -1) output += ch;
        i++;
        continue;
      }

      if (!inString && exprOpenAt === -1 && ch === "{" && i + 1 < input.length && input[i + 1] === "{") {
        exprOpenAt = output.length;
        i += 2;
        continue;
      }

      if (!inString && exprOpenAt !== -1 && ch === "}" && i + 1 < input.length && input[i + 1] === "}") {
        output = output.slice(0, exprOpenAt) + "null";
        exprOpenAt = -1;
        hasExpression = true;
        i += 2;
        continue;
      }

      if (exprOpenAt === -1) {
        output += ch;
      }
      i++;
    }

    return {
      result: output,
      hasExpression,
      unclosedExpression: exprOpenAt !== -1,
    };
  }

  it("substitutes raw expression outside string with null", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }} }',
    );
    expect(result).toBe('{ "name": null }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("preserves expression inside string", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": "Hello {{ $json.name }}" }',
    );
    expect(result).toBe('{ "name": "Hello {{ $json.name }}" }');
    expect(hasExpression).toBe(false);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("fails invalid JSON after substitution", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }} THIS IS INVALID }',
    );
    expect(result).toBe('{ "name": null THIS IS INVALID }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).toThrow();
  });

  it("detects unclosed expression", () => {
    const { unclosedExpression } = substituteExpressionsFromJson(
      '{ "name": {{ $json.name }',
    );
    expect(unclosedExpression).toBe(true);
  });

  it("handles escaped quotes preserving expressions inside strings", () => {
    const input = '{ "msg": "He said \\"{{ $json.msg }}\\"", "val": {{ $json.val }} }';
    const { result, hasExpression } = substituteExpressionsFromJson(input);
    expect(result).toBe('{ "msg": "He said \\"{{ $json.msg }}\\"", "val": null }');
    expect(hasExpression).toBe(true);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("multiple expressions outside strings all substituted", () => {
    const { result } = substituteExpressionsFromJson(
      '{ "a": {{ $json.a }}, "b": {{ $json.b }} }',
    );
    expect(result).toBe('{ "a": null, "b": null }');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("empty object passes through unchanged", () => {
    const { result } = substituteExpressionsFromJson("{}");
    expect(result).toBe("{}");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("no expression: pass through unchanged", () => {
    const { result, hasExpression } = substituteExpressionsFromJson(
      '{ "key": "value" }',
    );
    expect(result).toBe('{ "key": "value" }');
    expect(hasExpression).toBe(false);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("expression in middle of value with surrounding text fails (no comma)", () => {
    const { result } = substituteExpressionsFromJson(
      '{ "a": {{ $val }} "b": 2 }',
    );
    expect(() => JSON.parse(result)).toThrow();
  });
});
