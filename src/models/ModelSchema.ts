import mongoose, { model, models, Schema } from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    openRouterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, required: true },
    description: { type: String, default: "" },
    contextLength: { type: Number, default: 0 },
    pricing: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      inputCacheRead: { type: Number, default: 0 },
      webSearch: { type: Number, default: 0 },
    },
    modelType: { type: String, enum: ["chat", "embedding"], default: "chat" },
    supportsVision: { type: Boolean, default: false },
    supportsTools: { type: Boolean, default: false },
    supportsReasoning: { type: Boolean, default: false },
    supportedParameters: [{ type: String }],
    moderation: { type: Boolean, default: false },
    maxCompletionTokens: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

modelSchema.index({ openRouterId: 1 }, { unique: true });
modelSchema.index({ provider: 1 });
modelSchema.index({ isActive: 1, provider: 1 });

export const StoredModel = models.stored_model || model("stored_model", modelSchema);