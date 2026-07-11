const ICON_MAP: Record<string, string> = {
  "brain": "/icons/brain.png",
  "search": "/icons/search.png",
  "globe": "/icons/globe.svg",
  "database": "/icons/db.png",
  "vector": "/icons/embedding.png",
  "file-text": "/icons/read_file.png",
  "image": "/icons/pic.png",
  "edit": "/icons/edit_file.png",
  "table": "/icons/sheet.png",
  "calendar": "/icons/calendar.png",
  "mail": "/icons/message.png",
  "bar-chart": "/icons/chart.png",
  "file": "/icons/file.svg",
  "file-plus": "/icons/write_file.ico",
  "file-edit": "/icons/edit_file.png",
  "eye": "/icons/camera.png",
  "layers": "/icons/default.png",
  "openai": "/icons/openai-icon.svg",
  "claude": "/icons/Claude_Symbol_0.svg",
  "gemini": "/icons/gemini.png",
  "deepseek": "/icons/deepseek-icon.svg",
  "mistral": "/icons/mistral-ai-icon.svg",
  "qwen": "/icons/qwen-icon.svg",
  "kimi": "/icons/kimi.svg",
  "llama": "/icons/meta-icon.svg",
  "crawler": "/icons/crawler.png",
  "gmail": "/icons/gmail.png",
  "pinecone": "/icons/pinecone.png",
  "postgres": "/icons/postgresql-logo-svgrepo-com.svg",
  "mysql": "/icons/mysql-svgrepo-com.svg",
  "mongo": "/icons/mongodb-svgrepo-com.svg",
  "redis": "/icons/redis-logo-svgrepo-com.svg",
  "slack": "/icons/slack.png",
  "discord": "/icons/discord-svgrepo-com.svg",
  "notion": "/icons/notion.png",
};

const DEFAULT_ICON = "/icons/default.png";

const NODE_REGISTRY_ICON_MAP: Record<string, string> = {
  search: "search",
  webscraper: "crawler",
  memory: "redis",
  embedding: "vector",
  vectorDB: "pinecone",
  imageGenerator: "image",
  imageReader: "eye",
  imageEditor: "edit",
  sheet: "table",
  calendarEvent: "calendar",
  sendMail: "gmail",
  chart: "bar-chart",
  readFile: "file",
  writeFile: "file-plus",
  readAndUpdateFile: "file-edit",
  postgresDB: "postgres",
  mysqlDB: "mysql",
  mongoDB: "mongo",
  model: "brain",
  "model-openai": "openai",
  "model-anthropic": "claude",
  "model-gemini": "gemini",
  "model-deepseek": "deepseek",
  "model-mistral": "mistral",
  "model-qwen": "qwen",
  "model-kimi": "kimi",
  "model-meta": "llama",
  slack: "slack",
  discord: "discord",
  notion: "notion",
};

const MODEL_ICON_MAP: Record<string, string> = {
  "openai": "/icons/openai-icon.svg",
  "gemini": "/icons/gemini.png",
  "deepseek": "/icons/deepseek-icon.svg",
  "mistral": "/icons/mistral-ai-icon.svg",
  "qwen": "/icons/qwen-icon.svg",
  "kimi": "/icons/kimi.svg",
  "meta": "/icons/meta-icon.svg",
  "llama": "/icons/meta-icon.svg",
  "claude": "/icons/Claude_Symbol_0.svg",
  "anthropic": "/icons/Claude_Symbol_0.svg",
};

export function resolveToolIcon(nodeRegistry: string): string {
  const iconName = NODE_REGISTRY_ICON_MAP[nodeRegistry];
  return iconName ? (ICON_MAP[iconName] || DEFAULT_ICON) : DEFAULT_ICON;
}

export function resolveModelIcon(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, path] of Object.entries(MODEL_ICON_MAP)) {
    if (lower.includes(key)) return path;
  }
  return "/icons/brain.png";
}
