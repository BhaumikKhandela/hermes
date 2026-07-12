import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  ContainerClient,
} from "@azure/storage-blob";
import type { ObjectStorageProvider, ObjectMetadata, PutObjectOptions, PutObjectResult, ListOptions, ListResult } from "../types";

export interface AzureBlobConfig {
  connectionString: string;
}

function mapAzureError(operation: string, err: any): never {
  const code = err?.statusCode || err?.code || "UNKNOWN";
  const message = err?.message || String(err);
  if (code === 404) {
    throw new Error(`ObjectStorage azure-blob ${operation}: Object not found — ${message}`);
  }
  if (code === 403 || code === 401) {
    throw new Error(`ObjectStorage azure-blob ${operation}: Access denied — ${message}`);
  }
  if (code === 409) {
    throw new Error(`ObjectStorage azure-blob ${operation}: Conflict — ${message}`);
  }
  throw new Error(`ObjectStorage azure-blob ${operation}: ${message}`);
}

function getBlockBlobClient(containerUrl: string, containerClient: ContainerClient, key: string) {
  return containerClient.getBlockBlobClient(key);
}

function extractConnectionParts(connectionString: string): {
  accountName: string;
  accountKey: string;
  url: string;
} {
  const parts = Object.fromEntries(
    connectionString.split(";").map((p) => {
      const idx = p.indexOf("=");
      return idx === -1 ? [p, ""] : [p.slice(0, idx), p.slice(idx + 1)];
    }),
  );
  const accountName = parts.AccountName;
  const accountKey = parts.AccountKey;
  if (!accountName || !accountKey) {
    throw new Error("ObjectStorage azure-blob: connectionString must contain AccountName and AccountKey");
  }
  const url = `https://${accountName}.blob.core.windows.net`;
  return { accountName, accountKey, url };
}

export function createAzureBlobProvider(config: AzureBlobConfig): ObjectStorageProvider {
  const containerClientByBucket = new Map<string, ContainerClient>();
  let cachedUrl: string | null = null;
  let cachedAccountName: string | null = null;
  let cachedAccountKey: string | null = null;

  function getContainerClient(bucket: string): ContainerClient {
    let client = containerClientByBucket.get(bucket);
    if (!client) {
      const serviceClient = BlobServiceClient.fromConnectionString(config.connectionString);
      client = serviceClient.getContainerClient(bucket);
      containerClientByBucket.set(bucket, client);
    }
    return client;
  }

  function parseConnectionOnce() {
    if (!cachedUrl) {
      const parts = extractConnectionParts(config.connectionString);
      cachedUrl = parts.url;
      cachedAccountName = parts.accountName;
      cachedAccountKey = parts.accountKey;
    }
    return { url: cachedUrl!, accountName: cachedAccountName!, accountKey: cachedAccountKey! };
  }

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
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        const blobOptions: any = {};
        if (options?.contentType) blobOptions.blobContentType = options.contentType;
        if (options?.cacheControl) blobOptions.blobCacheControl = options.cacheControl;
        if (options?.contentDisposition) blobOptions.blobContentDisposition = options.contentDisposition;
        if (options?.contentEncoding) blobOptions.blobContentEncoding = options.contentEncoding;
        if (options?.metadata) blobOptions.metadata = options.metadata;
        await bc.upload(body, body.length, blobOptions);
        const props = await bc.getProperties();
        return { etag: props.etag, versionId: props.versionId };
      } catch (err) {
        mapAzureError("putObject", err);
      }
    },

    async getObject(bucket: string, key: string): Promise<Buffer> {
      try {
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        const response = await bc.download(0);
        const stream = response.readableStreamBody!;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      } catch (err) {
        mapAzureError("getObject", err);
      }
    },

    async deleteObject(bucket: string, key: string): Promise<void> {
      try {
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        await bc.delete();
      } catch (err) {
        mapAzureError("deleteObject", err);
      }
    },

    async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      try {
        const srcBc = getBlockBlobClient("", getContainerClient(sourceBucket), sourceKey);
        const dstBc = getBlockBlobClient("", getContainerClient(destBucket), destKey);
        const srcUrl = srcBc.url;
        const result = await dstBc.beginCopyFromURL(srcUrl);
        await result.pollUntilDone();
      } catch (err) {
        mapAzureError("copyObject", err);
      }
    },

    async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
      await this.copyObject(sourceBucket, sourceKey, destBucket, destKey);
      await this.deleteObject(sourceBucket, sourceKey);
    },

    async listObjects(bucket: string, options?: ListOptions): Promise<ListResult> {
      try {
        const container = getContainerClient(bucket);
        const blobs = container.listBlobsFlat({
          prefix: options?.prefix,
        }).byPage({ maxPageSize: options?.maxItems, continuationToken: options?.continuationToken });
        const page = await blobs.next();
        if (page.done) {
          return { objects: [], hasMore: false };
        }
        const segment = page.value;
        return {
          objects: (segment.segment?.blobItems || []).map((b) => ({
            key: b.name,
            size: b.properties.contentLength || 0,
            lastModified: b.properties.lastModified?.toISOString() || new Date().toISOString(),
            etag: b.properties.etag,
          })),
          continuationToken: segment.continuationToken,
          hasMore: !!segment.continuationToken,
        };
      } catch (err) {
        mapAzureError("listObjects", err);
      }
    },

    async objectExists(bucket: string, key: string): Promise<boolean> {
      try {
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        await bc.getProperties();
        return true;
      } catch (err: any) {
        if (err?.statusCode === 404) return false;
        mapAzureError("objectExists", err);
      }
    },

    async getMetadata(bucket: string, key: string): Promise<ObjectMetadata> {
      try {
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        const props = await bc.getProperties();
        return {
          contentType: props.contentType,
          cacheControl: props.cacheControl,
          contentDisposition: props.contentDisposition,
          contentEncoding: props.contentEncoding,
          metadata: props.metadata || {},
          size: props.contentLength || 0,
          lastModified: props.lastModified?.toISOString() || new Date().toISOString(),
          etag: props.etag,
        };
      } catch (err) {
        mapAzureError("getMetadata", err);
      }
    },

    async updateMetadata(bucket: string, key: string, metadata: Record<string, string>): Promise<void> {
      try {
        const bc = getBlockBlobClient("", getContainerClient(bucket), key);
        await bc.setMetadata(metadata);
      } catch (err) {
        mapAzureError("updateMetadata", err);
      }
    },

    async generatePresignedUploadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const { url, accountName, accountKey } = parseConnectionOnce();
        const bc = getBlockBlobClient(url, getContainerClient(bucket), key);
        const sharedKeyCred = new StorageSharedKeyCredential(accountName, accountKey);
        const sas = generateBlobSASQueryParameters(
          {
            containerName: bucket,
            blobName: key,
            permissions: BlobSASPermissions.parse("w"),
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + (expiresIn || 3600) * 1000),
            protocol: SASProtocol.Https,
          },
          sharedKeyCred,
        ).toString();
        return `${bc.url}?${sas}`;
      } catch (err) {
        mapAzureError("generatePresignedUploadUrl", err);
      }
    },

    async generatePresignedDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
      try {
        const { url, accountName, accountKey } = parseConnectionOnce();
        const bc = getBlockBlobClient(url, getContainerClient(bucket), key);
        const sharedKeyCred = new StorageSharedKeyCredential(accountName, accountKey);
        const sas = generateBlobSASQueryParameters(
          {
            containerName: bucket,
            blobName: key,
            permissions: BlobSASPermissions.parse("r"),
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + (expiresIn || 3600) * 1000),
            protocol: SASProtocol.Https,
          },
          sharedKeyCred,
        ).toString();
        return `${bc.url}?${sas}`;
      } catch (err) {
        mapAzureError("generatePresignedDownloadUrl", err);
      }
    },
  };
}
