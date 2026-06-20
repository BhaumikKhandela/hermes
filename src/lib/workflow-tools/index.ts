import { register } from "./registry";
import { createModelTool } from "./tools/model";
import { createReadFileTool, createWriteFileTool, createReadAndUpdateFileTool } from "./tools/fileSystem";
import { createSearchTool } from "./tools/search";
import { createWebscraperTool } from "./tools/webscraper";
import { createMemoryTool } from "./tools/memory";
import { createEmbeddingTool } from "./tools/embedding";
import { createVectorDBTool } from "./tools/vectorDB";
import { createRetrieverTool } from "./tools/retriever";
import { createImageGeneratorTool } from "./tools/imageGeneration";
import { createImageReaderTool } from "./tools/imageReader";
import { createImageEditorTool } from "./tools/imageEditor";
import { createSheetTool, createReadSheetTool } from "./tools/sheets";
import { createCalendarTool } from "./tools/calendar";
import { createEmailTool } from "./tools/email";
import { createChartTool } from "./tools/charts";
import { createPostgresTool, createMySQLTool, createMongoDBTool } from "./tools/database";

register({
  nodeRegistry: "model", factory: createModelTool, category: "ai", label: "Model", description: "Call an LLM for reasoning and generation", icon: "brain",
  configFields: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true },
    { key: "baseURL", label: "Base URL", type: "url", placeholder: "https://api.openai.com/v1", required: false },
    { key: "modelName", label: "Model", type: "text", placeholder: "gpt-4o", required: false },
  ],
});

register({
  nodeRegistry: "search", factory: createSearchTool, category: "data", label: "Search", description: "Google Custom Search web search", icon: "search",
  configFields: [
    { key: "googleApiKey", label: "Google API Key", type: "password", placeholder: "AIza...", required: true },
    { key: "cseId", label: "CSE ID", type: "text", placeholder: "your_cse_id", required: true },
  ],
});

register({
  nodeRegistry: "webscraper", factory: createWebscraperTool, category: "data", label: "Web Scraper", description: "Scrape web pages with Firecrawl", icon: "globe",
  configFields: [
    { key: "apiKey", label: "Firecrawl API Key", type: "password", placeholder: "fc-...", required: true },
  ],
});

register({
  nodeRegistry: "memory", factory: createMemoryTool, category: "storage", label: "Memory", description: "Persistent key-value memory store", icon: "database",
  configFields: [],
});

register({
  nodeRegistry: "embedding", factory: createEmbeddingTool, category: "ai", label: "Embedding", description: "Convert text to vector embeddings", icon: "vector",
  configFields: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true },
    { key: "baseURL", label: "Base URL", type: "url", placeholder: "https://api.openai.com/v1", required: false },
    { key: "modelName", label: "Model", type: "text", placeholder: "text-embedding-3-small", required: false },
  ],
});

register({
  nodeRegistry: "vectorDB", factory: createVectorDBTool, category: "storage", label: "Vector DB", description: "Query and upsert Pinecone vectors", icon: "layers",
  configFields: [
    { key: "apiKey", label: "Pinecone API Key", type: "password", placeholder: "pcsk_...", required: true },
    { key: "indexName", label: "Index Name", type: "text", placeholder: "my-index", required: true },
  ],
});

register({
  nodeRegistry: "retriever", factory: createRetrieverTool, category: "data", label: "Retriever", description: "Semantic document retrieval", icon: "file-text",
  configFields: [],
});

register({
  nodeRegistry: "imageGenerator", factory: createImageGeneratorTool, category: "ai", label: "Image Generator", description: "Generate images with DALL-E 3", icon: "image",
  configFields: [
    { key: "apiKey", label: "OpenAI API Key", type: "password", placeholder: "sk-...", required: true },
  ],
});

register({
  nodeRegistry: "imageReader", factory: createImageReaderTool, category: "ai", label: "Image Reader", description: "Analyze images with GPT-4o vision", icon: "eye",
  configFields: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-...", required: true },
    { key: "baseURL", label: "Base URL", type: "url", placeholder: "https://api.openai.com/v1", required: true },
  ],
});

register({
  nodeRegistry: "imageEditor", factory: createImageEditorTool, category: "ai", label: "Image Editor", description: "Edit images with DALL-E 2 inpainting", icon: "edit",
  configFields: [
    { key: "apiKey", label: "OpenAI API Key", type: "password", placeholder: "sk-...", required: true },
  ],
});

register({
  nodeRegistry: "sheet", factory: createSheetTool, category: "integration", label: "Sheet", description: "Write data to Google Sheets", icon: "table",
  configFields: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "AIza...", required: false, authGroup: "apiKey" },
    { key: "clientEmail", label: "Client Email", type: "text", placeholder: "service@account.iam.gserviceaccount.com", required: false, authGroup: "serviceAccount" },
    { key: "privateKey", label: "Private Key", type: "password", placeholder: "-----BEGIN PRIVATE KEY-----", required: false, authGroup: "serviceAccount" },
  ],
  authMethods: [
    { key: "apiKey", label: "API Key", description: "Use a Google API key", fields: ["apiKey"] },
    { key: "serviceAccount", label: "Service Account", description: "Use a service account JSON", fields: ["clientEmail", "privateKey"] },
  ],
});

register({
  nodeRegistry: "readSheet", factory: createReadSheetTool, category: "integration", label: "Read Sheet", description: "Read data from Google Sheets", icon: "table",
  configFields: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "AIza...", required: false, authGroup: "apiKey" },
    { key: "clientEmail", label: "Client Email", type: "text", placeholder: "service@account.iam.gserviceaccount.com", required: false, authGroup: "serviceAccount" },
    { key: "privateKey", label: "Private Key", type: "password", placeholder: "-----BEGIN PRIVATE KEY-----", required: false, authGroup: "serviceAccount" },
  ],
  authMethods: [
    { key: "apiKey", label: "API Key", description: "Use a Google API key", fields: ["apiKey"] },
    { key: "serviceAccount", label: "Service Account", description: "Use a service account JSON", fields: ["clientEmail", "privateKey"] },
  ],
});

register({
  nodeRegistry: "calendarEvent", factory: createCalendarTool, category: "integration", label: "Calendar", description: "Create Google Calendar events", icon: "calendar",
  configFields: [
    { key: "clientEmail", label: "Client Email", type: "text", placeholder: "service@account.iam.gserviceaccount.com", required: true },
    { key: "privateKey", label: "Private Key", type: "password", placeholder: "-----BEGIN PRIVATE KEY-----", required: true },
  ],
});

register({
  nodeRegistry: "sendMail", factory: createEmailTool, category: "communication", label: "Send Mail", description: "Send emails via SMTP", icon: "mail",
  configFields: [
    { key: "smtpHost", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com", required: true },
    { key: "smtpPort", label: "SMTP Port", type: "number", placeholder: "587", required: false, defaultValue: 587 },
    { key: "smtpUser", label: "SMTP User", type: "text", placeholder: "user@example.com", required: true },
    { key: "smtpPass", label: "SMTP Password", type: "password", placeholder: "********", required: true },
  ],
});

register({
  nodeRegistry: "chart", factory: createChartTool, category: "utility", label: "Chart", description: "Generate pie/line charts via QuickChart", icon: "bar-chart",
  configFields: [],
});

register({
  nodeRegistry: "readFile", factory: createReadFileTool, category: "utility", label: "Read File", description: "Read files from project workspace", icon: "file",
  configFields: [],
});

register({
  nodeRegistry: "writeFile", factory: createWriteFileTool, category: "utility", label: "Write File", description: "Write files to project workspace", icon: "file-plus",
  configFields: [],
});

register({
  nodeRegistry: "readAndUpdateFile", factory: createReadAndUpdateFileTool, category: "utility", label: "Edit File", description: "Find-replace content in a file", icon: "file-edit",
  configFields: [],
});

register({
  nodeRegistry: "postgresDB", factory: createPostgresTool, category: "storage", label: "PostgreSQL", description: "Query a PostgreSQL database with your credentials", icon: "database",
  configFields: [
    { key: "host", label: "Host", type: "text", placeholder: "localhost", required: true },
    { key: "port", label: "Port", type: "number", placeholder: "5432", required: false, defaultValue: 5432 },
    { key: "user", label: "User", type: "text", placeholder: "postgres", required: true },
    { key: "password", label: "Password", type: "password", placeholder: "********", required: true },
    { key: "database", label: "Database", type: "text", placeholder: "mydb", required: true },
    { key: "ssl", label: "SSL", type: "boolean", required: false, defaultValue: false },
  ],
});

register({
  nodeRegistry: "mysqlDB", factory: createMySQLTool, category: "storage", label: "MySQL", description: "Query a MySQL database with your credentials", icon: "database",
  configFields: [
    { key: "host", label: "Host", type: "text", placeholder: "localhost", required: true },
    { key: "port", label: "Port", type: "number", placeholder: "3306", required: false, defaultValue: 3306 },
    { key: "user", label: "User", type: "text", placeholder: "root", required: true },
    { key: "password", label: "Password", type: "password", placeholder: "********", required: true },
    { key: "database", label: "Database", type: "text", placeholder: "mydb", required: true },
  ],
});

register({
  nodeRegistry: "mongoDB", factory: createMongoDBTool, category: "storage", label: "MongoDB", description: "Query a MongoDB database with your connection URI", icon: "database",
  configFields: [
    { key: "uri", label: "Connection URI", type: "password", placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/db", required: true },
  ],
});

export { register, build, list, getRegistration } from "./registry";
export type { ToolFactory, ToolRegistration, ToolCategory } from "./types";
