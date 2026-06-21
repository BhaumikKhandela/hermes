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
  featured: true,
  credentialRequirement: { providers: ["openai", "anthropic", "gemini"], authMethods: ["apiKey"] },
  configFields: [
    { key: "modelName", label: "Model", type: "text", placeholder: "gpt-4o", required: false },
  ],
});

register({
  nodeRegistry: "search", factory: createSearchTool, category: "data", label: "Search", description: "Google Custom Search web search", icon: "search",
  featured: true,
  credentialRequirement: { providers: ["google"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "webscraper", factory: createWebscraperTool, category: "data", label: "Web Scraper", description: "Scrape web pages with Firecrawl", icon: "globe",
  credentialRequirement: { providers: ["firecrawl"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "memory", factory: createMemoryTool, category: "storage", label: "Memory", description: "Persistent key-value memory store", icon: "database",
  featured: true,
  configFields: [],
});

register({
  nodeRegistry: "embedding", factory: createEmbeddingTool, category: "ai", label: "Embedding", description: "Convert text to vector embeddings", icon: "vector",
  credentialRequirement: { providers: ["openai"], authMethods: ["apiKey"] },
  configFields: [
    { key: "modelName", label: "Model", type: "text", placeholder: "text-embedding-3-small", required: false },
  ],
});

register({
  nodeRegistry: "vectorDB", factory: createVectorDBTool, category: "storage", label: "Vector DB", description: "Query and upsert Pinecone vectors", icon: "layers",
  credentialRequirement: { providers: ["pinecone"], authMethods: ["apiKey"] },
  configFields: [],
});

register({
  nodeRegistry: "retriever", factory: createRetrieverTool, category: "data", label: "Retriever", description: "Semantic document retrieval", icon: "file-text",
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
  nodeRegistry: "sheet", factory: createSheetTool, category: "integration", label: "Sheet", description: "Write data to Google Sheets", icon: "table",
  credentialRequirement: { providers: ["google-sheets"], authMethods: ["apiKey", "serviceAccount"] },
  configFields: [
    { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE", required: true },
    { key: "range", label: "Range", type: "text", placeholder: "Sheet1!A1:A10", required: true },
  ],
});

register({
  nodeRegistry: "readSheet", factory: createReadSheetTool, category: "integration", label: "Read Sheet", description: "Read data from Google Sheets", icon: "table",
  credentialRequirement: { providers: ["google-sheets"], authMethods: ["apiKey", "serviceAccount"] },
  configFields: [
    { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE", required: true },
    { key: "range", label: "Range", type: "text", placeholder: "Sheet1!A1:B10", required: true },
  ],
});

register({
  nodeRegistry: "calendarEvent", factory: createCalendarTool, category: "integration", label: "Calendar", description: "Create Google Calendar events", icon: "calendar",
  credentialRequirement: { providers: ["google-calendar"], authMethods: ["serviceAccount"] },
  configFields: [
    { key: "summary", label: "Default Summary", type: "text", placeholder: "Meeting", required: false },
  ],
});

register({
  nodeRegistry: "sendMail", factory: createEmailTool, category: "communication", label: "Send Mail", description: "Send emails via SMTP", icon: "mail",
  featured: true,
  credentialRequirement: { providers: ["smtp"], authMethods: ["smtp"] },
  configFields: [
    { key: "to", label: "Default Recipient", type: "text", placeholder: "user@example.com", required: false },
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
