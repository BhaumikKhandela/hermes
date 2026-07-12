import { register } from "./registry";
import { createModelTool } from "./tools/model";
import { createReadFileTool, createWriteFileTool, createReadAndUpdateFileTool } from "./tools/fileSystem";
import { createSearchTool } from "./tools/search";
import { createWebscraperTool } from "./tools/webscraper";
import { createMemoryTool } from "./tools/memory";
import { createEmbeddingTool } from "./tools/embedding";
import { createVectorDBTool } from "./tools/vectorDB";
import { createImageGeneratorTool } from "./tools/imageGeneration";
import { createImageReaderTool } from "./tools/imageReader";
import { createImageEditorTool } from "./tools/imageEditor";
import { createSheetTool } from "./tools/sheets";
import { createNotionTool } from "./tools/notion";
import { createCalendarTool } from "./tools/calendar";
import { createEmailTool } from "./tools/email";
import { createSlackTool } from "./tools/slack";
import { createDiscordTool } from "./tools/discord";
import { createChartTool } from "./tools/charts";
import { createPostgresTool, createMySQLTool, createMongoDBTool } from "./tools/database";

register({
  nodeRegistry: "model-openai", factory: createModelTool, category: "ai", label: "OpenAI", description: "GPT-4o and GPT-4o-mini models", icon: "openai",
  featured: true,
  credentialRequirement: { providers: ["openai"], authMethods: ["apiKey"] },
  configFields: [{ key: "modelName", label: "Model Name", type: "text", defaultValue: "gpt-4o", required: false }],
});
register({
  nodeRegistry: "model-anthropic", factory: createModelTool, category: "ai", label: "Claude", description: "Claude 3.5 Sonnet and Haiku models", icon: "claude",
  featured: true,
  credentialRequirement: { providers: ["anthropic"], authMethods: ["apiKey"] },
  configFields: [{ key: "modelName", label: "Model Name", type: "text", defaultValue: "claude-3-5-sonnet", required: false }],
});
register({
  nodeRegistry: "model-gemini", factory: createModelTool, category: "ai", label: "Gemini", description: "Gemini 1.5 Pro and Flash models", icon: "gemini",
  featured: true,
  credentialRequirement: { providers: ["gemini"], authMethods: ["apiKey"] },
  configFields: [{ key: "modelName", label: "Model Name", type: "text", defaultValue: "gemini-1.5-pro", required: false }],
});
register({
  nodeRegistry: "model-deepseek", factory: createModelTool, category: "ai", label: "DeepSeek", description: "DeepSeek Chat and Coder models", icon: "deepseek",
  credentialRequirement: { providers: ["deepseek"], authMethods: ["apiKey"] },
  configFields: [{ key: "modelName", label: "Model Name", type: "text", defaultValue: "deepseek-chat", required: false }],
});
register({
  nodeRegistry: "model-mistral", factory: createModelTool, category: "ai", label: "Mistral", description: "Mistral Large and Small models", icon: "mistral",
  credentialRequirement: { providers: ["mistral"], authMethods: ["apiKey"] },
  configFields: [{ key: "modelName", label: "Model Name", type: "text", defaultValue: "mistral-large", required: false }],
});
register({
  nodeRegistry: "memory", factory: createMemoryTool, category: "storage", label: "Redis", description: "Redis-backed persistent key-value store with TTL support", icon: "redis",
  featured: true,
  credentialRequirement: { providers: ["redis"], authMethods: ["connectionString"] },
  configFields: [],
});

register({
  nodeRegistry: "embedding", factory: createEmbeddingTool, category: "ai", label: "Embedding", description: "Convert text to vector embeddings", icon: "vector",
  credentialRequirement: { providers: ["openai"], authMethods: ["apiKey"] },
});

register({
  nodeRegistry: "vectorDB", factory: createVectorDBTool, category: "storage", label: "Pinecone", description: "Query, upsert, or delete vectors in a Pinecone index", icon: "pinecone",
  credentialRequirement: { providers: ["pinecone"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "imageGenerator", factory: createImageGeneratorTool, category: "ai", label: "Image Generator", description: "Generate images with DALL-E 3", icon: "image",
  credentialRequirement: { providers: ["openai"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "imageReader", factory: createImageReaderTool, category: "ai", label: "Image Reader", description: "Analyze images with GPT-4o vision", icon: "eye",
  credentialRequirement: { providers: ["bluesmind"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "imageEditor", factory: createImageEditorTool, category: "ai", label: "Image Editor", description: "Edit images with DALL-E 2 inpainting", icon: "edit",
  credentialRequirement: { providers: ["openai"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "sheet", factory: createSheetTool, category: "integration", label: "Sheet", description: "Read or write data to Google Sheets", icon: "table",
  credentialRequirement: { providers: ["google-sheets"], authMethods: ["apiKey", "serviceAccount"] },
  configFields: [],
});

register({
  nodeRegistry: "calendarEvent", factory: createCalendarTool, category: "integration", label: "Calendar", description: "Create Google Calendar events with configurable defaults", icon: "calendar",
  credentialRequirement: { providers: ["google-calendar"], authMethods: ["serviceAccount"] },
  configFields: [],
});

register({
  nodeRegistry: "notion", factory: createNotionTool, category: "integration", label: "Notion", description: "Query, create, update, and retrieve Notion pages and databases", icon: "notion",
  credentialRequirement: { providers: ["notion"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "discord", factory: createDiscordTool, category: "communication", label: "Discord", description: "Execute Discord Bot API actions across 17 categories: messages, channels, threads, guilds, roles, webhooks, and more", icon: "discord",
  credentialRequirement: { providers: ["discord"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "sendMail", factory: createEmailTool, category: "communication", label: "Send Mail", description: "Send emails via SMTP", icon: "mail",
  featured: true,
  credentialRequirement: { providers: ["smtp"], authMethods: ["smtp"] },
});

register({
  nodeRegistry: "chart", factory: createChartTool, category: "utility", label: "Chart", description: "Generate pie/line charts via QuickChart", icon: "bar-chart",
  configFields: [],
});

register({
  nodeRegistry: "slack", factory: createSlackTool, category: "communication", label: "Slack", description: "Send, update, delete, and retrieve Slack messages, reactions, pins, conversations, users, files, bookmarks, canvases, and search", icon: "slack",
  credentialRequirement: { providers: ["slack"], authMethods: ["apiKey"] },
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
  featured: true,
  credentialRequirement: { providers: ["postgres"], authMethods: ["userPassword"] },
  configFields: [],
});

register({
  nodeRegistry: "mysqlDB", factory: createMySQLTool, category: "storage", label: "MySQL", description: "Query a MySQL database with your credentials", icon: "database",
  credentialRequirement: { providers: ["mysql"], authMethods: ["userPassword"] },
  configFields: [],
});

register({
  nodeRegistry: "mongoDB", factory: createMongoDBTool, category: "storage", label: "MongoDB", description: "Query a MongoDB database with your connection URI", icon: "database",
  credentialRequirement: { providers: ["mongodb"], authMethods: ["connectionString"] },
  configFields: [],
});

export { register, build, list, getRegistration } from "./registry";
export type { ToolFactory, ToolRegistration, ToolCategory, CredentialRequirement } from "./types";
