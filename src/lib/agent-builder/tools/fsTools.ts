import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { glob as globFn } from "glob";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "agent-builder");

export const write_file = tool(
  async ({ filename, content }) => {
    try {
      const fullPath = path.join(BASE_DIR, filename);

      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file (overwrite if exists)
      await fs.promises.writeFile(fullPath, content, "utf-8");

      return JSON.stringify({
        message: `Successfully wrote to ${filename} characters :${content.length}`,
      });
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: `
       Create or overwrite a file inside the project workspace.
       
       This tool writes text content to a file. if the file already exists, it will be completely overwrite the file.
       
       PATH USAGE:
       - You may provide either:
       1. A full relative path with folders (recommended)
          Example: "reports/analysis.md"
          Example: "src/utils/helper.ts"
          Example: "docs/setup/installation.md"
          
       2. Only a filename
          Example: "notes.md"
          Example: "todo.txt"
          
    If only a filename is provided, the file will be created in the project root directory.
    
    DIRECTORY HANDLING
    - If the specific directories do not exist, they will automatically be created.
    - Nested folders are supported.
    
    FILE BEHAVIOUR
    - The file will be written using UTF-8 encoding
    - Existing files will be replaced entirely.
    - This tool is intended for generating project files, reports, documentation, source code or any other text-based files.
    
    WHEN TO USE:
    Use this tool whenever you need to:
    - Create a new file
    - Save generated code
    - Write reports or research results
    `,
    schema: z.object({
      filename: z
        .string()
        .describe(
          "Target file path or filename. Can be a simple filename (e.g. 'report.md')",
        ),
      content: z
        .string()
        .describe("The full text content that will be written into the file."),
    }),
  },
);

export const grep = tool(
  async ({ pattern, path: searchPath = "." }) => {
    const fullPath = path.join(BASE_DIR, searchPath);
    const results: string[] = [];

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, "i");
    } catch {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      regex = new RegExp(escaped, "i");
    }

    async function walk(dir: string): Promise<void> {
      let entries: fs.Dirent[];

      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown directory read error";
        throw new Error(`Failed to read directory "${dir}": ${message}`);
      }

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(entryPath);
        } else if (entry.isFile()) {
          let content: string;

          try {
            content = await fs.promises.readFile(entryPath, "utf-8");
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Unknown file read error";

            // skip unreadable files but don’t crash entire search
            results.push(
              `[ERROR] ${path.relative(BASE_DIR, entryPath)}: ${message}`,
            );
            continue;
          }

          const lines = content.split("\n");

          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.push(
                `${path.relative(BASE_DIR, entryPath)}:${index + 1}: ${line.trim()}`,
              );
            }
          });
        }
      }
    }

    try {
      await walk(fullPath);

      if (results.length === 0) {
        return `No matches found for pattern: "${pattern}"`;
      }

      return results.join("\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown grep error";

      return `Error during grep: ${message}`;
    }
  },
  {
    name: "grep",
    description: "Search for a string or regex pattern inside file contents.",
    schema: z.object({
      pattern: z.string().describe("The string or regex to search for"),
      path: z
        .string()
        .optional()
        .describe("Relative path inside deep-agent folder"),
    }),
  },
);

export const read_file = tool(
  async ({ filename, offset = 0, limit = 100 }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, filename);

      if (!resolvedPath.startsWith(BASE_DIR)) {
        throw new Error("Access outside allowed directory is not permitted.");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");

      const slice = lines.slice(offset, offset + limit);

      const formatted = slice
        .map(
          (line, i) => `${(offset + i + 1).toString().padStart(4)} | ${line}`,
        )
        .join("\n");

      // Check if more lines exist
      if (offset + limit < lines.length) {
        const remaining = lines.length - (offset + limit);
        return `${formatted}\n\n[... ${remaining} more lines. Use offset=${offset + limit}]`;
      }

      return `${formatted}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown read error";
      return `Error reading file: ${message}`;
    }
  },
  {
    name: "read_file",
    description: `
    Read the contents of a file inside the project root and return it with line numbers, supporting streaming/pagination
    
    - Use offset and limit to read in chunks.
    - Returns continuation hint if more lines remain.
    - Each line is prefixed with its number.
    - Works with toolConfig.writer to stream content.
    `,
    schema: z.object({
      filename: z
        .string()
        .describe("Filename to read relative to project root"),
      offset: z.number().min(0).optional().default(0),
      limit: z.number().min(1).optional().default(100),
    }),
  },
);

export const edit_file = tool(
  async ({ filename, old_str, new_str }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, filename);

      // Prevent directory traversal
      if (!resolvedPath.startsWith(BASE_DIR)) {
        throw new Error("Access outside allowed directory is not permitted");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf8");

      if (!content.includes(old_str)) {
        return `Error: Exact match for 'old_str' not found in ${filename}. No `;
      }

      const updatedContent = content.replace(old_str, new_str);

      await fs.promises.writeFile(resolvedPath, updatedContent, "utf8");

      return `Successfully updated ${filename}.`;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown edit error";

      return `Error editing file: ${message}`;
    }
  },
  {
    name: "edit_file",
    description: "Find and replace a specific string within a file.",
    schema: z.object({
      filename: z.string().describe("filename to edit"),
      old_str: z.string().describe("Exact text to find"),
      new_str: z.string().describe("Text to replace it with"),
    }),
  },
);

export const ls = tool(
  async ({ path: targetPath = "." }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, targetPath);

      // Prevent directory traversal
      if (!resolvedPath.startsWith(BASE_DIR)) {
        return "<think> Access outside allowed directory is not permitted</think>";
      }

      const entries = await fs.promises.readdir(resolvedPath, {
        withFileTypes: true,
      });

      if (entries.length === 0) {
        return "<think>Directory is empty.</think>";
      }

      // Build top-level Markdown table
      const header =
        "| Name | Type | Extension | Children Count |\n|-------|-------|------|-------|";
      const rows = entries.map((entry) => {
        if (entry.isDirectory()) {
          return `<think>| ${entry.name} | folder | | 0 |</think>`;
        } else {
          return `<think>| ${entry.name} | file | ${path.extname(entry.name)} | </think>`;
        }
      });

      return `<think>${[header, ...rows].join("\n")}</think>`;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown ls error";
      return `<think>Error listing directory: ${message}</think>`;
    }
  },
  {
    name: "ls",
    description: `
    Defaults to project root "." if no path provided
    
    List files and directories inside the project root as a **Markdown table**.
    
    - Returns only top-level objects
        - name
        - type: "file" or "folder".
        - extension for files.
        - children_count for folders (empty)
        
    - Safe:
        - Only relative paths allowed
        - Directory traversal blocked
        
    - Default to project root "." if no path provided
    `,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Relative path inside project folder. Defaults to '.'"),
    }),
  },
);

export const glob = tool(
  async ({ pattern }) => {
    try {
      const matches = await globFn(pattern, {
        cwd: BASE_DIR,
        ignore: ["**//node_modules/**"],
      });

      if (matches.length === 0) {
        return `No matches for pattern "${pattern}" inside ${BASE_DIR}`;
      }

      return matches.join("\n");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown glob error";
      return `Error performing glob: ${message}`;
    }
  },
  {
    name: "glob",
    description: `
        Search for files in the project directory using glob wildcard patterns.
        
        Use this tool when:
        - You need to locate files before reading or modifying them.
        - The exact file path is unknown.
        - You need to list files of a specific type (e.g., all .ts or .md files).
        - You need to inspect project structure.
        
        Important rules:
        - All searches are relative to the project root (BASE_DIR).
        - Never use absolute paths.
        - Use forward slashes (/), even on Windows.
        - Avoid searching large directories unnecessarily.
        - "node_modules" is automatically excluded.
        
        Glob pattern syntax:
        - "*" matches any character except "/"
        - "**" matches any number of nested directories
        - "*.ts" matches all TypeScript files in current directory
        - "src/**/*.ts" matches all TypeScript files inside src recursively

        Few-shot examples:

        Example 1:
        User: "Find all TypeScript files"
        Call:
        {
        "pattern": "**/*.ts"
        }

        Example 2:
        User: "List all markdown files in docs folder"
        Call:
        {
        "pattern": "docs/**/*.md"
        }
        
        Example 3:
        User: "Find all files named page.tsx
        Call:
        {
        "pattern": "**/pages.tsx"
        }
        
        Example 4:
        User: "Search for all config files
        Call:
        {
        "pattern": "**/*config*.*"
        }
        
        The tool returns:
        - A newline-separated list of relative file paths
        - Or a message of no matches are found
        `,

    schema: z.object({
      pattern: z.string(),
    }),
  },
);

export const filesystemTools = [
  write_file,
  read_file,
  edit_file,
  ls,
  grep,
  glob,
];
