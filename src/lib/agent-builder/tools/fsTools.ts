import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { glob as globFn } from "glob";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "agent-builder");

// helper (added, no impact on structure)
function isPathSafe(resolvedPath: string) {
  const relative = path.relative(BASE_DIR, resolvedPath);
  return !(relative.startsWith("..") || path.isAbsolute(relative));
}

function ok(data: string) {
  return JSON.stringify({ success: true, data });
}

function fail(error: string) {
  return JSON.stringify({ success: false, error });
}

export const write_file = tool(
  async ({ filename, content }) => {
    try {
      const fullPath = path.join(BASE_DIR, filename);

      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.promises.writeFile(fullPath, content, "utf-8");

      return ok(
        `Successfully wrote to ${filename} characters :${content.length}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown write error";
      return fail(`Error writing file: ${message}`);
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
      filename: z.string(),
      content: z.string(),
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
        return;
      }

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(entryPath);
        } else if (entry.isFile()) {
          try {
            const content = await fs.promises.readFile(entryPath, "utf-8");
            const lines = content.split("\n");

            lines.forEach((line, index) => {
              if (regex.test(line)) {
                results.push(
                  `${path.relative(BASE_DIR, entryPath)}:${index + 1}: ${line.trim()}`,
                );
              }
            });
          } catch {}
        }
      }
    }

    try {
      await walk(fullPath);

      if (results.length === 0) {
        return ok(`No matches found for pattern: "${pattern}"`);
      }

      return ok(results.join("\n"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown grep error";
      return fail(`Error during grep: ${message}`);
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

      if (!isPathSafe(resolvedPath)) {
        return fail("Access outside allowed directory is not permitted.");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");

      const slice = lines.slice(offset, offset + limit);

      const formatted = slice
        .map(
          (line, i) => `${(offset + i + 1).toString().padStart(4)} | ${line}`,
        )
        .join("\n");

      if (offset + limit < lines.length) {
        const remaining = lines.length - (offset + limit);
        return ok(
          `${formatted}\n\n[... ${remaining} more lines. Use offset=${offset + limit}]`,
        );
      }

      return ok(formatted);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown read error";
      return fail(`Error reading file: ${message}`);
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
      filename: z.string(),
      offset: z.number().min(0).optional().default(0),
      limit: z.number().min(1).optional().default(100),
    }),
  },
);

export const edit_file = tool(
  async ({ filename, old_str, new_str }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, filename);

      if (!isPathSafe(resolvedPath)) {
        return fail("Access outside allowed directory is not permitted");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf8");

      if (!content.includes(old_str)) {
        return fail(
          `Error: Exact match for 'old_str' not found in ${filename}. No changes made.`,
        );
      }

      const updatedContent = content.replace(old_str, new_str);
      await fs.promises.writeFile(resolvedPath, updatedContent, "utf8");

      return ok(`Successfully updated ${filename}.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown edit error";
      return fail(`Error editing file: ${message}`);
    }
  },
  {
    name: "edit_file",
    description: "Find and replace a specific string within a file.",
    schema: z.object({
      filename: z.string(),
      old_str: z.string(),
      new_str: z.string(),
    }),
  },
);

export const ls = tool(
  async ({ path: targetPath = "." }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, targetPath);

      if (!isPathSafe(resolvedPath)) {
        return ok(
          "<think> Access outside allowed directory is not permitted</think>",
        );
      }

      const entries = await fs.promises.readdir(resolvedPath, {
        withFileTypes: true,
      });

      if (entries.length === 0) {
        return ok("<think>Directory is empty.</think>");
      }

      const header =
        "| Name | Type | Extension | Children Count |\n|-------|-------|------|-------|";

      const rows = entries.map((entry) => {
        if (entry.isDirectory()) {
          return `<think>| ${entry.name} | folder | | 0 |</think>`;
        } else {
          return `<think>| ${entry.name} | file | ${path.extname(entry.name)} | </think>`;
        }
      });

      return ok(`<think>${[header, ...rows].join("\n")}</think>`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown ls error";
      return ok(`<think>Error listing directory: ${message}</think>`);
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
      path: z.string().optional(),
    }),
  },
);

export const glob = tool(
  async ({ pattern }) => {
    try {
      const matches = await globFn(pattern, {
        cwd: BASE_DIR,
        ignore: ["**/node_modules/**"],
      });

      if (matches.length === 0) {
        return ok(`No matches for pattern "${pattern}" inside ${BASE_DIR}`);
      }

      return ok(matches.join("\n"));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown glob error";
      return fail(`Error performing glob: ${message}`);
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
        User: "Find all files named page.tsx"
        Call:
        {
        "pattern": "**/page.tsx"
        }
        
        Example 4:
        User: "Search for all config files"
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
