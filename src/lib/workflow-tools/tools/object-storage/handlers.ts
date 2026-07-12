import type { z } from "zod";
import type { partialObjectStorageSchema } from "./schema";
import type { ObjectStorageProvider, IfExistsPolicy, ObjectEncoding, ReturnEncoding, StorageToolResult } from "./types";

function requireField(value: string | undefined, action: string, label: string): string {
  if (!value) throw new Error(`ObjectStorage ${action}: ${label} is required`);
  return value;
}

function encodeBody(body: string, encoding: ObjectEncoding): Buffer {
  switch (encoding) {
    case "utf-8":
      return Buffer.from(body, "utf-8");
    case "base64":
      return Buffer.from(body, "base64");
    case "json":
      try { JSON.parse(body); } catch {
        throw new Error(`ObjectStorage: body is not valid JSON`);
      }
      return Buffer.from(body, "utf-8");
  }
}

function decodeBuffer(buffer: Buffer, returnEncoding: ReturnEncoding): { body: string; isBase64: boolean; encoding: string } {
  switch (returnEncoding) {
    case "utf-8":
      return { body: buffer.toString("utf-8"), encoding: "utf-8", isBase64: false };
    case "base64":
      return { body: buffer.toString("base64"), encoding: "base64", isBase64: true };
    case "json":
      return { body: buffer.toString("utf-8"), encoding: "json", isBase64: false };
    case "raw":
      return { body: buffer.toString("base64"), encoding: "base64", isBase64: true };
  }
}

function parseMetadata(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw new Error("ObjectStorage: metadata must be a valid JSON object");
  }
}

function checkCapability(
  provider: ObjectStorageProvider,
  capability: keyof typeof provider.capabilities,
  action: string,
): void {
  if (!provider.capabilities[capability]) {
    throw new Error(`ObjectStorage ${action}: Provider does not support this operation`);
  }
}

async function checkIfExists(
  provider: ObjectStorageProvider,
  policy: IfExistsPolicy,
  bucket: string,
  key: string,
  action: string,
): Promise<{ shouldProceed: boolean }> {
  if (policy === "overwrite") return { shouldProceed: true };
  const exists = await provider.objectExists(bucket, key);
  if (exists && policy === "error") {
    throw new Error(`ObjectStorage ${action}: Object already exists ${bucket}/${key}`);
  }
  return { shouldProceed: !exists };
}

async function checkIfDestinationExists(
  provider: ObjectStorageProvider,
  policy: IfExistsPolicy,
  bucket: string,
  key: string,
  action: string,
): Promise<{ shouldProceed: boolean }> {
  if (policy === "overwrite") return { shouldProceed: true };
  const exists = await provider.objectExists(bucket, key);
  if (exists && policy === "error") {
    throw new Error(`ObjectStorage ${action}: Destination already exists ${bucket}/${key}`);
  }
  return { shouldProceed: !exists };
}

type Input = z.input<typeof partialObjectStorageSchema>;

export async function handlePutObject(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "putObject", "put_object");
  const bucket = requireField(input.bucket ?? config?.bucket, "put_object", "Bucket");
  const key = requireField(input.key ?? config?.key, "put_object", "Object Key");
  const body = requireField(input.body ?? config?.body, "put_object", "Body");
  const encoding = (input.encoding ?? config?.encoding ?? "utf-8") as ObjectEncoding;
  const ifExists = (input.ifExists ?? config?.ifExists ?? "overwrite") as IfExistsPolicy;

  const { shouldProceed } = await checkIfExists(provider, ifExists, bucket, key, "put_object");
  if (!shouldProceed) {
    return { action: "put_object", data: { bucket, key, skipped: true, policy: "skip" } };
  }

  const buffer = encodeBody(body, encoding);
  const options: any = {};
  if (input.contentType ?? config?.contentType) options.contentType = input.contentType ?? config?.contentType;
  if (input.cacheControl ?? config?.cacheControl) options.cacheControl = input.cacheControl ?? config?.cacheControl;
  if (input.contentDisposition ?? config?.contentDisposition) options.contentDisposition = input.contentDisposition ?? config?.contentDisposition;
  if (input.contentEncoding ?? config?.contentEncoding) options.contentEncoding = input.contentEncoding ?? config?.contentEncoding;
  if ((input.metadata ?? config?.metadata)) options.metadata = parseMetadata(input.metadata ?? config?.metadata);

  const result = await provider.putObject(bucket, key, buffer, options);
  return { action: "put_object", data: { bucket, key, ...result } };
}

export async function handleReadObject(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "getObject", "read_object");
  const bucket = requireField(input.bucket ?? config?.bucket, "read_object", "Bucket");
  const key = requireField(input.key ?? config?.key, "read_object", "Object Key");
  const returnEncoding = (input.returnEncoding ?? config?.returnEncoding ?? "utf-8") as ReturnEncoding;

  const buffer = await provider.getObject(bucket, key);
  const { body, encoding, isBase64 } = decodeBuffer(buffer, returnEncoding);

  return {
    action: "read_object",
    data: { bucket, key, body, encoding, isBase64 },
  };
}

export async function handleDeleteObject(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "deleteObject", "delete_object");
  const bucket = requireField(input.bucket ?? config?.bucket, "delete_object", "Bucket");
  const key = requireField(input.key ?? config?.key, "delete_object", "Object Key");

  await provider.deleteObject(bucket, key);
  return { action: "delete_object", data: { bucket, key, deleted: true } };
}

export async function handleCopyObject(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "copyObject", "copy_object");
  const bucket = requireField(input.bucket ?? config?.bucket, "copy_object", "Source Bucket");
  const key = requireField(input.key ?? config?.key, "copy_object", "Source Key");
  const destinationBucket = requireField(input.destinationBucket ?? config?.destinationBucket, "copy_object", "Destination Bucket");
  const destinationKey = requireField(input.destinationKey ?? config?.destinationKey, "copy_object", "Destination Key");
  const ifExists = (input.ifExists ?? config?.ifExists ?? "overwrite") as IfExistsPolicy;

  const { shouldProceed } = await checkIfDestinationExists(provider, ifExists, destinationBucket, destinationKey, "copy_object");
  if (!shouldProceed) {
    return { action: "copy_object", data: { source: { bucket, key }, destination: { bucket: destinationBucket, key: destinationKey }, skipped: true, policy: "skip" } };
  }

  await provider.copyObject(bucket, key, destinationBucket, destinationKey);
  return { action: "copy_object", data: { source: { bucket, key }, destination: { bucket: destinationBucket, key: destinationKey } } };
}

export async function handleMoveObject(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "moveObject", "move_object");
  const bucket = requireField(input.bucket ?? config?.bucket, "move_object", "Source Bucket");
  const key = requireField(input.key ?? config?.key, "move_object", "Source Key");
  const destinationBucket = requireField(input.destinationBucket ?? config?.destinationBucket, "move_object", "Destination Bucket");
  const destinationKey = requireField(input.destinationKey ?? config?.destinationKey, "move_object", "Destination Key");
  const ifExists = (input.ifExists ?? config?.ifExists ?? "overwrite") as IfExistsPolicy;

  const { shouldProceed } = await checkIfDestinationExists(provider, ifExists, destinationBucket, destinationKey, "move_object");
  if (!shouldProceed) {
    return { action: "move_object", data: { source: { bucket, key }, destination: { bucket: destinationBucket, key: destinationKey }, skipped: true, policy: "skip" } };
  }

  await provider.moveObject(bucket, key, destinationBucket, destinationKey);
  return { action: "move_object", data: { source: { bucket, key }, destination: { bucket: destinationBucket, key: destinationKey } } };
}

export async function handleListObjects(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "listObjects", "list_objects");
  const bucket = requireField(input.bucket ?? config?.bucket, "list_objects", "Bucket");

  const allObjects: any[] = [];
  let nextToken: string | undefined;
  let hasMore = true;

  const listOptions: any = {};
  if (input.prefix ?? config?.prefix) listOptions.prefix = input.prefix ?? config?.prefix;
  if ((input.recursive ?? config?.recursive) !== undefined) listOptions.recursive = input.recursive ?? config?.recursive;
  const maxItems = input.maxItems ?? config?.maxItems;
  if (maxItems !== undefined) listOptions.maxItems = maxItems;
  if (input.continuationToken) listOptions.continuationToken = input.continuationToken;

  if (input.returnAll ?? config?.returnAll) {
    const effectiveMax = maxItems ?? 10000;
    while (hasMore && allObjects.length < effectiveMax) {
      const remaining = effectiveMax - allObjects.length;
      const result = await provider.listObjects(bucket, {
        ...listOptions,
        maxItems: Math.min(remaining, 1000),
        continuationToken: nextToken ?? listOptions.continuationToken,
      });
      allObjects.push(...result.objects);
      nextToken = result.continuationToken;
      hasMore = result.hasMore;
      if (!nextToken) break;
    }
    return {
      action: "list_objects",
      data: { bucket, objects: allObjects, total: allObjects.length, truncated: hasMore },
    };
  }

  const result = await provider.listObjects(bucket, listOptions);
  return {
    action: "list_objects",
    data: { bucket, objects: result.objects, continuationToken: result.continuationToken, hasMore: result.hasMore, total: result.objects.length },
  };
}

export async function handleGetMetadata(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "getMetadata", "get_metadata");
  const bucket = requireField(input.bucket ?? config?.bucket, "get_metadata", "Bucket");
  const key = requireField(input.key ?? config?.key, "get_metadata", "Object Key");

  const metadata = await provider.getMetadata(bucket, key);
  return { action: "get_metadata", data: { bucket, key, ...metadata } };
}

export async function handleUpdateMetadata(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "updateMetadata", "update_metadata");
  const bucket = requireField(input.bucket ?? config?.bucket, "update_metadata", "Bucket");
  const key = requireField(input.key ?? config?.key, "update_metadata", "Object Key");
  const metadata = parseMetadata(input.metadata ?? config?.metadata);
  if (Object.keys(metadata).length === 0) {
    throw new Error("ObjectStorage update_metadata: metadata object must have at least one key");
  }

  await provider.updateMetadata(bucket, key, metadata);
  return { action: "update_metadata", data: { bucket, key, metadata } };
}

export async function handleGenerateUploadUrl(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "presignedUpload", "generate_upload_url");
  const bucket = requireField(input.bucket ?? config?.bucket, "generate_upload_url", "Bucket");
  const key = requireField(input.key ?? config?.key, "generate_upload_url", "Object Key");
  const expiresIn = input.expiresIn ?? config?.expiresIn ?? 3600;

  const url = await provider.generatePresignedUploadUrl(bucket, key, expiresIn);
  return { action: "generate_upload_url", data: { bucket, key, url, expiresIn } };
}

export async function handleGenerateDownloadUrl(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "presignedDownload", "generate_download_url");
  const bucket = requireField(input.bucket ?? config?.bucket, "generate_download_url", "Bucket");
  const key = requireField(input.key ?? config?.key, "generate_download_url", "Object Key");
  const expiresIn = input.expiresIn ?? config?.expiresIn ?? 3600;

  const url = await provider.generatePresignedDownloadUrl(bucket, key, expiresIn);
  return { action: "generate_download_url", data: { bucket, key, url, expiresIn } };
}

export async function handleCheckExists(
  input: Input,
  config: Record<string, any>,
  provider: ObjectStorageProvider,
): Promise<StorageToolResult> {
  checkCapability(provider, "objectExists", "check_exists");
  const bucket = requireField(input.bucket ?? config?.bucket, "check_exists", "Bucket");
  const key = requireField(input.key ?? config?.key, "check_exists", "Object Key");

  const exists = await provider.objectExists(bucket, key);
  return { action: "check_exists", data: { bucket, key, exists } };
}
