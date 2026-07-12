import { z } from "zod";

export const objectStorageActions = [
  "put_object", "read_object", "delete_object",
  "copy_object", "move_object", "list_objects",
  "get_metadata", "update_metadata",
  "generate_upload_url", "generate_download_url",
  "check_exists",
] as const;

export const objectStorageEncodings = ["utf-8", "base64", "json"] as const;
export const objectStorageReturnEncodings = ["utf-8", "base64", "json", "raw"] as const;
export const objectStorageIfExistsPolicies = ["error", "overwrite", "skip"] as const;

export const partialObjectStorageSchema = z.object({
  action: z.enum(objectStorageActions).optional(),
  bucket: z.string().optional(),
  key: z.string().optional(),
  destinationBucket: z.string().optional(),
  destinationKey: z.string().optional(),
  body: z.string().optional(),
  encoding: z.enum(objectStorageEncodings).optional().default("utf-8"),
  returnEncoding: z.enum(objectStorageReturnEncodings).optional().default("utf-8"),
  ifExists: z.enum(objectStorageIfExistsPolicies).optional().default("overwrite"),
  contentType: z.string().optional(),
  cacheControl: z.string().optional(),
  contentDisposition: z.string().optional(),
  contentEncoding: z.string().optional(),
  metadata: z.string().optional(),
  prefix: z.string().optional(),
  recursive: z.boolean().optional().default(true),
  maxItems: z.number().optional(),
  continuationToken: z.string().optional(),
  returnAll: z.boolean().optional().default(false),
  expiresIn: z.number().optional().default(3600),
});

export const objectStorageSchema = partialObjectStorageSchema;
