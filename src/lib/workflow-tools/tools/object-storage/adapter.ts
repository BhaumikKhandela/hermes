import type { ObjectStorageProvider, StorageProvider } from "./types";
import { createS3Provider } from "./providers/s3";
import { createR2Provider } from "./providers/r2";
import { createGCSProvider } from "./providers/gcs";
import { createAzureBlobProvider } from "./providers/azureBlob";

export type ProviderConfig = {
  provider: StorageProvider;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  accountId?: string;
  serviceAccountJson?: string;
  connectionString?: string;
};

export function createProviderAdapter(config: ProviderConfig): ObjectStorageProvider {
  switch (config.provider) {
    case "s3": {
      if (!config.accessKeyId) throw new Error("ObjectStorage s3: accessKeyId is required");
      if (!config.secretAccessKey) throw new Error("ObjectStorage s3: secretAccessKey is required");
      return createS3Provider({
        region: config.region,
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      });
    }
    case "r2": {
      if (!config.accountId) throw new Error("ObjectStorage r2: accountId is required");
      if (!config.accessKeyId) throw new Error("ObjectStorage r2: accessKeyId is required");
      if (!config.secretAccessKey) throw new Error("ObjectStorage r2: secretAccessKey is required");
      return createR2Provider({
        accountId: config.accountId,
        region: config.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      });
    }
    case "gcs": {
      if (!config.serviceAccountJson) throw new Error("ObjectStorage gcs: serviceAccountJson is required");
      return createGCSProvider({ serviceAccountJson: config.serviceAccountJson });
    }
    case "azure-blob": {
      if (!config.connectionString) throw new Error("ObjectStorage azure-blob: connectionString is required");
      return createAzureBlobProvider({ connectionString: config.connectionString });
    }
    default:
      throw new Error(`ObjectStorage: unknown provider "${(config as any).provider}"`);
  }
}
