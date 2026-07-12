import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetChannel(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_channel", "Channel ID");
    const client = createDiscordClient(config, "get_channel");
    const res: any = await client.get(Routes.channel(channelId));
    return { action: "get_channel", data: { channelId, channel: res } };
  } catch (error) { handleDiscordError("get_channel", error); }
}

export async function handleModifyChannel(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "modify_channel", "Channel ID");
    const client = createDiscordClient(config, "modify_channel");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.topic ?? config?.topic) body.topic = input.topic ?? config?.topic;
    if (input.position !== undefined || config?.position !== undefined) body.position = input.position ?? config?.position;
    if (input.nsfw !== undefined || config?.nsfw !== undefined) body.nsfw = input.nsfw ?? config?.nsfw;
    if (input.rateLimitPerUser !== undefined || config?.rateLimitPerUser !== undefined) body.rate_limit_per_user = input.rateLimitPerUser ?? config?.rateLimitPerUser;
    if (input.parentId ?? config?.parentId) body.parent_id = input.parentId ?? config?.parentId;
    const overwrites = parseJSONField(input.permissionOverwrites ?? config?.permissionOverwrites, "permission_overwrites", "modify_channel");
    if (overwrites) body.permission_overwrites = overwrites;
    const res: any = await client.patch(Routes.channel(channelId), { body });
    return { action: "modify_channel", data: { channelId, channel: res } };
  } catch (error) { handleDiscordError("modify_channel", error); }
}

export async function handleDeleteChannel(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "delete_channel", "Channel ID");
    const client = createDiscordClient(config, "delete_channel");
    await client.delete(Routes.channel(channelId));
    return { action: "delete_channel", data: { channelId } };
  } catch (error) { handleDiscordError("delete_channel", error); }
}

export async function handleCreateChannel(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_channel", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_channel", "Name");
    const client = createDiscordClient(config, "create_channel");
    const body: Record<string, any> = { name };
    if (input.type ?? config?.type) body.type = input.type ?? config?.type;
    if (input.topic ?? config?.topic) body.topic = input.topic ?? config?.topic;
    if (input.position !== undefined || config?.position !== undefined) body.position = input.position ?? config?.position;
    if (input.nsfw !== undefined || config?.nsfw !== undefined) body.nsfw = input.nsfw ?? config?.nsfw;
    if (input.rateLimitPerUser !== undefined || config?.rateLimitPerUser !== undefined) body.rate_limit_per_user = input.rateLimitPerUser ?? config?.rateLimitPerUser;
    if (input.parentId ?? config?.parentId) body.parent_id = input.parentId ?? config?.parentId;
    const overwrites = parseJSONField(input.permissionOverwrites ?? config?.permissionOverwrites, "permission_overwrites", "create_channel");
    if (overwrites) body.permission_overwrites = overwrites;
    const res: any = await client.post(Routes.guildChannels(guildId), { body });
    return { action: "create_channel", data: { guildId, channelId: res.id as string, channel: res } };
  } catch (error) { handleDiscordError("create_channel", error); }
}

export async function handleListChannels(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "list_channels", "Guild ID");
    const client = createDiscordClient(config, "list_channels");
    const res: any = await client.get(Routes.guildChannels(guildId));
    const channels: any[] = Array.isArray(res) ? res : [];
    return { action: "list_channels", data: { guildId, channels } };
  } catch (error) { handleDiscordError("list_channels", error); }
}

export async function handleFollowChannel(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "follow_channel", "Channel ID");
    const webhookChannelId = requireField(input.webhookChannelId ?? config?.webhookChannelId, "follow_channel", "Webhook Channel ID");
    const client = createDiscordClient(config, "follow_channel");
    const res: any = await client.post(Routes.channelFollowers(channelId), { body: { webhook_channel_id: webhookChannelId } });
    return { action: "follow_channel", data: { channelId, webhookId: res.webhook_id as string } };
  } catch (error) { handleDiscordError("follow_channel", error); }
}
