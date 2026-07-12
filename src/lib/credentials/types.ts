export const CredentialProviders = [
  "openai",
  "anthropic",
  "gemini",
  "google",
  "google-sheets",
  "google-calendar",
  "pinecone",
  "firecrawl",
  "bluesmind",
  "tavily",
  "smtp",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "notion",
  "slack",
  "discord",
  "discord-webhook",
] as const;

export const AuthMethods = [
  "apiKey",
  "serviceAccount",
  "smtp",
  "userPassword",
  "connectionString",
  "oauth",
] as const;

export type CredentialProvider = typeof CredentialProviders[number];
export type AuthMethod = typeof AuthMethods[number];

export type CredentialMetadata = {
  _id: string;
  ownerId: string;
  provider: CredentialProvider;
  authMethod: AuthMethod;
  providerAccountId?: string;
  name: string;
  status: "active" | "invalid" | "expired";
  schemaVersion: number;
  revision: number;
  lastUsedAt?: string;
  lastValidationAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CredentialPayload = Record<string, any>;

export type CredentialRequirement = {
  providers: string[];
  authMethods: string[];
};
