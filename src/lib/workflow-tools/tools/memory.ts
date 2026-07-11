import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Redis from "ioredis";
import { ToolFactory } from "../types";

const memorySchema = z.object({
  action: z
    .enum(["save", "read", "list", "delete"])
    .describe("Operation: save, read, list, or delete"),
  key: z
    .string()
    .optional()
    .describe("Memory key name (required for save, read, delete)"),
  value: z
    .any()
    .optional()
    .describe("Value to store (required for save)"),
  projectId: z
    .string()
    .optional()
    .describe("Project namespace to isolate keys"),
  ttl: z
    .number()
    .optional()
    .describe("TTL in seconds for the stored value (save only)"),
});

const partialMemorySchema = memorySchema.partial();

type MemoryInput = z.input<typeof partialMemorySchema>;

function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function buildKey(url: string, projectId: string, key: string): string {
  return `memory:${hashUrl(url)}:${projectId || "default"}:${key}`;
}

export const createMemoryTool: ToolFactory = (config) => {
  const url = config?.url || "";

  return tool(
    async (input: MemoryInput) => {
      if (!url) {
        return "Memory tool is not configured. Provide a Redis connection URL via the credential settings.";
      }

      const parsed = partialMemorySchema.parse(input);
      const action = parsed.action || config?.action || "save";
      const key = parsed.key || config?.key;
      const value = parsed.value ?? config?.value;
      const projectId = parsed.projectId || config?.projectId || "default";
      const ttl = parsed.ttl || config?.ttl;

      let redis: Redis | null = null;
      try {
        redis = new Redis(url, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });

        switch (action) {
          case "save": {
            if (!key) {
              return "key is required for save. Provide it as a tool argument or configure it in the node settings.";
            }
            const fullKey = buildKey(url, projectId, key);
            const serialized = typeof value === "string" ? value : JSON.stringify(value);
            if (ttl && ttl > 0) {
              await redis.setex(fullKey, ttl, serialized);
            } else {
              await redis.set(fullKey, serialized);
            }
            return `Saved memory: ${key}`;
          }

          case "read": {
            if (!key) {
              return "key is required for read. Provide it as a tool argument or configure it in the node settings.";
            }
            const fullKey = buildKey(url, projectId, key);
            const data = await redis.get(fullKey);
            if (data === null) {
              return `No memory found for key: ${key}`;
            }
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          }

          case "list": {
            const pattern = `memory:${hashUrl(url)}:${projectId}:*`;
            const keys: string[] = [];
            let cursor = "0";
            do {
              const [nextCursor, batch] = await redis.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                100,
              );
              cursor = nextCursor;
              keys.push(...batch);
            } while (cursor !== "0");
            const prefixLen = `memory:${hashUrl(url)}:${projectId}:`.length;
            return keys.map((k) => k.substring(prefixLen)).join(", ") || "No keys found.";
          }

          case "delete": {
            if (!key) {
              return "key is required for delete. Provide it as a tool argument or configure it in the node settings.";
            }
            const fullKey = buildKey(url, projectId, key);
            const deleted = await redis.del(fullKey);
            return deleted > 0
              ? `Deleted memory: ${key}`
              : `No memory found for key: ${key}`;
          }

          default:
            return `Unknown action: ${action}. Use save, read, list, or delete.`;
        }
      } finally {
        if (redis) {
          redis.disconnect();
        }
      }
    },
    {
      name: "memory",
      description:
        "Redis-backed persistent key-value memory store. Save any value, read it back, list all keys in a project, or delete them. Supports TTL for auto-expiring values. Falls back to configured values when arguments are omitted.",
      schema: partialMemorySchema,
    },
  );
};
