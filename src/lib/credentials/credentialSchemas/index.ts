import type { CredentialProvider, AuthMethod } from "../types";

export type CredentialField = {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "number";
  placeholder?: string;
  required?: boolean;
};

export type CredentialSchema = {
  provider: CredentialProvider;
  authMethod: AuthMethod;
  fields: CredentialField[];
  testAction?: string;
};

export function getCredentialSchema(
  provider: CredentialProvider,
  authMethod: AuthMethod,
): CredentialSchema | undefined {
  return credentialSchemas.find(
    (s) => s.provider === provider && s.authMethod === authMethod,
  );
}

export function listCredentialSchemas(): CredentialSchema[] {
  return credentialSchemas;
}

const credentialSchemas: CredentialSchema[] = [
  {
    provider: "openai",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true },
    ],
    testAction: "list models",
  },
  {
    provider: "anthropic",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-ant-...", required: true },
    ],
    testAction: "list models",
  },
  {
    provider: "gemini",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "AIza...", required: true },
    ],
    testAction: "list models",
  },
  {
    provider: "google-sheets",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "AIza...", required: true },
    ],
  },
  {
    provider: "google",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "AIza...", required: true },
      { key: "cseId", label: "Search Engine ID", type: "text", placeholder: "your_cse_id", required: true },
    ],
    testAction: "search test query",
  },
  {
    provider: "google-sheets",
    authMethod: "serviceAccount",
    fields: [
      { key: "clientEmail", label: "Client Email", type: "text", placeholder: "service@account.iam.gserviceaccount.com", required: true },
      { key: "privateKey", label: "Private Key", type: "password", placeholder: "-----BEGIN PRIVATE KEY-----", required: true },
    ],
    testAction: "fetch spreadsheet metadata",
  },
  {
    provider: "google-calendar",
    authMethod: "serviceAccount",
    fields: [
      { key: "clientEmail", label: "Client Email", type: "text", placeholder: "service@account.iam.gserviceaccount.com", required: true },
      { key: "privateKey", label: "Private Key", type: "password", placeholder: "-----BEGIN PRIVATE KEY-----", required: true },
    ],
    testAction: "list calendars",
  },
  {
    provider: "pinecone",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "Pinecone API Key", type: "password", placeholder: "pcsk_...", required: true },
      { key: "indexName", label: "Index Name", type: "text", placeholder: "my-index", required: true },
    ],
    testAction: "describe index",
  },
  {
    provider: "firecrawl",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "Firecrawl API Key", type: "password", placeholder: "fc-...", required: true },
    ],
    testAction: "scrape test URL",
  },
  {
    provider: "bluesmind",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true },
      { key: "baseURL", label: "Base URL", type: "url", placeholder: "https://api.bluesmind.com/v1", required: true },
    ],
  },
  {
    provider: "tavily",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "Tavily API Key", type: "password", placeholder: "tvly-...", required: true },
    ],
    testAction: "search test query",
  },
  {
    provider: "redis",
    authMethod: "connectionString",
    fields: [
      { key: "url", label: "Redis Connection URL", type: "password", placeholder: "redis://:password@host:6379/0", required: true },
    ],
    testAction: "PING",
  },
  {
    provider: "smtp",
    authMethod: "smtp",
    fields: [
      { key: "host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com", required: true },
      { key: "port", label: "SMTP Port", type: "number", placeholder: "587", required: false },
      { key: "user", label: "SMTP User", type: "text", placeholder: "user@example.com", required: true },
      { key: "pass", label: "SMTP Password", type: "password", placeholder: "********", required: true },
    ],
    testAction: "verify connection",
  },
  {
    provider: "postgres",
    authMethod: "userPassword",
    fields: [
      { key: "host", label: "Host", type: "text", placeholder: "localhost", required: true },
      { key: "port", label: "Port", type: "number", placeholder: "5432", required: false },
      { key: "user", label: "User", type: "text", placeholder: "postgres", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "********", required: true },
      { key: "database", label: "Database", type: "text", placeholder: "mydb", required: true },
    ],
    testAction: "SELECT 1",
  },
  {
    provider: "mysql",
    authMethod: "userPassword",
    fields: [
      { key: "host", label: "Host", type: "text", placeholder: "localhost", required: true },
      { key: "port", label: "Port", type: "number", placeholder: "3306", required: false },
      { key: "user", label: "User", type: "text", placeholder: "root", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "********", required: true },
      { key: "database", label: "Database", type: "text", placeholder: "mydb", required: true },
    ],
    testAction: "SELECT 1",
  },
  {
    provider: "mongodb",
    authMethod: "connectionString",
    fields: [
      { key: "uri", label: "Connection URI", type: "password", placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/db", required: true },
    ],
    testAction: "ping",
  },
  {
    provider: "notion",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "Internal Integration Secret", type: "password", placeholder: "ntn_...", required: true },
    ],
    testAction: "search across workspace",
  },
  {
    provider: "slack",
    authMethod: "apiKey",
    fields: [
      { key: "apiKey", label: "Bot / User OAuth Token", type: "password", placeholder: "xoxb-... or xoxp-...", required: true },
    ],
    testAction: "auth.test",
  },
];
