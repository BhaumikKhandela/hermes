import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetEmojis(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_emojis", "Guild ID");
    const client = createDiscordClient(config, "get_emojis");
    const res: any = await client.get(Routes.guildEmojis(guildId));
    return { action: "get_emojis", data: { guildId, emojis: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_emojis", error); }
}

export async function handleGetEmoji(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_emoji", "Guild ID");
    const emojiId = requireField(input.emojiId ?? config?.emojiId, "get_emoji", "Emoji ID");
    const client = createDiscordClient(config, "get_emoji");
    const res: any = await client.get(Routes.guildEmoji(guildId, emojiId));
    return { action: "get_emoji", data: { guildId, emojiId, emoji: res } };
  } catch (error) { handleDiscordError("get_emoji", error); }
}

export async function handleCreateEmoji(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_emoji", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_emoji", "Name");
    const image = requireField(input.image ?? config?.image, "create_emoji", "Image (data URI)");
    const client = createDiscordClient(config, "create_emoji");
    const body: Record<string, any> = { name, image };
    if (input.roles ?? config?.roles) body.roles = (input.roles ?? config?.roles).split(",").map((s: string) => s.trim());
    const res: any = await client.post(Routes.guildEmojis(guildId), { body });
    return { action: "create_emoji", data: { guildId, emojiId: res.id as string, emoji: res } };
  } catch (error) { handleDiscordError("create_emoji", error); }
}

export async function handleModifyEmoji(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_emoji", "Guild ID");
    const emojiId = requireField(input.emojiId ?? config?.emojiId, "modify_emoji", "Emoji ID");
    const client = createDiscordClient(config, "modify_emoji");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.roles ?? config?.roles) body.roles = (input.roles ?? config?.roles).split(",").map((s: string) => s.trim());
    const res: any = await client.patch(Routes.guildEmoji(guildId, emojiId), { body });
    return { action: "modify_emoji", data: { guildId, emojiId, emoji: res } };
  } catch (error) { handleDiscordError("modify_emoji", error); }
}

export async function handleDeleteEmoji(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "delete_emoji", "Guild ID");
    const emojiId = requireField(input.emojiId ?? config?.emojiId, "delete_emoji", "Emoji ID");
    const client = createDiscordClient(config, "delete_emoji");
    await client.delete(Routes.guildEmoji(guildId, emojiId));
    return { action: "delete_emoji", data: { guildId, emojiId } };
  } catch (error) { handleDiscordError("delete_emoji", error); }
}
