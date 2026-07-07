import { tool } from "@langchain/core/tools";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { list } from "@/lib/workflow-tools/registry";
import "@/lib/workflow-tools/index";
import { interrupt } from "@langchain/langgraph";
export interface ImplementationPlan {
  projectId: string;
  userId: string;
  status: "draft" | "approved" | "rejected";
  goal: string;
  outputFormat: string;
  agentStructure: string;
  preferredModel?: string;
  requiredTools: string[];
  agents: Array<{
    name: string;
    role: string;
    model: string;
    tools: string[];
    instructions: string;
  }>;
  summary: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export const listRegisteredToolsTool = tool(
  async () => {
    const registrations = list();
    return JSON.stringify(
      registrations.map((r) => ({
        id: r.nodeRegistry,
        label: r.label,
        description: r.description,
        category: r.category,
        featured: r.featured,
        credentials: r.credentialRequirement
          ? `${r.credentialRequirement.providers.join(", ")} (${r.credentialRequirement.authMethods.join(", ")})`
          : "none",
      })),
      null,
      2,
    );
  },
  {
    name: "list_registered_tools",
    description: "List all available workflow tools that can be assigned to agents. Call this FIRST to understand what tools exist before asking the user any questions or creating a plan.",
    schema: z.object({}),
  },
);

export const askMCQTool = tool(
  async ({ questions }: {
    questions: Array<{ section: string; question: string; options: string[] }>;
  }) => {
    const resumeValue = await interrupt(JSON.stringify({ type: "mcq_batch", questions }));
    const parsed = typeof resumeValue === "string" ? JSON.parse(resumeValue) : resumeValue;
    return JSON.stringify({ type: "mcq_answers", answers: parsed });
  },
  {
    name: "ask_mcq",
    description: "Ask multiple-choice questions to gather requirements. Emits all MCQ cards, then pauses execution with a single interrupt. Call ONCE with ALL questions. The user submits all answers at once.",
    schema: z.object({
      questions: z.array(z.object({
        section: z.string().describe("Category label (e.g., 'Goal & Output', 'Tools & Models')"),
        question: z.string().describe("The question text"),
        options: z.array(z.string()).min(2).describe("Array of 3-5 options. Last option must be 'Type your own answer'"),
      })).min(1).describe("Array of 1-4 multiple-choice questions to ask in a single batch"),
    }),
  },
);

export const createPlanDocTool = tool(
  async ({ goal, outputFormat, agentStructure, preferredModel, requiredTools, agents, summary, instructions }: {
    goal: string;
    outputFormat: string;
    agentStructure: string;
    preferredModel?: string;
    requiredTools: string[];
    agents: Array<{
      name: string;
      role: string;
      model: string;
      tools: string[];
      instructions: string;
    }>;
    summary: string;
    instructions: string;
  }, config) => {
    const { userId, projectId } = config?.configurable || {};
    const plan: ImplementationPlan = {
      projectId: projectId || "",
      userId: userId || "",
      status: "draft",
      goal,
      outputFormat,
      agentStructure,
      preferredModel,
      requiredTools,
      agents,
      summary,
      instructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const planDir = path.resolve(process.cwd(), "public", "agent-builder", "working-agent-folder");
    await fs.mkdir(planDir, { recursive: true });
    const filePath = path.join(planDir, `plan-${projectId}.json`);
    await fs.writeFile(filePath, JSON.stringify(plan, null, 2), "utf-8");
    return JSON.stringify({ type: "plan_created", plan, filePath });
  },
  {
    name: "create_plan_doc",
    description: "Create an ImplementationPlan from gathered requirements and save it to disk. Call this after the user answers all MCQs. Do NOT call write_plan_file — this tool saves the file automatically.",
    schema: z.object({
      goal: z.string().describe("The user's high-level goal"),
      outputFormat: z.string().describe("Desired output format (e.g., markdown, json, interactive)"),
      agentStructure: z.string().describe("Agent structure type (single, orchestrator-workers, pipeline, custom)"),
      preferredModel: z.string().optional().describe("User's preferred LLM model"),
      requiredTools: z.array(z.string()).describe("Tools the agent system needs"),
      agents: z.array(z.object({
        name: z.string(),
        role: z.string(),
        model: z.string(),
        tools: z.array(z.string()),
        instructions: z.string(),
      })).describe("Array of agent definitions"),
      summary: z.string().describe("Human-readable summary for the user"),
      instructions: z.string().describe("Detailed execution instructions for AgentBuilder"),
    }),
  },
);

export const presentPlanTool = tool(
  async (args: { summary: string; agents: Array<{ name: string; role: string; model: string; tools: string[] }> }) => {
    const resumeValue = await interrupt(JSON.stringify({
      type: "plan_approval",
      summary: args.summary,
      agents: args.agents,
    }));

    if (resumeValue?.type === "approve") {
      return "PLAN_PRESENTED_FOR_APPROVAL";
    }
    if (resumeValue?.type === "edit") {
      return `Current plan:\n${JSON.stringify(args, null, 2)}\n\nUser's suggestion: ${resumeValue.message}\n\nBased on the user's suggestion, refine the plan accordingly. Update the plan file using create_plan_doc with the revised details, then call present_plan_for_approval again with the updated plan.\n\nAfter presenting the plan:\n- If the user approves: call transferToBuilder with the plan filename and a brief summary.\n- If the user requests edits again: this tool will fire again — read the new suggestion and repeat the revision process.\n- If the user rejects: inform the user.`;
    }
    throw new Error("Plan rejected");
  },
  {
    name: "present_plan_for_approval",
    description: `Present the implementation plan to the user for approval. Execution pauses until the user responds. After approval, call transferToBuilder. On edit suggestions, revise the plan using create_plan_doc and re-present. On reject, inform the user. Call this AFTER create_plan_doc.`,
    schema: z.object({
      summary: z.string().describe("Human-readable plan summary to display to the user"),
      agents: z.array(z.object({
        name: z.string(),
        role: z.string(),
        model: z.string(),
        tools: z.array(z.string()),
      })).describe("Agent definitions to show in the approval card"),
    }),
  },
);

export const readPlanFileTool = tool(
  async (_: {}, config) => {
    const { projectId } = config?.configurable || {};
    if (!projectId) return "Error: projectId is required";

    const filePath = path.resolve(process.cwd(), "public", "agent-builder", "working-agent-folder", `plan-${projectId}.json`);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch {
      return "No plan file found";
    }
  },
  {
    name: "read_plan_file",
    description: "Read the current implementation plan from disk.",
    schema: z.object({}),
  },
);

export const editPlanTool = tool(
  async ({ plan, suggestion }: { plan: string; suggestion: string }) => {
    console.log("[edit_plan] Tool called. suggestion:", suggestion.substring(0, 200));
    console.log("[edit_plan] plan length:", plan.length);
    return `Current plan:\n${plan}\n\nUser's suggestion: ${suggestion}\n\nBased on the user's suggestion above, refine the plan accordingly. Update the plan file using create_plan_doc with the revised details, then call present_plan_for_approval again with the updated plan.

After presenting the plan:
- If the user approves: call transferToBuilder with the plan filename and a brief summary.
- If the user requests edits again: this tool will fire again — read the new suggestion and repeat the revision process.
- If the user rejects: inform the user.`;
  },
  {
    name: "edit_plan",
    description: "Receive user edit suggestions for the current plan. Returns the current plan and the user's edit suggestions so you can revise and re-present the plan.",
    schema: z.object({
      plan: z.string().describe("The full current plan as JSON"),
      suggestion: z.string().describe("The user's edit suggestions"),
    }),
  },
);

export const updatePlanStatusTool = tool(
  async ({ status }: { status: "draft" | "approved" | "rejected" }, config) => {
    const { projectId } = config?.configurable || {};
    if (!projectId) return "Error: projectId is required";

    const filePath = path.resolve(process.cwd(), "public", "agent-builder", "working-agent-folder", `plan-${projectId}.json`);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const plan: ImplementationPlan = JSON.parse(content);
      plan.status = status;
      plan.updatedAt = new Date().toISOString();
      await fs.writeFile(filePath, JSON.stringify(plan, null, 2), "utf-8");
      return `Plan status updated to ${status}`;
    } catch {
      return "No plan file found to update";
    }
  },
  {
    name: "update_plan_status",
    description: "Update the status of the implementation plan (draft → approved or rejected). Call this when the user approves or rejects the plan.",
    schema: z.object({
      status: z.enum(["draft", "approved", "rejected"]).describe("New plan status"),
    }),
  },
);
