import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetStickers(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_stickers", "Guild ID");
    const client = createDiscordClient(config, "get_stickers");
    const res: any = await client.get(Routes.guildStickers(guildId));
    return { action: "get_stickers", data: { guildId, stickers: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_stickers", error); }
}

export async function handleGetSticker(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const stickerId = requireField(input.stickerId ?? config?.stickerId, "get_sticker", "Sticker ID");
    const client = createDiscordClient(config, "get_sticker");
    const res: any = await client.get(Routes.sticker(stickerId));
    return { action: "get_sticker", data: { stickerId, sticker: res } };
  } catch (error) { handleDiscordError("get_sticker", error); }
}

export async function handleCreateSticker(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_sticker", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_sticker", "Name");
    const description = input.description ?? config?.description ?? "";
    const tags = requireField(input.tags ?? config?.tags, "create_sticker", "Tags (emoji)");
    const file = requireField(input.file ?? config?.file, "create_sticker", "File (data URI)");
    const client = createDiscordClient(config, "create_sticker");
    // Use multipart form upload for stickers
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("tags", tags);
    form.append("file", Buffer.from(file.split(",")[1] ?? file, "base64"), { filename: "sticker.png" });
    const res: any = await client.post(Routes.guildStickers(guildId), { body: form, headers: { "Content-Type": "multipart/form-data" } });
    return { action: "create_sticker", data: { guildId, stickerId: res.id as string, sticker: res } };
  } catch (error) { handleDiscordError("create_sticker", error); }
}

export async function handleModifySticker(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_sticker", "Guild ID");
    const stickerId = requireField(input.stickerId ?? config?.stickerId, "modify_sticker", "Sticker ID");
    const client = createDiscordClient(config, "modify_sticker");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.description !== undefined) body.description = input.description ?? config?.description ?? "";
    if (input.tags ?? config?.tags) body.tags = input.tags ?? config?.tags;
    const res: any = await client.patch(Routes.guildSticker(guildId, stickerId), { body });
    return { action: "modify_sticker", data: { guildId, stickerId, sticker: res } };
  } catch (error) { handleDiscordError("modify_sticker", error); }
}

export async function handleDeleteSticker(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "delete_sticker", "Guild ID");
    const stickerId = requireField(input.stickerId ?? config?.stickerId, "delete_sticker", "Sticker ID");
    const client = createDiscordClient(config, "delete_sticker");
    await client.delete(Routes.guildSticker(guildId, stickerId));
    return { action: "delete_sticker", data: { guildId, stickerId } };
  } catch (error) { handleDiscordError("delete_sticker", error); }
}
