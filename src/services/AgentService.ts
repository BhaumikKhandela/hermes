import { Agent } from "@/models/AgentSchema";
import mongoose from "mongoose";

export class agentService {
  private static instance: agentService;

  public static getInstance(): agentService {
    if (!agentService.instance) {
      agentService.instance = new agentService();
    }
    return agentService.instance;
  }

  async fetchAgentInstructions(projectId: string, userId: string) {
    if (!projectId || !userId) {
      throw new Error("projectId and userId are required");
    }

    const row = await Agent.findOne({
      projectId,
      userId,
    }).populate("agentInstruction");

    return row; // may return null if not found
  }

  async updateOrCreateAgent(props: {
    agentTree?: string;
    projectId: string;
    userId: string;
    agent_nodes: any[];
    agent_edges: any[];
    agentInstruction: any;
  }) {
    const {
      agentTree,
      projectId,
      userId,
      agent_nodes,
      agent_edges,
      agentInstruction,
    } = props;

    if (!projectId || !userId) {
      throw new Error("projectId and userId are required.");
    }

    const toObjectIdIfNeeded = (id: any) => {
      if (id instanceof mongoose.Types.ObjectId) return id;
      if (mongoose.isValidObjectId(id)) return new mongoose.Types.ObjectId(id);
      return id;
    };

    const filter = {
      projectId: toObjectIdIfNeeded(projectId),
      userId: toObjectIdIfNeeded(userId),
    };

    const updateFields = {
      agent_edges,
      agent_nodes,
      agentTree,
      agentInstruction,
    };

    const update = { $set: updateFields };

    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
      context: "query",
    };

    const row = await Agent.findOneAndUpdate(filter, update, options);

    return row;
  }

  async getrowByProjectAndUser(projectId: string, userId: string) {
    if (!projectId || !userId) {
      throw new Error("projectId and userId are required");
    }

    const row = await Agent.findOne({
      projectId,
      userId,
    }).populate("projectId", "name");

    return row; // may return null if not found
  }

  async fetchJsonAgentTree(props: { projectId: string }) {
    const { projectId } = props;
    if (!projectId) {
      throw new Error("projectId is required.");
    }

    const row = await Agent.findOne({ projectId }).select(
      "agentTree agent_nodes -_id",
    );

    return row;
  }

  async enableFileUpload(props: { projectId: string; userId: string }) {
    const { projectId, userId } = props;
    if (!projectId || !userId) {
      throw new Error("projectId and userId are required.");
    }

    const row = await Agent.findOneAndUpdate(
      { projectId, userId },
      { $set: { fileUpload: true } },
      { new: true },
    );

    return row;
  }
}
