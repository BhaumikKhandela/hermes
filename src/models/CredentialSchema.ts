import mongoose, { model, models, Schema } from "mongoose";
import { CredentialProviders, AuthMethods, type CredentialProvider, type AuthMethod } from "@/lib/credentials/types";

const credentialSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: CredentialProviders,
    },
    authMethod: {
      type: String,
      required: true,
      enum: AuthMethods,
    },
    providerAccountId: { type: String, required: false },
    name: { type: String, required: true },
    ciphertext: { type: Buffer, required: true },
    iv: { type: Buffer, required: true },
    authTag: { type: Buffer, required: true },
    schemaVersion: { type: Number, default: 1 },
    revision: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["active", "invalid", "expired"],
      default: "active",
    },
    lastUsedAt: { type: Date, required: false },
    lastValidationAt: { type: Date, required: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

credentialSchema.index({ ownerId: 1, provider: 1 });
credentialSchema.index({ deletedAt: 1 });

export const Credential = models.credential || model("credential", credentialSchema);
