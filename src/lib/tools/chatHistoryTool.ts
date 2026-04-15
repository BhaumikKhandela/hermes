import fs from "fs";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import path from "path";

const ROOT = process.cwd();
const CHAT_HISTORY_DIR = path.join(ROOT, "public", "chat-history");

if (!fs.existsSync(CHAT_HISTORY_DIR)) {
  fs.mkdirSync(CHAT_HISTORY_DIR, { recursive: true });
}

const HISTORY_FILE = path.join(CHAT_HISTORY_DIR, "chat-history-json");

export const messageSchema = z.object({
  role: z.enum(["user", "ai"]),
  userId: z.string(),
  projectId: z.string(),
  content: z.string(),
  thinking: z.string().optional(),
});

export const writeToChatHistoryTool = tool(
  async ({ messages }) => {
    try {
      let history: any[] = [];

      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, "utf-8");
        history = JSON.parse(data);
      }

      history.push(...messages);

      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");

      return "Chat history written successfully.";
    } catch (error) {
      return "Failed to write to chat history.";
    }
  },
  {
    name: "WriteToChatHistory",
    description: "Write conversation to chat history",
    schema: z.object({
      messages: z.array(messageSchema),
    }),
  },
);

export const readChatHistoryTool = tool(
  async ({ userId, projectId }) => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return "[]";
      }

      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      const history: any[] = JSON.parse(data);

      // Filter messages by userId + projectId
      const filtered = history.filter(
        (msg) => msg.userId === userId && msg.projectId === projectId,
      );

      return JSON.stringify(filtered);
    } catch (error) {
      return "[]";
    }
  },
  {
    name: "ReadChatHistory",
    description: "Read conversation history for a specific user and project",
    schema: z.object({
      userId: z.string(),
      projectId: z.string(),
    }),
  },
);
