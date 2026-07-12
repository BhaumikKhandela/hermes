import { Routes } from "discord-api-types/v10";
import type { RESTPostAPIChannelMessageJSONBody, RESTPatchAPIChannelMessageJSONBody, RESTGetAPIChannelMessagesQuery } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, parseStickerIds, validateMessageComponents, validateMessageEmbeds, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleSendMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "send_message", "Channel ID");
    const client = createDiscordClient(config, "send_message");
    const body: RESTPostAPIChannelMessageJSONBody = {};
    if (input.content ?? config?.content) body.content = input.content ?? config?.content;
    if (input.tts !== undefined || config?.tts !== undefined) body.tts = input.tts ?? config?.tts;
    const embeds = validateMessageEmbeds(input.embeds ?? config?.embeds);
    if (embeds) body.embeds = embeds;
    const allowedMentions = parseJSONField(input.allowedMentions ?? config?.allowedMentions, "allowed_mentions", "send_message");
    if (allowedMentions) body.allowed_mentions = allowedMentions;
    const messageRef = parseJSONField(input.messageReference ?? config?.messageReference, "message_reference", "send_message");
    if (messageRef) body.message_reference = messageRef;
    const components = validateMessageComponents(input.components ?? config?.components);
    if (components) body.components = components;
    const stickerIds = parseStickerIds(input.stickerIds ?? config?.stickerIds);
    if (stickerIds) body.sticker_ids = stickerIds as any;
    const poll = parseJSONField(input.poll ?? config?.poll, "poll", "send_message");
    if (poll) body.poll = poll;
    if (input.flags ?? config?.flags) body.flags = input.flags ?? config?.flags;
    if (input.nonce ?? config?.nonce) body.nonce = input.nonce ?? config?.nonce;
    if (input.enforceNonce ?? config?.enforceNonce) body.enforce_nonce = input.enforceNonce ?? config?.enforceNonce;
    const res: any = await client.post(Routes.channelMessages(channelId), { body });
    return { action: "send_message", data: { channelId, messageId: res.id as string, message: res } };
  } catch (error) {
    handleDiscordError("send_message", error);
  }
}

export async function handleGetMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "get_message", "Message ID");
    const client = createDiscordClient(config, "get_message");
    const res: any = await client.get(Routes.channelMessage(channelId, messageId));
    return { action: "get_message", data: { channelId, messageId, message: res } };
  } catch (error) {
    handleDiscordError("get_message", error);
  }
}

export async function handleEditMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "edit_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "edit_message", "Message ID");
    const client = createDiscordClient(config, "edit_message");
    const body: Record<string, any> = {};
    if ("content" in (input ?? {})) { body.content = input.content; }
    else if (config && "content" in config) { body.content = config.content; }
    if ("embeds" in (input ?? {})) { body.embeds = input.embeds !== null && input.embeds !== undefined ? validateMessageEmbeds(input.embeds) : null; }
    else if (config && "embeds" in config) { body.embeds = config.embeds !== null && config.embeds !== undefined ? validateMessageEmbeds(config.embeds) : null; }
    if ("components" in (input ?? {})) { body.components = input.components !== null && input.components !== undefined ? validateMessageComponents(input.components) : null; }
    else if (config && "components" in config) { body.components = config.components !== null && config.components !== undefined ? validateMessageComponents(config.components) : null; }
    if ("allowedMentions" in (input ?? {})) { body.allowed_mentions = input.allowedMentions !== null ? parseJSONField(input.allowedMentions, "allowed_mentions", "edit_message") : null; }
    else if (config && "allowedMentions" in config) { body.allowed_mentions = config.allowedMentions !== null ? parseJSONField(config.allowedMentions, "allowed_mentions", "edit_message") : null; }
    if (input.flags ?? config?.flags) body.flags = input.flags ?? config?.flags;
    const res: any = await client.patch(Routes.channelMessage(channelId, messageId), { body });
    return { action: "edit_message", data: { channelId, messageId, message: res } };
  } catch (error) {
    handleDiscordError("edit_message", error);
  }
}

export async function handleDeleteMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "delete_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "delete_message", "Message ID");
    const client = createDiscordClient(config, "delete_message");
    await client.delete(Routes.channelMessage(channelId, messageId));
    return { action: "delete_message", data: { channelId, messageId } };
  } catch (error) {
    handleDiscordError("delete_message", error);
  }
}

export async function handleBulkDeleteMessages(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "bulk_delete_messages", "Channel ID");
    const raw = input.messageIds ?? config?.messageIds ?? "";
    const ids: string[] = typeof raw === "string" ? raw.split(",").map((s: string) => s.trim()).filter(Boolean) : raw;
    if (ids.length < 2 || ids.length > 100) throw new Error("Discord bulk_delete_messages: must provide between 2 and 100 message IDs.");
    const client = createDiscordClient(config, "bulk_delete_messages");
    await client.post(Routes.channelBulkDelete(channelId), { body: { messages: ids } });
    return { action: "bulk_delete_messages", data: { channelId, count: ids.length } };
  } catch (error) {
    handleDiscordError("bulk_delete_messages", error);
  }
}

export async function handleListChannelMessages(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_channel_messages", "Channel ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 50, 100);
    const before = input.before ?? config?.before;
    const after = input.after ?? config?.after;
    const around = input.around ?? config?.around;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "list_channel_messages");
    if (returnAll && !around) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.channelMessages(channelId),
        (r) => r as any[] ?? [],
        limit,
        maxItems,
        after || before,
      );
      return { action: "list_channel_messages", data: { channelId, messages: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (before) query.before = before;
    if (after) query.after = after;
    if (around) query.around = around;
    const res: any = await client.get(Routes.channelMessages(channelId), { query: new URLSearchParams(query) });
    const messages: any[] = Array.isArray(res) ? res : [];
    return { action: "list_channel_messages", data: { channelId, messages, hasMore: messages.length >= limit } };
  } catch (error) {
    handleDiscordError("list_channel_messages", error);
  }
}

export async function handleCrosspostMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "crosspost_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "crosspost_message", "Message ID");
    const client = createDiscordClient(config, "crosspost_message");
    const res: any = await client.post(Routes.channelMessageCrosspost(channelId, messageId));
    return { action: "crosspost_message", data: { channelId, messageId, message: res } };
  } catch (error) {
    handleDiscordError("crosspost_message", error);
  }
}

export async function handlePinMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "pin_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "pin_message", "Message ID");
    const client = createDiscordClient(config, "pin_message");
    await client.put(Routes.channelPin(channelId, messageId));
    return { action: "pin_message", data: { channelId, messageId } };
  } catch (error) {
    handleDiscordError("pin_message", error);
  }
}

export async function handleUnpinMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "unpin_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "unpin_message", "Message ID");
    const client = createDiscordClient(config, "unpin_message");
    await client.delete(Routes.channelPin(channelId, messageId));
    return { action: "unpin_message", data: { channelId, messageId } };
  } catch (error) {
    handleDiscordError("unpin_message", error);
  }
}

export async function handleListPinnedMessages(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_pinned_messages", "Channel ID");
    const client = createDiscordClient(config, "list_pinned_messages");
    const res: any = await client.get(Routes.channelPins(channelId));
    const messages: any[] = Array.isArray(res) ? res : [];
    return { action: "list_pinned_messages", data: { channelId, messages } };
  } catch (error) {
    handleDiscordError("list_pinned_messages", error);
  }
}
