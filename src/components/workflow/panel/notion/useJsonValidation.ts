import { useMemo } from "react";

export type JsonValidationResult = {
  isValid: boolean;
  error: string | null;
  isExpression: boolean;
};

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

export function useJsonValidation(value: string): JsonValidationResult {
  return useMemo(() => {
    const trimmed = value.trim();

    if (!trimmed) {
      return { isValid: true, error: null, isExpression: false };
    }

    const { result, hasExpression, unclosedExpression } =
      substituteExpressionsFromJson(trimmed);

    if (unclosedExpression) {
      return {
        isValid: false,
        error: "Unclosed expression {{ ...",
        isExpression: true,
      };
    }

    try {
      JSON.parse(result);
      return { isValid: true, error: null, isExpression: hasExpression };
    } catch (e) {
      const err = e as SyntaxError;
      const match = err.message.match(/position\s+(\d+)/);
      if (match) {
        const pos = parseInt(match[1], 10);
        const lines = trimmed.slice(0, pos).split("\n");
        const lineNum = lines.length;
        const colNum = pos - trimmed.lastIndexOf("\n", pos - 1);
        return {
          isValid: false,
          error: `Invalid JSON at line ${lineNum}, column ${colNum}`,
          isExpression: hasExpression,
        };
      }
      return {
        isValid: false,
        error: "Invalid JSON",
        isExpression: hasExpression,
      };
    }
  }, [value]);
}
