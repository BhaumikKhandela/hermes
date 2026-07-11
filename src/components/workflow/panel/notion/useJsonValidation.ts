import { useMemo } from "react";

const EXPRESSION_PATTERN = /\{\{.*?\}\}/;

function containsExpression(value: string): boolean {
  return EXPRESSION_PATTERN.test(value);
}

export type JsonValidationResult = {
  isValid: boolean;
  error: string | null;
  isExpression: boolean;
};

export function useJsonValidation(value: string): JsonValidationResult {
  return useMemo(() => {
    const trimmed = value.trim();

    if (!trimmed) {
      return { isValid: true, error: null, isExpression: false };
    }

    if (containsExpression(trimmed)) {
      return { isValid: true, error: null, isExpression: true };
    }

    try {
      JSON.parse(trimmed);
      return { isValid: true, error: null, isExpression: false };
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
          isExpression: false,
        };
      }
      return {
        isValid: false,
        error: "Invalid JSON",
        isExpression: false,
      };
    }
  }, [value]);
}
