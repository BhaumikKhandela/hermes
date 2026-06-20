import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { ToolFactory } from "../types";

const getWorkDir = (config?: Record<string, any>) => {
  const base = config?.projectId
    ? path.resolve(process.cwd(), "public", "workflow-files", config.projectId)
    : path.resolve(process.cwd(), "public", "workflow-files");
  return base;
};

const safePath = (root: string, filePath: string): string => {
  const resolved = path.resolve(root, filePath);
  if (!resolved.startsWith(root)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
};

export const createReadFileTool: ToolFactory = (config) => {
  const root = getWorkDir(config);
  return tool(
    async ({ path: filePath }) => {
      const fullPath = safePath(root, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    },
    {
      name: "readFile",
      description: "Read the contents of a file from the project workspace.",
      schema: z.object({
        path: z.string().describe("Relative path to the file"),
      }),
    },
  );
};

export const createWriteFileTool: ToolFactory = (config) => {
  const root = getWorkDir(config);
  return tool(
    async ({ path: filePath, content }) => {
      const fullPath = safePath(root, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      return `File written: ${filePath}`;
    },
    {
      name: "writeFile",
      description: "Write content to a file in the project workspace.",
      schema: z.object({
        path: z.string().describe("Relative path to the file"),
        content: z.string().describe("Content to write to the file"),
      }),
    },
  );
};

export const createReadAndUpdateFileTool: ToolFactory = (config) => {
  const root = getWorkDir(config);
  return tool(
    async ({ path: filePath, oldContent, newContent }) => {
      const fullPath = safePath(root, filePath);
      const existing = await fs.readFile(fullPath, "utf-8");
      if (!existing.includes(oldContent)) {
        return `Could not find the specified content in ${filePath}`;
      }
      const updated = existing.replace(oldContent, newContent);
      await fs.writeFile(fullPath, updated, "utf-8");
      return `File updated: ${filePath}`;
    },
    {
      name: "readAndUpdateFile",
      description:
        "Read a file, find and replace content, then write it back.",
      schema: z.object({
        path: z.string().describe("Relative path to the file"),
        oldContent: z.string().describe("Content to find and replace"),
        newContent: z.string().describe("New content to insert"),
      }),
    },
  );
};
