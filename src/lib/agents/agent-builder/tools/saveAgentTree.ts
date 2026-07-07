import { tool } from "@langchain/core/tools";
import { z } from "zod";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { autoConnect } from "@/helper/autoConnect";
import { buildNodesHelper } from "@/helper/buildNodeHelper";
import { agentService } from "@/services/AgentService";
import { extractAgentStructure } from "@/lib/workflow-parser/extractAgentStructure";
import { Project } from "@/models/ProjectSchema";
import "@/lib/workflow-tools/index";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "agent-builder");

function validatePositions(nodes: any[]): string | null {
  for (const node of nodes) {
    const pos = node.config?.position;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      const label = node.config?.label || node.node_name || "unknown";
      return `Missing or invalid "position" in node "${label}". Each node's config must include "position": { "x": <number>, "y": <number> }. Add a position and call save_agent_tree again.`;
    }
    if (node.children) {
      const childError = validatePositions(node.children);
      if (childError) return childError;
    }
  }
  return null;
}

function toNodeTree(input: any): any[] {
  if (Array.isArray(input)) {
    const hasValid = input.some(
      (n) =>
        n.node_name === "inputNode" ||
        n.node_name === "agent" ||
        n.node_name === "tool",
    );
    if (hasValid) return input;
  }

  const agents = input?.agents;
  if (Array.isArray(agents)) {
    return [
      {
        node_name: "inputNode",
        config: { label: "Input", name: "Input" },
        children: agents.map((agent: any) => ({
          node_name: "agent",
          config: {
            label: agent.name || "Agent",
            name: agent.name || "Agent",
            instructions: agent.instructions || "",
            model: agent.model || "",
          },
          children: (agent.tools || []).map((toolName: string) => ({
            node_name: "tool",
            config: { label: toolName, name: toolName },
          })),
        })),
      },
    ];
  }

  if (Array.isArray(input)) return input;
  return [];
}

export const saveAgentTreeTool = tool(
  async ({ filename }, config) => {
    try {
      const projectId = config.configurable?.projectId;
      const userId = config.configurable?.userId;

      let FILE_NAME = path.join(BASE_DIR, filename);

      if (!fs.existsSync(FILE_NAME)) {
        const fallback = path.join(BASE_DIR, "working-agent-folder", filename);
        if (fs.existsSync(fallback)) {
          FILE_NAME = fallback;
        } else {
          return "[]";
        }
      }

      const data = fs.readFileSync(FILE_NAME, "utf-8");
      const raw = JSON.parse(data);

      const treeInput = toNodeTree(raw);

      const posError = validatePositions(treeInput);
      if (posError) return posError;

      const agent = agentService.getInstance();

      const { nodes } = buildNodesHelper(treeInput, 1);

      const agent_edges = autoConnect(nodes);

      const agentInstruction = extractAgentStructure(treeInput);

      await agent.updateOrCreateAgent({
        projectId,
        userId,
        agent_edges,
        agent_nodes: nodes,
        agentTree: raw,
        agentInstruction,
      });

      const agentNames: string[] = [];
      for (const node of treeInput) {
        if (node.children) {
          for (const child of node.children) {
            if (child.node_name === "agent") {
              agentNames.push(child.config?.label || child.config?.name || "");
            }
          }
        }
      }
      const projectName =
        agentNames.length > 0
          ? `${agentNames.join(" & ")} Workflow`
          : "Agent Workflow";

      const toObjectIdIfNeeded = (id: any) => {
        if (id instanceof mongoose.Types.ObjectId) return id;
        if (mongoose.isValidObjectId(id)) return new mongoose.Types.ObjectId(id);
        return id;
      };

      await Project.findByIdAndUpdate(toObjectIdIfNeeded(projectId), {
        $set: { name: projectName },
      });

      const io = (globalThis as any).io;

      if (io) {
        io.emit("agentTree", { agentTree: raw });
      }

      return JSON.stringify({
        message: "agent Tree saved successfully",
        projectName,
      });
    } catch (error) {
      console.log(error);
      return JSON.stringify({
        message: "failed to save the agent_tree try again",
      });
    }
  },
  {
    name: "save_agent_tree",
    description: `
        Saves the complete JSON agent configuration to the database.
        Before saving, ensure the agent JSON is ready in the working-agent-folder.
        The filename should be descriptive (e.g. 'weather-agent.json').
        This tool validates the JSON structure before saving.`,
    schema: z.object({
      filename: z
        .string()
        .describe(
          "filename of the agent to save into the database eg: file-name.json",
        ),
    }),
  },
);
