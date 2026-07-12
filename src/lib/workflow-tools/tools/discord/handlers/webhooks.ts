import { Routes } from "discord-api-types/v10";
import { createDiscordClient, createWebhookClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetChannelWebhooks(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_channel_webhooks", "Channel ID");
    const client = createDiscordClient(config, "get_channel_webhooks");
    const res: any = await client.get(Routes.channelWebhooks(channelId));
    return { action: "get_channel_webhooks", data: { channelId, webhooks: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_channel_webhooks", error); }
}

export async function handleGetGuildWebhooks(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_webhooks", "Guild ID");
    const client = createDiscordClient(config, "get_guild_webhooks");
    const res: any = await client.get(Routes.guildWebhooks(guildId));
    return { action: "get_guild_webhooks", data: { guildId, webhooks: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_guild_webhooks", error); }
}

export async function handleCreateWebhook(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "create_webhook", "Channel ID");
    const client = createDiscordClient(config, "create_webhook");
    const body: Record<string, any> = { name: input.name ?? config?.name ?? "Webhook" };
    if (input.avatar ?? config?.avatar) body.avatar = input.avatar ?? config?.avatar;
    const res: any = await client.post(Routes.channelWebhooks(channelId), { body });
    return { action: "create_webhook", data: { channelId, webhookId: res.id as string, webhook: res } };
  } catch (error) { handleDiscordError("create_webhook", error); }
}

export async function handleModifyWebhook(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const webhookId = requireField(input.webhookId ?? config?.webhookId, "modify_webhook", "Webhook ID");
    const client = createDiscordClient(config, "modify_webhook");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.avatar ?? config?.avatar) body.avatar = input.avatar ?? config?.avatar;
    if (input.channelId ?? config?.channelId) body.channel_id = input.channelId ?? config?.channelId;
    const res: any = await client.patch(Routes.webhook(webhookId), { body });
    return { action: "modify_webhook", data: { webhookId, webhook: res } };
  } catch (error) { handleDiscordError("modify_webhook", error); }
}

export async function handleDeleteWebhook(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const webhookId = requireField(input.webhookId ?? config?.webhookId, "delete_webhook", "Webhook ID");
    const client = createDiscordClient(config, "delete_webhook");
    await client.delete(Routes.webhook(webhookId));
    return { action: "delete_webhook", data: { webhookId } };
  } catch (error) { handleDiscordError("delete_webhook", error); }
}

export async function handleExecuteWebhook(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const webhookId = requireField(input.webhookId ?? config?.webhookId, "execute_webhook", "Webhook ID");
    const webhookToken = requireField(input.webhookToken ?? config?.webhookToken, "execute_webhook", "Webhook Token");
    const client = createWebhookClient(config, "execute_webhook");
    const body: Record<string, any> = {};
    if (input.content ?? config?.content) body.content = input.content ?? config?.content;
    if (input.username ?? config?.username) body.username = input.username ?? config?.username;
    if (input.avatarUrl ?? config?.avatarUrl) body.avatar_url = input.avatarUrl ?? config?.avatarUrl;
    if (input.tts !== undefined || config?.tts !== undefined) body.tts = input.tts ?? config?.tts;
    const embeds = parseJSONField(input.embeds ?? config?.embeds, "embeds", "execute_webhook");
    if (embeds) body.embeds = embeds;
    const allowedMentions = parseJSONField(input.allowedMentions ?? config?.allowedMentions, "allowed_mentions", "execute_webhook");
    if (allowedMentions) body.allowed_mentions = allowedMentions;
    const components = parseJSONField(input.components ?? config?.components, "components", "execute_webhook");
    if (components) body.components = components;
    const files = parseJSONField(input.files ?? config?.files, "files", "execute_webhook");
    if (files) body.files = files;
    const wait = input.wait ?? config?.wait ?? false;
    const query = wait ? "?wait=true" : "";
    const res: any = await client.post(`${Routes.webhook(webhookId, webhookToken)}${query}`, { body, auth: false });
    return { action: "execute_webhook", data: { webhookId, result: wait ? res : { success: true } } };
  } catch (error) { handleDiscordError("execute_webhook", error); }
}
