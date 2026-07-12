import { REST } from "@discordjs/rest";
import { DiscordAPIError } from "@discordjs/rest";

export function createDiscordClient(config?: Record<string, any>, action?: string): REST {
  const apiKey = config?.apiKey;
  if (!apiKey) {
    const ctx = action ? `Discord ${action}` : "Discord tool";
    throw new Error(`${ctx} requires a Discord bot credential with a valid Bot Token.`);
  }
  return new REST({ version: "10" }).setToken(apiKey);
}

export function createWebhookClient(config?: Record<string, any>, action?: string): REST {
  const webhookId = config?.webhookId;
  const webhookToken = config?.webhookToken;
  if (!webhookId || !webhookToken) {
    const ctx = action ? `Discord ${action}` : "Discord webhook action";
    throw new Error(`${ctx} requires a Discord Webhook credential with Webhook ID and Webhook Token.`);
  }
  return new REST({ version: "10" });
}

export function createWebhookContext(
  config?: Record<string, any>,
  action?: string,
): { rest: REST; webhookId: string; webhookToken: string } {
  const rest = createWebhookClient(config, action);
  return { rest, webhookId: config!.webhookId!, webhookToken: config!.webhookToken! };
}

export function handleDiscordError(action: string, error: unknown): never {
  if (error instanceof DiscordAPIError) {
    const code = (error as any).code ?? "unknown";
    const status = (error as any).status ?? 0;
    const message = (error as any).message ?? "Unknown error";
    throw new Error(`Discord ${action}: ${status} ${message} [${code}]`);
  }
  if (error instanceof Error) {
    throw new Error(`Discord ${action}: ${error.message}`);
  }
  throw error;
}
