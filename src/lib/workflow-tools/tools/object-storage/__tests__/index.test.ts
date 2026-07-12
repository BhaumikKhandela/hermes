import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProviderAdapter } from "../adapter";
import {
  handlePutObject, handleReadObject, handleDeleteObject,
  handleCopyObject, handleMoveObject, handleListObjects,
  handleGetMetadata, handleUpdateMetadata,
  handleGenerateUploadUrl, handleGenerateDownloadUrl,
  handleCheckExists,
} from "../handlers";
import { createObjectStorageTool, handlerMap } from "../index";
import { objectStorageActions, objectStorageSchema } from "../schema";
import type { ObjectStorageProvider, CapabilityMap, PutObjectResult, ObjectMetadata, ListResult } from "../types";

const FULL_CAPS: CapabilityMap = {
  putObject: true, getObject: true, deleteObject: true,
  copyObject: true, moveObject: true, listObjects: true,
  objectExists: true, getMetadata: true, updateMetadata: true,
  presignedUpload: true, presignedDownload: true,
};

function createMockProvider(overrides?: Partial<ObjectStorageProvider>): ObjectStorageProvider {
  return {
    capabilities: { ...FULL_CAPS },
    putObject: vi.fn().mockResolvedValue({ etag: '"abc123"', versionId: "v1" }),
    getObject: vi.fn().mockResolvedValue(Buffer.from("hello world")),
    deleteObject: vi.fn().mockResolvedValue(undefined),
    copyObject: vi.fn().mockResolvedValue(undefined),
    moveObject: vi.fn().mockResolvedValue(undefined),
    listObjects: vi.fn().mockResolvedValue({ objects: [], hasMore: false }),
    objectExists: vi.fn().mockResolvedValue(false),
    getMetadata: vi.fn().mockResolvedValue({
      contentType: "text/plain",
      cacheControl: undefined,
      contentDisposition: undefined,
      contentEncoding: undefined,
      metadata: {},
      size: 11,
      lastModified: "2026-01-01T00:00:00.000Z",
      etag: '"abc123"',
    }),
    updateMetadata: vi.fn().mockResolvedValue(undefined),
    generatePresignedUploadUrl: vi.fn().mockResolvedValue("https://example.com/upload?token=abc"),
    generatePresignedDownloadUrl: vi.fn().mockResolvedValue("https://example.com/download?token=abc"),
    ...overrides,
  };
}

describe("object-storage adapter selection", () => {
  it("creates an S3 adapter", () => {
    const provider = createProviderAdapter({
      provider: "s3",
      accessKeyId: "AKIA123",
      secretAccessKey: "secret123",
      region: "us-west-2",
    });
    expect(provider).toBeDefined();
    expect(provider.capabilities.putObject).toBe(true);
  });

  it("creates an R2 adapter", () => {
    const provider = createProviderAdapter({
      provider: "r2",
      accountId: "abc123",
      accessKeyId: "AKIA123",
      secretAccessKey: "secret123",
    });
    expect(provider).toBeDefined();
  });

  it("creates a GCS adapter", () => {
    const provider = createProviderAdapter({
      provider: "gcs",
      serviceAccountJson: JSON.stringify({ type: "service_account", project_id: "test" }),
    });
    expect(provider).toBeDefined();
  });

  it("creates an Azure Blob adapter", () => {
    const provider = createProviderAdapter({
      provider: "azure-blob",
      connectionString: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=key==",
    });
    expect(provider).toBeDefined();
  });

  it("throws for unknown provider", () => {
    expect(() =>
      createProviderAdapter({ provider: "unknown" as any }),
    ).toThrow("ObjectStorage: unknown provider");
  });

  it("throws for missing S3 credentials", () => {
    expect(() =>
      createProviderAdapter({ provider: "s3", accessKeyId: "AKIA123" } as any),
    ).toThrow("secretAccessKey is required");
  });

  it("throws for missing R2 credentials", () => {
    expect(() =>
      createProviderAdapter({ provider: "r2", accessKeyId: "AKIA123" } as any),
    ).toThrow("accountId is required");
  });

  it("throws for missing GCS credentials", () => {
    expect(() =>
      createProviderAdapter({ provider: "gcs" } as any),
    ).toThrow("serviceAccountJson is required");
  });

  it("throws for invalid GCS JSON", () => {
    expect(() =>
      createProviderAdapter({ provider: "gcs", serviceAccountJson: "not-json" }),
    ).toThrow("not valid JSON");
  });

  it("throws for missing Azure credentials", () => {
    expect(() =>
      createProviderAdapter({ provider: "azure-blob" } as any),
    ).toThrow("connectionString is required");
  });
});

describe("object-storage capabilities", () => {
  it("handler rejects unsupported capability", async () => {
    const provider = createMockProvider();
    provider.capabilities.presignedUpload = false;
    await expect(
      handleGenerateUploadUrl(
        { bucket: "b", key: "k", expiresIn: 3600 },
        {},
        provider,
      ),
    ).rejects.toThrow("does not support this operation");
  });

  it("S3 adapter has full capabilities", () => {
    const provider = createProviderAdapter({
      provider: "s3", accessKeyId: "AKIA123", secretAccessKey: "secret",
    });
    expect(Object.values(provider.capabilities).every(Boolean)).toBe(true);
  });

  it("R2 adapter has full capabilities", () => {
    const provider = createProviderAdapter({
      provider: "r2", accountId: "a", accessKeyId: "AKIA", secretAccessKey: "s",
    });
    expect(Object.values(provider.capabilities).every(Boolean)).toBe(true);
  });
});

describe("object-storage handlers - put_object", () => {
  it("put_object with utf-8 body", async () => {
    const provider = createMockProvider();
    const result = await handlePutObject(
      { bucket: "my-bucket", key: "hello.txt", body: "Hello!", encoding: "utf-8" },
      {},
      provider,
    );
    expect(result.action).toBe("put_object");
    expect(result.data.bucket).toBe("my-bucket");
    expect(result.data.key).toBe("hello.txt");
    expect(result.data.etag).toBe('"abc123"');
    expect(provider.putObject).toHaveBeenCalledWith(
      "my-bucket", "hello.txt",
      Buffer.from("Hello!"),
      expect.any(Object),
    );
  });

  it("put_object with base64 body", async () => {
    const provider = createMockProvider();
    const encoded = Buffer.from("binary data").toString("base64");
    await handlePutObject(
      { bucket: "b", key: "k", body: encoded, encoding: "base64" },
      {},
      provider,
    );
    expect(provider.putObject).toHaveBeenCalled();
  });

  it("put_object with JSON body validates JSON", async () => {
    const provider = createMockProvider();
    await expect(
      handlePutObject(
        { bucket: "b", key: "k", body: "not-json", encoding: "json" },
        {},
        provider,
      ),
    ).rejects.toThrow("not valid JSON");
  });

  it("put_object throws if bucket missing", async () => {
    await expect(
      handlePutObject({ key: "k", body: "x" }, {}, createMockProvider()),
    ).rejects.toThrow("Bucket is required");
  });

  it("put_object throws if key missing", async () => {
    await expect(
      handlePutObject({ bucket: "b", body: "x" }, {}, createMockProvider()),
    ).rejects.toThrow("Object Key");
  });

  it("put_object throws if body missing", async () => {
    await expect(
      handlePutObject({ bucket: "b", key: "k" }, {}, createMockProvider()),
    ).rejects.toThrow("Body");
  });
});

describe("object-storage handlers - ifExists policy", () => {
  it("put_object with skip policy returns early when exists", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    const result = await handlePutObject(
      { bucket: "b", key: "k", body: "x", ifExists: "skip" },
      {},
      provider,
    );
    expect(result.data.skipped).toBe(true);
    expect(provider.putObject).not.toHaveBeenCalled();
  });

  it("put_object with error policy throws when exists", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    await expect(
      handlePutObject(
        { bucket: "b", key: "k", body: "x", ifExists: "error" },
        {},
        provider,
      ),
    ).rejects.toThrow("already exists");
  });

  it("put_object with overwrite policy proceeds when exists", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    await handlePutObject(
      { bucket: "b", key: "k", body: "x", ifExists: "overwrite" },
      {},
      provider,
    );
    expect(provider.putObject).toHaveBeenCalled();
  });

  it("copy_object with skip policy returns early", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    const result = await handleCopyObject(
      { bucket: "src", key: "a", destinationBucket: "dst", destinationKey: "b", ifExists: "skip" },
      {},
      provider,
    );
    expect(result.data.skipped).toBe(true);
  });

  it("move_object with error policy throws", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    await expect(
      handleMoveObject(
        { bucket: "src", key: "a", destinationBucket: "dst", destinationKey: "b", ifExists: "error" },
        {},
        provider,
      ),
    ).rejects.toThrow("already exists");
  });
});

describe("object-storage handlers - read_object", () => {
  it("read_object returns utf-8 by default", async () => {
    const provider = createMockProvider();
    const result = await handleReadObject(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.body).toBe("hello world");
    expect(result.data.encoding).toBe("utf-8");
    expect(result.data.isBase64).toBe(false);
    expect(provider.getObject).toHaveBeenCalledWith("b", "k");
  });

  it("read_object returns base64 when requested", async () => {
    const provider = createMockProvider();
    const result = await handleReadObject(
      { bucket: "b", key: "k", returnEncoding: "base64" },
      {},
      provider,
    );
    expect(result.data.encoding).toBe("base64");
    expect(result.data.isBase64).toBe(true);
  });

  it("read_object returns raw base64", async () => {
    const provider = createMockProvider();
    const result = await handleReadObject(
      { bucket: "b", key: "k", returnEncoding: "raw" },
      {},
      provider,
    );
    expect(result.data.isBase64).toBe(true);
  });

  it("read_object with json encoding parses JSON", async () => {
    const provider = createMockProvider();
    provider.getObject = vi.fn().mockResolvedValue(Buffer.from('{"key":"value"}'));
    const result = await handleReadObject(
      { bucket: "b", key: "k", returnEncoding: "json" },
      {},
      provider,
    );
    expect(result.data.body).toBe('{"key":"value"}');
    expect(result.data.encoding).toBe("json");
  });
});

describe("object-storage handlers - delete_object", () => {
  it("delete_object calls provider", async () => {
    const provider = createMockProvider();
    const result = await handleDeleteObject(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.deleted).toBe(true);
    expect(provider.deleteObject).toHaveBeenCalledWith("b", "k");
  });
});

describe("object-storage handlers - copy_object / move_object", () => {
  it("copy_object", async () => {
    const provider = createMockProvider();
    const result = await handleCopyObject(
      { bucket: "src", key: "a", destinationBucket: "dst", destinationKey: "b" },
      {},
      provider,
    );
    expect(result.action).toBe("copy_object");
    expect(result.data.source.bucket).toBe("src");
    expect(result.data.destination.bucket).toBe("dst");
    expect(provider.copyObject).toHaveBeenCalledWith("src", "a", "dst", "b");
  });

  it("move_object", async () => {
    const provider = createMockProvider();
    const result = await handleMoveObject(
      { bucket: "src", key: "a", destinationBucket: "dst", destinationKey: "b" },
      {},
      provider,
    );
    expect(result.action).toBe("move_object");
    expect(provider.moveObject).toHaveBeenCalledWith("src", "a", "dst", "b");
  });
});

describe("object-storage handlers - list_objects", () => {
  it("list_objects returns objects", async () => {
    const provider = createMockProvider();
    provider.listObjects = vi.fn().mockResolvedValue({
      objects: [
        { key: "a.txt", size: 10, lastModified: "2024-01-01T00:00:00Z", etag: '"a"' },
        { key: "b.txt", size: 20, lastModified: "2024-01-02T00:00:00Z", etag: '"b"' },
      ],
      hasMore: false,
    });
    const result = await handleListObjects(
      { bucket: "b" },
      {},
      provider,
    );
    expect(result.data.objects).toHaveLength(2);
    expect(result.data.total).toBe(2);
    expect(result.data.hasMore).toBe(false);
  });

  it("list_objects with returnAll paginates", async () => {
    const provider = createMockProvider();
    let callCount = 0;
    provider.listObjects = vi.fn().mockImplementation(() => {
      callCount++;
      return {
        objects: [{ key: `${callCount}.txt`, size: 1, lastModified: "2024-01-01T00:00:00Z", etag: `"${callCount}"` }],
        continuationToken: callCount < 3 ? `token-${callCount}` : undefined,
        hasMore: callCount < 3,
      };
    });
    const result = await handleListObjects(
      { bucket: "b", returnAll: true, maxItems: 5 },
      {},
      provider,
    );
    expect(result.data.objects).toHaveLength(3);
    expect(provider.listObjects).toHaveBeenCalledTimes(3);
  });

  it("list_objects with continuation token", async () => {
    const provider = createMockProvider();
    provider.listObjects = vi.fn().mockResolvedValue({
      objects: [{ key: "c.txt", size: 30, lastModified: "2024-01-03T00:00:00Z", etag: '"c"' }],
      continuationToken: "next-token",
      hasMore: true,
    });
    const result = await handleListObjects(
      { bucket: "b", continuationToken: "prev-token" },
      {},
      provider,
    );
    expect(result.data.continuationToken).toBe("next-token");
    expect(provider.listObjects).toHaveBeenCalledWith("b", expect.objectContaining({ continuationToken: "prev-token" }));
  });
});

describe("object-storage handlers - metadata", () => {
  it("get_metadata", async () => {
    const provider = createMockProvider();
    const result = await handleGetMetadata(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.contentType).toBe("text/plain");
    expect(result.data.size).toBe(11);
    expect(provider.getMetadata).toHaveBeenCalledWith("b", "k");
  });

  it("update_metadata with valid JSON", async () => {
    const provider = createMockProvider();
    const result = await handleUpdateMetadata(
      { bucket: "b", key: "k", metadata: '{"env":"prod","owner":"team"}' },
      {},
      provider,
    );
    expect(result.data.metadata).toEqual({ env: "prod", owner: "team" });
    expect(provider.updateMetadata).toHaveBeenCalledWith("b", "k", { env: "prod", owner: "team" });
  });

  it("update_metadata throws for empty metadata", async () => {
    const provider = createMockProvider();
    await expect(
      handleUpdateMetadata(
        { bucket: "b", key: "k", metadata: "{}" },
        {},
        provider,
      ),
    ).rejects.toThrow("at least one key");
  });

  it("update_metadata throws for invalid JSON", async () => {
    const provider = createMockProvider();
    await expect(
      handleUpdateMetadata(
        { bucket: "b", key: "k", metadata: "not-json" },
        {},
        provider,
      ),
    ).rejects.toThrow("valid JSON object");
  });
});

describe("object-storage handlers - presigned URLs", () => {
  it("generate_upload_url", async () => {
    const provider = createMockProvider();
    const result = await handleGenerateUploadUrl(
      { bucket: "b", key: "k", expiresIn: 600 },
      {},
      provider,
    );
    expect(result.data.url).toContain("example.com");
    expect(result.data.expiresIn).toBe(600);
    expect(provider.generatePresignedUploadUrl).toHaveBeenCalledWith("b", "k", 600);
  });

  it("generate_download_url", async () => {
    const provider = createMockProvider();
    const result = await handleGenerateDownloadUrl(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.url).toContain("example.com");
    expect(provider.generatePresignedDownloadUrl).toHaveBeenCalledWith("b", "k", 3600);
  });

  it("generate_upload_url defaults expiresIn to 3600", async () => {
    const provider = createMockProvider();
    await handleGenerateUploadUrl(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(provider.generatePresignedUploadUrl).toHaveBeenCalledWith("b", "k", 3600);
  });
});

describe("object-storage handlers - check_exists", () => {
  it("check_exists returns true when object exists", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(true);
    const result = await handleCheckExists(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.exists).toBe(true);
    expect(provider.objectExists).toHaveBeenCalledWith("b", "k");
  });

  it("check_exists returns false when object missing", async () => {
    const provider = createMockProvider();
    provider.objectExists = vi.fn().mockResolvedValue(false);
    const result = await handleCheckExists(
      { bucket: "b", key: "k" },
      {},
      provider,
    );
    expect(result.data.exists).toBe(false);
  });
});

describe("object-storage schema", () => {
  it("exports 11 actions", () => {
    expect(objectStorageActions).toHaveLength(11);
    expect(objectStorageActions).toContain("put_object");
    expect(objectStorageActions).toContain("check_exists");
  });

  it("parses valid input", () => {
    const parsed = objectStorageSchema.parse({
      action: "put_object",
      bucket: "my-bucket",
      key: "test.txt",
      body: "hello",
    });
    expect(parsed.action).toBe("put_object");
    expect(parsed.encoding).toBe("utf-8");
    expect(parsed.ifExists).toBe("overwrite");
  });

  it("applies defaults", () => {
    const parsed = objectStorageSchema.parse({});
    expect(parsed.encoding).toBe("utf-8");
    expect(parsed.returnEncoding).toBe("utf-8");
    expect(parsed.ifExists).toBe("overwrite");
    expect(parsed.recursive).toBe(true);
    expect(parsed.returnAll).toBe(false);
    expect(parsed.expiresIn).toBe(3600);
  });
});

describe("object-storage handler map", () => {
  it("has all 11 actions registered", () => {
    expect(Object.keys(handlerMap)).toHaveLength(11);
    objectStorageActions.forEach((action) => {
      expect(handlerMap[action]).toBeDefined();
    });
  });

  it("each handler is a function", () => {
    Object.values(handlerMap).forEach((handler) => {
      expect(typeof handler).toBe("function");
    });
  });
});

describe("object-storage error normalization", () => {
  it("adapter factory throws for missing required fields", () => {
    expect(() => createProviderAdapter({ provider: "s3" } as any))
      .toThrow("accessKeyId is required");
    expect(() => createProviderAdapter({ provider: "r2" } as any))
      .toThrow("accountId is required");
    expect(() => createProviderAdapter({ provider: "gcs" } as any))
      .toThrow("serviceAccountJson is required");
    expect(() => createProviderAdapter({ provider: "azure-blob" } as any))
      .toThrow("connectionString is required");
  });

  it("handler throws informative error for missing required field", async () => {
    await expect(
      handlePutObject({}, {}, createMockProvider()),
    ).rejects.toThrow("Bucket is required");
  });

  it("handler throws informative error for invalid JSON metadata", async () => {
    await expect(
      handleUpdateMetadata(
        { bucket: "b", key: "k", metadata: "{bad json}" },
        {},
        createMockProvider(),
      ),
    ).rejects.toThrow("valid JSON object");
  });
});
