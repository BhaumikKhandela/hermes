export const PROVIDERS = ["s3", "r2", "gcs", "azure-blob"] as const;
export const ACTIONS = [
  "put_object", "read_object", "delete_object",
  "copy_object", "move_object", "list_objects",
  "get_metadata", "update_metadata",
  "generate_upload_url", "generate_download_url",
  "check_exists",
] as const;
export const ENCODINGS = ["utf-8", "base64", "json"] as const;
export const RETURN_ENCODINGS = ["utf-8", "base64", "json", "raw"] as const;
export const IF_EXISTS_POLICIES = ["error", "overwrite", "skip"] as const;

export type StorageProvider = typeof PROVIDERS[number];
export type ObjectStorageAction = typeof ACTIONS[number];
export type ObjectEncoding = typeof ENCODINGS[number];
export type ReturnEncoding = typeof RETURN_ENCODINGS[number];
export type IfExistsPolicy = typeof IF_EXISTS_POLICIES[number];

export const CAPABILITY_KEYS = [
  "putObject", "getObject", "deleteObject",
  "copyObject", "moveObject", "listObjects",
  "objectExists", "getMetadata", "updateMetadata",
  "presignedUpload", "presignedDownload",
] as const;

export type CapabilityKey = typeof CAPABILITY_KEYS[number];
export type CapabilityMap = { [K in CapabilityKey]: boolean };

export interface PutObjectOptions {
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  metadata?: Record<string, string>;
}

export interface PutObjectResult {
  etag?: string;
  versionId?: string;
}

export interface ObjectMetadata {
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  metadata: Record<string, string>;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface ListOptions {
  prefix?: string;
  recursive?: boolean;
  maxItems?: number;
  continuationToken?: string;
}

export interface ObjectSummary {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface ListResult {
  objects: ObjectSummary[];
  continuationToken?: string;
  hasMore: boolean;
}

export interface ObjectStorageProvider {
  readonly capabilities: CapabilityMap;
  putObject(bucket: string, key: string, body: Buffer, options?: PutObjectOptions): Promise<PutObjectResult>;
  getObject(bucket: string, key: string): Promise<Buffer>;
  deleteObject(bucket: string, key: string): Promise<void>;
  copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void>;
  moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void>;
  listObjects(bucket: string, options?: ListOptions): Promise<ListResult>;
  objectExists(bucket: string, key: string): Promise<boolean>;
  getMetadata(bucket: string, key: string): Promise<ObjectMetadata>;
  updateMetadata(bucket: string, key: string, metadata: Record<string, string>): Promise<void>;
  generatePresignedUploadUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
  generatePresignedDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
}

export type StorageToolResult = {
  action: string;
  data: Record<string, any>;
};
