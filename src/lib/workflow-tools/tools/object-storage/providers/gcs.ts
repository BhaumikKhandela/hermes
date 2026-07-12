import { Storage, Bucket, File } from "@google-cloud/storage";
import type { ObjectStorageProvider, ObjectMetadata, PutObjectOptions, PutObjectResult, ListOptions, ListResult } from "../types";

export interface GCSConfig {
  serviceAccountJson: string;
}

function mapGCSError(operation: string, err: any): never {
  const code = err?.code || "UNKNOWN";
  const message = err?.message || String(err);
  if (code === 404) {
    throw new Error(`ObjectStorage gcs ${operation}: Object not found — ${message}`);
  }
  if (code === 403) {
    throw new Error(`ObjectStorage gcs ${operation}: Access denied — ${message}`);
  }
  if (code === 409) {
    throw new Error(`ObjectStorage gcs ${operation}: Conflict — ${message}`);
  }
  throw new Error(`ObjectStorage gcs ${operation}: ${message}`);
}

function getBucket(storage: Storage, bucket: string): Bucket {
  return storage.bucket(bucket);
}

export function createGCSProvider(config: GCSConfig): ObjectStorageProvider {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(config.serviceAccountJson);
  } catch {
    throw new Error("ObjectStorage gcs: serviceAccountJson is not valid JSON");
  }

  const storage = new Storage({
    credentials: parsed,
  });

  return {
    capabilities: {
      putObject: true,
      getObject: true,
      deleteObject: true,
      copyObject: true,
      moveObject: true,
      listObjects: true,
      objectExists: true,
      getMetadata: true,
      updateMetadata: true,
      presignedUpload: true,
      presignedDownload: true,
    },

    async putObject(bucket: string, key: string, body: Buffer, options?: PutObjectOptions): Promise<PutObjectResult> {
      try {
        const file = getBucket(storage, bucket).file(key);
        const metadata: Record<string, any> = {};
        if (options?.contentType) metadata.contentType = options.contentType;
        if (options?.cacheControl) metadata.cacheControl = options.cacheControl;
        if (options?.contentDisposition) metadata.contentDisposition = options.contentDisposition;
        if (options?.contentEncoding) metadata.contentEncoding = options.contentEncoding;
        if (options?.metadata) metadata.metadata = options.metadata;
        await file.save(body, { metadata, resumable: false });
        const [meta] = await file.getMetadata();
        return { etag: meta.etag, versionId: meta.generation?.toString() };
      } catch (err) {
        mapGCSError("putObject", err);
      }
    },

    async getObject(bucket: string, key: string): Promise<Buffer> {
      try {
        const file = getBucket(storage, bucket).file(key);
        const [data] = await file.download();
        return data;
      } catch (err) {
        mapGCSError("getObject", err);
      }
    },

    async deleteObject(bucket: string, key: string): Promise<void> {
      try {
        const file = getBucket(storage, bucket).file(key);
        await file.delete();
      } catch (err) {
        mapGCSError("deleteObject", err);
      }
    },

    async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      try {
        const sourceFile = getBucket(storage, sourceBucket).file(sourceKey);
        const destFile = getBucket(storage, destBucket).file(destKey);
        await sourceFile.copy(destFile);
      } catch (err) {
        mapGCSError("copyObject", err);
      }
    },

    async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      try {
        const sourceFile = getBucket(storage, sourceBucket).file(sourceKey);
        const destFile = getBucket(storage, destBucket).file(destKey);
        await sourceFile.move(destFile);
      } catch (err) {
        mapGCSError("moveObject", err);
      }
    },

    async listObjects(bucket: string, options?: ListOptions): Promise<ListResult> {
      try {
        const [files, , apiResponse] = await getBucket(storage, bucket).getFiles({
          prefix: options?.prefix,
          delimiter: options?.recursive === false ? "/" : undefined,
          maxResults: options?.maxItems,
          pageToken: options?.continuationToken,
          autoPaginate: false,
        });
        return {
          objects: files.map((f) => ({
            key: f.name,
            size: Number(f.metadata.size) || 0,
            lastModified: f.metadata.updated || f.metadata.timeCreated || new Date().toISOString(),
            etag: f.metadata.etag,
          })),
          continuationToken: (apiResponse as any)?.nextPageToken as string | undefined,
          hasMore: !!(apiResponse as any)?.nextPageToken,
        };
      } catch (err) {
        mapGCSError("listObjects", err);
      }
    },

    async objectExists(bucket: string, key: string): Promise<boolean> {
      try {
        const [exists] = await getBucket(storage, bucket).file(key).exists();
        return exists;
      } catch (err) {
        mapGCSError("objectExists", err);
      }
    },

    async getMetadata(bucket: string, key: string): Promise<ObjectMetadata> {
      try {
        const file = getBucket(storage, bucket).file(key);
        const [meta] = await file.getMetadata();
        return {
          contentType: meta.contentType,
          cacheControl: meta.cacheControl,
          contentDisposition: meta.contentDisposition,
          contentEncoding: meta.contentEncoding,
          metadata: (meta.metadata as Record<string, string>) || {},
          size: Number(meta.size) || 0,
          lastModified: meta.updated || meta.timeCreated || new Date().toISOString(),
          etag: meta.etag,
        };
      } catch (err) {
        mapGCSError("getMetadata", err);
      }
    },

    async updateMetadata(bucket: string, key: string, metadata: Record<string, string>): Promise<void> {
      try {
        const file = getBucket(storage, bucket).file(key);
        await file.setMetadata({ metadata });
      } catch (err) {
        mapGCSError("updateMetadata", err);
      }
    },

    async generatePresignedUploadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const file = getBucket(storage, bucket).file(key);
        const [url] = await file.getSignedUrl({
          action: "write",
          expires: Date.now() + (expiresIn || 3600) * 1000,
        });
        return url;
      } catch (err) {
        mapGCSError("generatePresignedUploadUrl", err);
      }
    },

    async generatePresignedDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const file = getBucket(storage, bucket).file(key);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + (expiresIn || 3600) * 1000,
        });
        return url;
      } catch (err) {
        mapGCSError("generatePresignedDownloadUrl", err);
      }
    },
  };
}
