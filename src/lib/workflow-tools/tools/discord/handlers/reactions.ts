import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleAddReaction(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "add_reaction", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "add_reaction", "Message ID");
    const emoji = requireField(input.emoji ?? config?.emoji, "add_reaction", "Emoji");
    const client = createDiscordClient(config, "add_reaction");
    await client.put(Routes.channelMessageOwnReaction(channelId, messageId, encodeURIComponent(emoji)));
    return { action: "add_reaction", data: { channelId, messageId, emoji } };
  } catch (error) {
    handleDiscordError("add_reaction", error);
  }
}

export async function handleRemoveReaction(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "remove_reaction", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "remove_reaction", "Message ID");
    const emoji = requireField(input.emoji ?? config?.emoji, "remove_reaction", "Emoji");
    const client = createDiscordClient(config, "remove_reaction");
    await client.delete(Routes.channelMessageOwnReaction(channelId, messageId, encodeURIComponent(emoji)));
    return { action: "remove_reaction", data: { channelId, messageId, emoji } };
  } catch (error) {
    handleDiscordError("remove_reaction", error);
  }
}

export async function handleRemoveUserReaction(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "remove_user_reaction", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "remove_user_reaction", "Message ID");
    const emoji = requireField(input.emoji ?? config?.emoji, "remove_user_reaction", "Emoji");
    const userId = requireField(input.userId ?? config?.userId, "remove_user_reaction", "User ID");
    const client = createDiscordClient(config, "remove_user_reaction");
    await client.delete(Routes.channelMessageUserReaction(channelId, messageId, encodeURIComponent(emoji), userId));
    return { action: "remove_user_reaction", data: { channelId, messageId, emoji, userId } };
  } catch (error) {
    handleDiscordError("remove_user_reaction", error);
  }
}

export async function handleGetReactions(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_reactions", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "get_reactions", "Message ID");
    const emoji = requireField(input.emoji ?? config?.emoji, "get_reactions", "Emoji");
    const limit = Math.min(input.limit ?? config?.limit ?? 25, 100);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "get_reactions");
    if (returnAll) {
      const { items } = await paginateAfter<any>(
        client,
        (a) => Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emoji)),
        (r) => r as any[] ?? [],
        limit,
        maxItems,
        input.after ?? config?.after,
      );
      return { action: "get_reactions", data: { channelId, messageId, emoji, users: items } };
    }
    const res: any = await client.get(Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emoji)));
    const users: any[] = Array.isArray(res) ? res : [];
    return { action: "get_reactions", data: { channelId, messageId, emoji, users } };
  } catch (error) {
    handleDiscordError("get_reactions", error);
  }
}

export async function handleClearReactions(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "clear_reactions", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "clear_reactions", "Message ID");
    const client = createDiscordClient(config, "clear_reactions");
    await client.delete(Routes.channelMessageAllReactions(channelId, messageId));
    return { action: "clear_reactions", data: { channelId, messageId } };
  } catch (error) {
    handleDiscordError("clear_reactions", error);
  }
}

export async function handleClearReactionEmoji(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "clear_reaction_emoji", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "clear_reaction_emoji", "Message ID");
    const emoji = requireField(input.emoji ?? config?.emoji, "clear_reaction_emoji", "Emoji");
    const client = createDiscordClient(config, "clear_reaction_emoji");
    await client.delete(Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emoji)));
    return { action: "clear_reaction_emoji", data: { channelId, messageId, emoji } };
  } catch (error) {
    handleDiscordError("clear_reaction_emoji", error);
  }
}
