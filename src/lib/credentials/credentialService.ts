import mongoose from "mongoose";
import { Credential } from "@/models/CredentialSchema";
import {
  kmsGenerateDEK,
  kmsDecrypt,
  aesEncrypt,
  aesDecrypt,
} from "./encryption";
import { NotFoundError, ForbiddenError, ConflictError } from "@/lib/errors/http-errors";
import type {
  CredentialProvider,
  AuthMethod,
  CredentialMetadata,
  CredentialPayload,
} from "./types";

function toMetadata(doc: any): CredentialMetadata {
  return {
    _id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    provider: doc.provider as CredentialProvider,
    authMethod: doc.authMethod as AuthMethod,
    providerAccountId: doc.providerAccountId,
    name: doc.name,
    status: doc.status,
    schemaVersion: doc.schemaVersion,
    revision: doc.revision,
    lastUsedAt: doc.lastUsedAt?.toISOString(),
    lastValidationAt: doc.lastValidationAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function canAccess(credential: any, actorId: string): boolean {
  return credential.ownerId.toString() === actorId;
}

type SaveInput = {
  ownerId: string;
  provider: CredentialProvider;
  authMethod: AuthMethod;
  name: string;
  providerAccountId?: string;
  payload: CredentialPayload;
};

export async function saveCredential(input: SaveInput): Promise<CredentialMetadata> {
  const plaintext = JSON.stringify(input.payload);

  const { plaintextKey, encryptedKey } = await kmsGenerateDEK();
  const { ciphertext, iv, authTag } = aesEncrypt(plaintext, plaintextKey);

  const doc = await Credential.create({
    ownerId: new mongoose.Types.ObjectId(input.ownerId),
    provider: input.provider,
    authMethod: input.authMethod,
    name: input.name,
    providerAccountId: input.providerAccountId,
    encryptedDEK: encryptedKey,
    ciphertext,
    iv,
    authTag,
    status: "active",
  });

  console.info("credential.created", { credentialId: doc._id.toString(), provider: input.provider });
  return toMetadata(doc);
}

type DecryptByIdInput = {
  credentialId: string;
  actorId: string;
};

export async function decryptById(
  input: DecryptByIdInput,
): Promise<CredentialPayload> {
  const doc = await Credential.findById(input.credentialId);
  if (!doc || doc.deletedAt) {
    throw new NotFoundError("Credential not found");
  }
  if (!canAccess(doc, input.actorId)) {
    throw new ForbiddenError();
  }

  const plaintextKey = await kmsDecrypt(doc.encryptedDEK);
  const plaintext = aesDecrypt(doc.ciphertext, plaintextKey, doc.iv, doc.authTag);

  return JSON.parse(plaintext);
}

type DecryptManyInput = {
  credentialIds: string[];
  actorId: string;
};

export async function decryptMany(
  input: DecryptManyInput,
): Promise<Map<string, CredentialPayload>> {
  const cache = new Map<string, CredentialPayload>();
  const uniqueIds = [...new Set(input.credentialIds)];
  for (const id of uniqueIds) {
    const payload = await decryptById({ credentialId: id, actorId: input.actorId });
    cache.set(id, payload);
    console.info("credential.used", { credentialId: id });
  }
  return cache;
}

type ListInput = {
  ownerId: string;
  provider?: string;
  authMethod?: string;
};

export async function listCredentials(
  input: ListInput,
): Promise<CredentialMetadata[]> {
  const filter: any = { ownerId: new mongoose.Types.ObjectId(input.ownerId), deletedAt: null };
  if (input.provider) filter.provider = input.provider;
  if (input.authMethod) filter.authMethod = input.authMethod;

  const docs = await Credential.find(filter).sort({ updatedAt: -1 });
  return docs.map(toMetadata);
}

type UpdateInput = {
  credentialId: string;
  actorId: string;
  revision: number;
  name?: string;
  providerAccountId?: string;
  payload?: CredentialPayload;
};

export async function updateCredential(
  input: UpdateInput,
): Promise<CredentialMetadata> {
  const doc = await Credential.findById(input.credentialId);
  if (!doc || doc.deletedAt) {
    throw new NotFoundError("Credential not found");
  }
  if (!canAccess(doc, input.actorId)) {
    throw new ForbiddenError();
  }
  if (doc.revision !== input.revision) {
    throw new ConflictError("Credential was modified by another session. Refresh and try again.");
  }

  if (input.name) doc.name = input.name;
  if (input.providerAccountId !== undefined) doc.providerAccountId = input.providerAccountId;

  if (input.payload) {
    const plaintext = JSON.stringify(input.payload);
    const { plaintextKey, encryptedKey } = await kmsGenerateDEK();
    const { ciphertext, iv, authTag } = aesEncrypt(plaintext, plaintextKey);
    doc.encryptedDEK = encryptedKey;
    doc.ciphertext = ciphertext;
    doc.iv = iv;
    doc.authTag = authTag;
  }

  doc.revision += 1;
  await doc.save();

  console.info("credential.updated", { credentialId: input.credentialId });
  return toMetadata(doc);
}

type SoftDeleteInput = {
  credentialId: string;
  actorId: string;
};

export async function softDeleteCredential(
  input: SoftDeleteInput,
): Promise<void> {
  const doc = await Credential.findById(input.credentialId);
  if (!doc || doc.deletedAt) {
    throw new NotFoundError("Credential not found");
  }
  if (!canAccess(doc, input.actorId)) {
    throw new ForbiddenError();
  }
  doc.deletedAt = new Date();
  await doc.save();

  console.info("credential.deleted", { credentialId: input.credentialId });
}

type MarkUsedInput = {
  credentialIds: string[];
};

export async function markCredentialsUsed(input: MarkUsedInput): Promise<void> {
  if (input.credentialIds.length === 0) return;
  await Credential.updateMany(
    { _id: { $in: input.credentialIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { $set: { lastUsedAt: new Date() } },
  );
}
