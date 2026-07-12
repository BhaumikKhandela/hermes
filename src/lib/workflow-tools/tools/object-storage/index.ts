import { tool } from "@langchain/core/tools";
import type { ToolFactory } from "../../types";
import { objectStorageSchema } from "./schema";
import { createProviderAdapter } from "./adapter";
import * as H from "./handlers";

export const handlerMap: Record<string, Function> = {
  put_object: H.handlePutObject,
  read_object: H.handleReadObject,
  delete_object: H.handleDeleteObject,
  copy_object: H.handleCopyObject,
  move_object: H.handleMoveObject,
  list_objects: H.handleListObjects,
  get_metadata: H.handleGetMetadata,
  update_metadata: H.handleUpdateMetadata,
  generate_upload_url: H.handleGenerateUploadUrl,
  generate_download_url: H.handleGenerateDownloadUrl,
  check_exists: H.handleCheckExists,
};

export { objectStorageSchema };

export const createObjectStorageTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = objectStorageSchema.parse(input);
      const action = parsed.action || config?.action;
      if (!action) throw new Error("ObjectStorage tool: action is required.");
      const handler = handlerMap[action];
      if (!handler) throw new Error(`ObjectStorage tool: unknown action "${action}".`);

      const provider = createProviderAdapter({
        provider: config?.provider,
        region: config?.region,
        endpoint: config?.endpoint,
        accessKeyId: config?.accessKeyId,
        secretAccessKey: config?.secretAccessKey,
        accountId: config?.accountId,
        serviceAccountJson: config?.serviceAccountJson,
        connectionString: config?.connectionString,
      });

      const result = await handler(parsed, config, provider);
      return JSON.stringify(result);
    },
    {
      name: "object_storage",
      description:
        "Execute object storage operations across S3, R2, GCS, and Azure Blob: put, read, delete, copy, move, list, metadata, presigned URLs, and existence checks. Uses bucket/key addressing with configurable encoding and existence policies.",
      schema: objectStorageSchema,
    },
  );
};
