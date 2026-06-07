import mongoose, { model, models, Schema } from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agent_nodes: { type: [Schema.Types.Mixed], required: true },
    agent_edges: { type: [Schema.Types.Mixed], required: true },
    fileUpload: { type: Boolean, required: false, default: false },
    agentTree: { type: Schema.Types.Mixed, default: null, required: false },
  },
  { timestamps: true },
);

export const Agent = models.agents || model("agents", agentSchema);
