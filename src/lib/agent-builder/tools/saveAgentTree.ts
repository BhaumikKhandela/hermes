import { tool } from "@langchain/core/tools";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { autoConnect } from "@/helper/autoConnect";
import { buildNodesHelper } from "@/helper/buildNodeHelper";
import { agentService } from "@/services/AgentService";

const ROOT = process.cwd();
const TREE_DIR = path.join(
  ROOT,
  "public",
  "agent-builder",
  "working-agent-folder",
);

if (!fs.existsSync(TREE_DIR)) {
  fs.mkdirSync(TREE_DIR, { recursive: true });
}

export const saveAgentTreeTool = tool(
  async ({ filename }, config) => {
    try {
      const projectId = config.configurable?.projectId;
      const userId = config.configurable?.userid;

      const FILE_NAME = path.join(TREE_DIR, filename);

      if (!fs.existsSync(FILE_NAME)) {
        return "[]";
      }

      const data = fs.readFileSync(FILE_NAME, "utf-8");
      const agentTree = JSON.parse(data);

      const agent = agentService.getInstance();

      const { nodes } = buildNodesHelper(agentTree, 1);

      const agent_edges = autoConnect(nodes);

      await agent.updateOrCreateAgent({
        projectId,
        userId,
        agent_edges,
        agent_nodes: nodes,
        agentTree,
      });

      return JSON.stringify({
        message: "agent Tree saved successfully",
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
