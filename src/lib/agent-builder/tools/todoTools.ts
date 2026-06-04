import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuid } from "uuid";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "agent-builder");

const TODO_FILE_NAME = `.todos-${Date.now()}.json`;

const TODO_FILE = path.join(BASE_DIR, TODO_FILE_NAME);

const InputTaskSchema = z.object({
  task: z.string(),
  assigned_to: z.string(),
  status: z
    .enum(["pending", "in_progress", "completed", "blocked"])
    .default("pending"),
  parent_id: z.string().optional(),
  dependencies: z.array(z.string().optional()),
});

const StoredTaskSchema = z.object({
  id: z.uuid(),
  task: z.string(),
  assigned_to: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]),
  parent_id: z.uuid().optional(),
  dependencies: z.array(z.uuid()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const write_todos = tool(
  async ({ filename, todos }, toolConfig: any) => {
    try {
      await fs.promises.mkdir(BASE_DIR, { recursive: true });
      const realFileName = `${filename}.todos.json`;
      const filePath = path.join(BASE_DIR, realFileName);

      const now = new Date().toISOString();

      const enriched = todos.map((t) => ({
        id: uuid(),
        task: t.task,
        assigned_to: t.assigned_to,
        status: t.status ?? "pending",
        parent_id: t.parent_id,
        dependencies: t.dependencies ?? [],
        created_at: now,
        updated_at: now,
      }));

      const jsonStringTodos = JSON.stringify(enriched, null, 2);
      await fs.promises.writeFile(filePath, jsonStringTodos, "utf8");

      toolConfig.writer({
        todos: "todos",
        todoListt: jsonStringTodos,
      });

      return `<think>${JSON.stringify(
        {
          message: `✅ TODO list saved file name : ${realFileName}`,
          tasks: enriched,
        },
        null,
        2,
      )}</think>`;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `❌ Error writing TODO list: ${error.message}`;
      } else {
        return `❌ Error writing TODO list`;
      }
    }
  },
  {
    name: "write_todos",
    description: `
      Creates or overwrites a workflow TODO list in the system.

      ### Purpose
      This tool allows the Manager agent to initialize and maintain
      a structured task list for a workflow.

      It ensures:
      - Every task receives a unique system-generated ID
      - Consistent timestamps are automatically applied
      - Task dependencies remain normalized
      - Parent-child task hierarchies can be represented
      - Workflow files remain structurally consistent

      This tool is typically used at the start of a workflow
      before delegating tasks to worker agents.

      ### File Location
      The agent may provide:
      - A simple workflow name
      - Or a nested folder path together with the filename

      Examples:
      - "research-plan"
      - "projects/ai-agent/research-plan"
      - "tasks/frontend/ui-workflow"

      The tool automatically:
      - Creates missing directories
      - Appends the ".todos.json" extension
      - Stores the file inside the workflow workspace

      Example generated paths:
      - /BASE_DIR/research-plan.todos.json
      - /BASE_DIR/projects/ai-agent/research-plan.todos.json

      ### Behavior
      - **ID generation:** Each task receives a system-generated "id"
      - **Timestamps:** "created_at" and "updated_at" are automatically assigned
      - **Dependencies:** Defaults to an empty array when not provided
      - **Status:** Defaults to "pending" if omitted
      - **Parent-child hierarchy:** Optional "parent_id" enables hierarchical task structure
      - **Automatic directories:** Nested folders are created automatically if needed
      - **Overwrite behavior:** Existing workflow files are completely replaced

      ### Returned Output
      The tool returns:
      - "message": confirmation including the generated filename
      - "tasks": the fully normalized task array including generated IDs and timestamps

      ### How to Use
      1. Provide a filename or folder/filename path
      2. Provide an array of tasks

      Each task should include:
      - "task" (string)
      - "assigned_to" (subagent name or "me")

      Optional fields:
      - "status"
      - "dependencies"
      - "parent_id"

      ### Example
      filename:
      "research/agent-architecture"

      Creates:
      "/BASE_DIR/research/agent-architecture.todos.json"

      ### Recommended Usage
      Use this tool when:
      - Starting a new workflow
      - Initializing execution plans
      - Rebuilding workflow state
      - Synchronizing manager-generated task structures
      - Preparing task delegation pipelines
      `,

    schema: z.object({
      filename: z.string().describe(`
          Name of the TODO workflow file.

          You may provide either:
          - A simple filename
          - Or a nested folder path together with the filename

          Examples:
          - "research-todo"
          - "projects/ai-agent/research"
          - "tasks/frontend/ui-workflow"

          If folders are included, they will automatically be created
          if they do not already exist.

          The tool automatically appends the ".todos.json" extension,
          so do NOT include the extension manually.

          Generated examples:
          - "research-todo"
            -> "/BASE_DIR/research-todo.todos.json"

          - "projects/ai-agent/research"
            -> "/BASE_DIR/projects/ai-agent/research.todos.json"
          `),

      todos: z.array(InputTaskSchema),
    }),
  },
);

export const read_todos = tool(
  async ({ filename }) => {
    try {
      const filePath = path.join(BASE_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return "No TODO list found";
      }

      const raw = await fs.promises.readFile(filePath, "utf8");
      const todos = JSON.parse(raw);

      return `<think>${JSON.stringify(todos, null, 2)}</think>`;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return `❌ Error reading TODO list: ${error.message}`;
      } else {
        return `❌ Error reading TODO list`;
      }
    }
  },
  {
    name: "read_todos",
    description: "Read a workflow TODO list.",
    schema: z.object({
      filename: z.string().describe("filename containing todolist"),
    }),
  },
);

export const update_todos = tool(
  async ({ filename, updates }, toolConfig: any) => {
    try {
      const filePath = path.join(BASE_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return "No TODO list found";
      }

      const raw = await fs.promises.readFile(filePath, "utf8");

      let todos = JSON.parse(raw);

      const now = new Date().toISOString();

      const updatedIds: string[] = [];

      updates.forEach((u) => {
        const index = todos.findIndex((t: any) => t.id === u.id);

        if (index === -1) {
          return;
        }

        updatedIds.push(u.id);

        todos[index] = {
          ...todos[index],

          // mutable fields only
          task: u.task ?? todos[index].task,
          assigned_to: u.assigned_to ?? todos[index].assigned_to,
          status: u.status ?? todos[index].status,

          updated_at: now,
        };
      });

      await fs.promises.writeFile(
        filePath,
        JSON.stringify(todos, null, 2),
        "utf8",
      );

      toolConfig.writer?.({
        update_todos: "update_todos",
        updates,
      });

      return `<think>${JSON.stringify(
        {
          success: true,
          updated: updatedIds.length,
          updated_ids: updatedIds,
        },
        null,
        2,
      )}</think>`;
    } catch (error: unknown) {
      return `❌ Error updating TODO list: ${error instanceof Error ? error.message : ""}`;
    }
  },
  {
    name: "update_todos",

    description: `
Updates tasks in a workflow TODO list using their unique UUIDs.

This tool is used when you want to:
- Change task status
- Reassign tasks to another agent
- Modify task descriptions
- Synchronize workflow execution state

### Important Rules
1. Tasks are updated strictly by UUID "id"
2. Only provided fields are modified
3. Non-provided fields remain unchanged
4. "updated_at" is refreshed automatically
5. Immutable fields cannot be modified:
   - "id"
   - "created_at"
   - "dependencies"
   - "parent_id"

### Supported Mutable Fields
- "task"
- "assigned_to"
- "status"

### Few-Shot Examples

Example: Mark task as completed

\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json",
  "updates": [
    {
      "id": "60b9a4ca-1960-401e-b107-40e2fe1e35ad",
      "status": "completed"
    }
  ]
}
\`\`\`

Example: Reassign task

\`\`\`json
{
  "filename": "rag-blog-workflow-002.todos.json",
  "updates": [
    {
      "id": "bbe944de-5ca5-47ea-bc55-79bbff9a3217",
      "assigned_to": "senior_planner",
      "status": "in_progress"
    }
  ]
}
\`\`\`

Example: Update multiple tasks at once

\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json",
  "updates": [
    {
      "id": "8f2d3c91-7b54-4a9e-9f8a-1d72c6b5e413",
      "status": "in_progress"
    },
    {
     "id": "c4e91b7f-2d88-47c1-b6ae-93f0d1a8e5bc",
     "assigned_to": "blog writer",
     "status": "pending"
    },
  ]
}
\`\`\`

### Usage Notes for Agents
- Always fetch latest TODOs before updating to avoid overwriting changes.
- Only pass IDs returned by the "write_todos" or previously saved TODOs.
- Never hallucinate UUIDs.
- Always include "workflow_id" to specify which workflow to update.


### Return Value
Returns:
- Success confirmation message
- Number of tasks updated
- Array of successfully updated task UUIDs

Example success response:

\`\`\`json
{
  "success": true,
  "updated": 2,
  "updated_ids": [
    "def42a16-d188-4357-96a8-39d55fc8752b",
    "bf28b7b6-ba93-4ca9-a311-f461182606bc"
  ]
}
\`\`\`
Possible failure responses:

TODO file not found
Invalid UUID references
Invalid JSON structure
Filesystem write/read failure
`,
    schema: z.object({
      filename: z
        .string()
        .describe("Workflow TODO filename including .todos.json"),

      updates: z.array(
        z.object({
          id: z.uuid(),

          task: z.string().optional(),

          assigned_to: z.string().optional(),

          status: z
            .enum(["pending", "in_progress", "completed", "blocked"])
            .optional(),
        }),
      ),
    }),
  },
);

export const get_next_runnable_tasks = tool(
  async ({ filename }) => {
    const filePath = path.join(BASE_DIR, filename);

    if (!fs.existsSync(filePath)) return "No todolist found.";

    const raw = await fs.promises.readFile(filePath, "utf8");
    const todos = JSON.parse(raw);

    // Build a map from task temp keys to IDs if needed
    const keyToIdMap: any = {};
    todos.forEach((t: any) => {
      if (t.key) keyToIdMap[t.key] = t.id;
    });

    // Resolve dependencies (temp keys → UUIDs)
    const runnable = todos.filter((t: any) => {
      if (t.status !== "pending") return false;

      const deps = t.dependencies || [];

      return deps.every((dep: any) => {
        // If dep is a temp key, map it to real ID
        const depId = keyToIdMap[dep] || dep;

        const parent = todos.find((x: any) => x.id === depId);

        return parent ? parent.status === "completed" : true; // if dep not found, ignore
      });
    });

    return `<think>${JSON.stringify(runnable, null, 2)}</think>`;
  },
  {
    name: "get_next_runnable_tasks",

    description: `
Scans a workflow's task list and computes the next set of executable tasks based on dependency resolution.

The workflow is treated as a **Directed Acyclic Graph (DAG)**, where:
- Each task is a **node**.
- Dependencies represent **directed edges**.
- Execution must respect **topological order**: tasks can only run when all dependencies are completed.

---

### Runnable Task Criteria

A task is considered **runnable** if:
1. \`status === "pending"\`
2. AND either:
   - It has **no dependencies**, or
   - **All dependencies** (by ID or temp key) reference tasks with \`status === "completed"\`

This evaluation is **read-only** and does **not mutate workflow state**.

---

### Why This Tool Exists

- Prevents executing tasks **out of order**, which could cause errors or inconsistent results.
- Ensures **execution safety** for multi-step workflows.
- Enables structured reasoning and **autonomous agent loops**.

---

### Features

- Returns **multiple runnable tasks** for parallel execution.
- Supports **hierarchical workflows** via \`parent_id\`.
- Integrates with **multi-agent systems** via \`skill_required\`.
- Safe for **autonomous loop execution**.

---

### Recommended Agent Execution Loop

\`\`\`python
while True:
    runnable = get_next_runnable_tasks(filename="my_workflow.todos.json")

    if not runnable:
        break

    for task in runnable:
        route_to_skill(task.skill_required)

        execute(task)

        update_todos(workflow_id, updates=[{
            "id": task.id,
            "status": "completed"
        }])
\`\`\`

---

### Few-Shot Usage Examples

**Example 1: Simple runnable task**

\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`

Returns:

\`\`\`json
[
  {
    "id": "def42a16-d188-4357-96a8-39d55fc8752b",
    "task": "Generate TypeScript code examples using LangChain",
    "status": "pending",
    "dependencies": ["60b9a4ca-1960-401e-b107-40e2fe1e35ad"],
    "assigned_to": "typescript_expert"
  }
]
\`\`\`

---

**Example 2: Multiple runnable tasks in parallel**

\`\`\`json
{
  "filename": "data_pipeline-workflow.todos.json"
}
\`\`\`

Returns:

\`\`\`json
[
  {
    "id": "task-101",
    "task": "Download dataset",
    "status": "pending",
    "dependencies": [],
    "assigned_to": "downloader"
  },
  {
    "id": "task-102",
    "task": "Validate schema",
    "status": "pending",
    "dependencies": [],
    "assigned_to": "validator"
  }
]
\`\`\`

---

**Example 3: Dependency-resolved task**

\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`

Returns:

\`\`\`json
[
  {
    "id": "bf28b7b6-ba93-4ca9-a311-f461182606bc",
    "task": "Write SEO-optimized blog draft",
    "status": "pending",
    "dependencies": [
      "bbe944de-5ca5-47ea-bc55-79bbff9a3217",
      "def42a16-d188-4357-96a8-39d55fc8752b"
    ],
    "assigned_to": "blog_writer"
  }
]
\`\`\`

---

### Notes for LLMs / Agents

- **Always use UUIDs** or maintain a mapping from human-readable keys to IDs.
- Do **not hallucinate IDs** — tasks with unknown dependencies will be skipped.
- Use this tool **before routing tasks** to subagents or skills.
- Supports **parallel execution**: multiple tasks may be returned if dependencies allow.

---

### Return Value

Returns an array of runnable task objects that are safe to execute at this moment.

Example:

\`\`\`json
[
  {
    "id": "60b9a4ca-1960-401e-b107-40e2fe1e35ad",
    "task": "Research LangChain RAG architecture",
    "status": "pending",
    "dependencies": [],
    "assigned_to": "research_agent",
    "created_at": "2026-06-02T18:20:00.000Z",
    "updated_at": "2026-06-02T18:20:00.000Z"
  }
]
\`\`\`
`,

    schema: z.object({
      filename: z.string().describe("filename containing todolist"),
    }),
  },
);

export const todoListTools = [
  read_todos,
  update_todos,
  write_todos,
  get_next_runnable_tasks,
];
