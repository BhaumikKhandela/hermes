import mongoose, { model, models, Schema } from "mongoose";

const workflowRunSchema = new Schema(
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
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    input: { type: String },
    output: { type: String },
    error: { type: String },
    agentCount: { type: Number },
    toolCount: { type: Number },
    modelProvider: { type: String },
    modelName: { type: String },
    executionVersion: { type: Number, default: 1 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

workflowRunSchema.index({ projectId: 1, createdAt: -1 });

export const WorkflowRun =
  models.WorkflowRun || model("WorkflowRun", workflowRunSchema);
