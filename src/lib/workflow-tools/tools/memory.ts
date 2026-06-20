import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { ToolFactory } from "../types";

const getMemoryDir = (config?: Record<string, any>) => {
  const projectId = config?.projectId || "default";
  return path.resolve(
    process.cwd(),
    "public",
    "workflow-memory",
    projectId,
  );
};

export const createMemoryTool: ToolFactory = (config) => {
  const memoryDir = getMemoryDir(config);

  return tool(
    async ({ action, key, value }) => {
      switch (action) {
        case "save": {
          await fs.mkdir(memoryDir, { recursive: true });
          const filePath = path.join(memoryDir, `${key}.json`);
          await fs.writeFile(filePath, JSON.stringify({ key, value }), "utf-8");
          return `Saved memory: ${key}`;
        }
        case "read": {
          const filePath = path.join(memoryDir, `${key}.json`);
          try {
            const data = await fs.readFile(filePath, "utf-8");
            const parsed = JSON.parse(data);
            return parsed.value;
          } catch {
            return `No memory found for key: ${key}`;
          }
        }
        case "list": {
          await fs.mkdir(memoryDir, { recursive: true });
          const files = await fs.readdir(memoryDir);
          return files
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(".json", ""))
            .join(", ");
        }
        case "delete": {
          const filePath = path.join(memoryDir, `${key}.json`);
          try {
            await fs.unlink(filePath);
            return `Deleted memory: ${key}`;
          } catch {
            return `No memory found for key: ${key}`;
          }
        }
        default:
          return `Unknown action: ${action}. Use save, read, list, or delete.`;
      }
    },
    {
      name: "memory",
      description:
        "Persistent key-value memory store. Save facts, read them back, list all keys, or delete them.",
      schema: z.object({
        action: z
          .enum(["save", "read", "list", "delete"])
          .describe("Operation: save, read, list, or delete"),
        key: z.string().describe("Memory key name"),
        value: z
          .string()
          .optional()
          .describe("Value to store (required for save)"),
      }),
    },
  );
};
