import { promises as fs } from "node:fs";
import path from "node:path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  appendAFile,
  createAFile,
  readAFile,
  updateAFile,
} from "@/helper/fsHelper";

interface UserData {
  userId: string;
}

export function buildFileSystemTools(memoryRoot: string, userData: UserData) {
  const createFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return createAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({ message: "error occur when creating file" });
      }
    },
    {
      name: "createAFile",
      description: "Create a file under memory_system.",
      schema: z.object({
        content: z.string().default(""),
        fileName: z.string().min(1),
      }),
    },
  );

  const readFileTool = tool(
    async ({ fileName }) => {
      try {
        const res = await readAFile(memoryRoot, fileName).catch(
          (error) => error,
        );
        if (res instanceof Error) {
          return JSON.stringify({
            message: "File you are trying to read doesn't exist.",
          });
        }
        return res;
      } catch (error) {
        return JSON.stringify({
          message: "File you are trying to read doesn't exist.",
        });
      }
    },
    {
      name: "readAFile",
      description: "Read a file under memory_system",
      schema: z.object({
        fileName: z.string().min(1),
      }),
    },
  );

  const updateFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return updateAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({
          message: "File you are trying to update doesnt exist",
        });
      }
    },
    {
      name: "updateAFile",
      description: "Create or overwrite a file under memory_system.",
      schema: z.object({
        content: z.string(),
        fileName: z.string().min(1),
      }),
    },
  );

  const appendFileTool = tool(
    async ({ fileName, content }) => {
      try {
        return appendAFile(memoryRoot, fileName, content);
      } catch (error) {
        return JSON.stringify({
          message: "file you are trying to read doesn't exist.",
        });
      }
    },
    {
      name: "appendAFile",
      description: "Append content to a file under memory_system.",
      schema: z.object({
        fileName: z.string().min(1),
        content: z.string(),
      }),
    },
  );

  const writeLTMTool = tool(
    async ({ content }) => {
      const now = new Date();
      const formattedDate = now.toTimeString().slice(0, 8);
      const memoryContent = `## [Time: ${formattedDate}] \n${content}\n\n`;
      try {
        return appendAFile(
          memoryRoot,
          `MEMORY-${userData.userId}.md`,
          memoryContent,
        );
      } catch (error) {
        return JSON.stringify({
          message: "File you are trying to read doesn't exist.",
        });
      }
    },
    {
      name: "writeLTM",
      description:
        "This tool allows you to write into the LongTerm memory MEMORY.md",
      schema: z.object({
        content: z.string(),
      }),
    },
  );

  return {
    createFileTool,
    readFileTool,
    updateFileTool,
    appendFileTool,
    writeLTMTool,
  };
}
