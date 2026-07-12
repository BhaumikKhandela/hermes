import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorageProvider, ObjectMetadata, PutObjectOptions, PutObjectResult, ListOptions, ListResult } from "../types";

export interface S3Config {
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function mapS3Error(operation: string, err: any): never {
  const name = err?.name || "UnknownError";
  const message = err?.message || String(err);
  if (name === "NoSuchKey" || name === "NotFound") {
    throw new Error(`ObjectStorage s3 ${operation}: Object not found — ${message}`);
  }
  if (name === "NoSuchBucket") {
    throw new Error(`ObjectStorage s3 ${operation}: Bucket not found — ${message}`);
  }
  if (name === "AccessDenied") {
    throw new Error(`ObjectStorage s3 ${operation}: Access denied — ${message}`);
  }
  if (name === "BucketNotEmpty") {
    throw new Error(`ObjectStorage s3 ${operation}: Bucket not empty — ${message}`);
  }
  throw new Error(`ObjectStorage s3 ${operation}: ${message}`);
}

export function createS3Provider(config: S3Config): ObjectStorageProvider {
  const client = new S3Client({
    region: config.region || "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint || undefined,
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
        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: options?.contentType,
          CacheControl: options?.cacheControl,
          ContentDisposition: options?.contentDisposition,
          ContentEncoding: options?.contentEncoding,
          Metadata: options?.metadata,
        });
        const result = await client.send(cmd);
        return { etag: result.ETag, versionId: result.VersionId };
      } catch (err) {
        mapS3Error("putObject", err);
      }
    },

    async getObject(bucket: string, key: string): Promise<Buffer> {
      try {
        const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
        const result = await client.send(cmd);
        return Buffer.from(await result.Body!.transformToByteArray());
      } catch (err) {
        mapS3Error("getObject", err);
      }
    },

    async deleteObject(bucket: string, key: string): Promise<void> {
      try {
        const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
        await client.send(cmd);
      } catch (err) {
        mapS3Error("deleteObject", err);
      }
    },

    async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      try {
        const cmd = new CopyObjectCommand({
          CopySource: `/${sourceBucket}/${encodeURIComponent(sourceKey)}`,
          Bucket: destBucket,
          Key: destKey,
        });
        await client.send(cmd);
      } catch (err) {
        mapS3Error("copyObject", err);
      }
    },

    async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      await this.copyObject(sourceBucket, sourceKey, destBucket, destKey);
      await this.deleteObject(sourceBucket, sourceKey);
    },

    async listObjects(bucket: string, options?: ListOptions): Promise<ListResult> {
      try {
        const cmd = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: options?.prefix,
          Delimiter: options?.recursive === false ? "/" : undefined,
          MaxKeys: options?.maxItems,
          ContinuationToken: options?.continuationToken,
        });
        const result = await client.send(cmd);
        return {
          objects: (result.Contents || []).map((obj) => ({
            key: obj.Key!,
            size: obj.Size!,
            lastModified: obj.LastModified!.toISOString(),
            etag: obj.ETag,
          })),
          continuationToken: result.NextContinuationToken,
          hasMore: result.IsTruncated || false,
        };
      } catch (err) {
        mapS3Error("listObjects", err);
      }
    },

    async objectExists(bucket: string, key: string): Promise<boolean> {
      try {
        const cmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
        await client.send(cmd);
        return true;
      } catch (err: any) {
        if (err?.name === "NotFound" || err?.name === "NoSuchKey") return false;
        mapS3Error("objectExists", err);
      }
    },

    async getMetadata(bucket: string, key: string): Promise<ObjectMetadata> {
      try {
        const cmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const result = await client.send(cmd);
        return {
          contentType: result.ContentType,
          cacheControl: result.CacheControl,
          contentDisposition: result.ContentDisposition,
          contentEncoding: result.ContentEncoding,
          metadata: result.Metadata || {},
          size: result.ContentLength!,
          lastModified: result.LastModified!.toISOString(),
          etag: result.ETag,
        };
      } catch (err) {
        mapS3Error("getMetadata", err);
      }
    },

    async updateMetadata(bucket: string, key: string, metadata: Record<string, string>): Promise<void> {
      try {
        const headCmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const existing = await client.send(headCmd);
        const copyCmd = new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: `/${bucket}/${encodeURIComponent(key)}`,
          Metadata: { ...existing.Metadata, ...metadata },
          MetadataDirective: "REPLACE",
        });
        await client.send(copyCmd);
      } catch (err) {
        mapS3Error("updateMetadata", err);
      }
    },

    async generatePresignedUploadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const cmd = new PutObjectCommand({ Bucket: bucket, Key: key });
        return getSignedUrl(client, cmd, { expiresIn: expiresIn || 3600 });
      } catch (err) {
        mapS3Error("generatePresignedUploadUrl", err);
      }
    },

    async generatePresignedDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
        return getSignedUrl(client, cmd, { expiresIn: expiresIn || 3600 });
      } catch (err) {
        mapS3Error("generatePresignedDownloadUrl", err);
      }
    },
  };
}
