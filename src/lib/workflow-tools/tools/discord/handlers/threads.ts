import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, validateMessageComponents, parseStickerIds, paginateArchivedThreads } from "../utils";
import type { DiscordToolResult } from "../types";

/** Unified create_thread: dispatches to start-from-message, start-without-message, or forum based on input. */
export async function handleCreateThread(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  const channelId = requireField(input.channelId ?? config?.channelId, "create_thread", "Channel ID");
  const name = requireField(input.name ?? config?.name, "create_thread", "Name");
  if (input.messageId) {
    return handleStartThreadFromMessage(input, config);
  }
  if (input.appliedTags) {
    return handleCreateForumThread(input, config);
  }
  return handleStartThreadWithoutMessage(input, config);
}

export async function handleStartThreadFromMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "start_thread_from_message", "Channel ID");
    const messageId = requireField(input.messageId ?? config?.messageId, "start_thread_from_message", "Message ID");
    const name = requireField(input.name ?? config?.name, "start_thread_from_message", "Name");
    const client = createDiscordClient(config, "start_thread_from_message");
    const body: Record<string, any> = { name };
    if (input.autoArchiveDuration ?? config?.autoArchiveDuration) body.auto_archive_duration = input.autoArchiveDuration ?? config?.autoArchiveDuration;
    if (input.rateLimitPerUser !== undefined || config?.rateLimitPerUser !== undefined) body.rate_limit_per_user = input.rateLimitPerUser ?? config?.rateLimitPerUser;
    const res: any = await client.post(Routes.threads(channelId, messageId), { body });
    return { action: "start_thread_from_message", data: { channelId, threadId: res.id as string, thread: res } };
  } catch (error) { handleDiscordError("start_thread_from_message", error); }
}

export async function handleStartThreadWithoutMessage(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "start_thread_without_message", "Channel ID");
    const name = requireField(input.name ?? config?.name, "start_thread_without_message", "Name");
    const client = createDiscordClient(config, "start_thread_without_message");
    const body: Record<string, any> = { name };
    if (input.autoArchiveDuration ?? config?.autoArchiveDuration) body.auto_archive_duration = input.autoArchiveDuration ?? config?.autoArchiveDuration;
    if (input.type ?? config?.type) body.type = input.type ?? config?.type;
    if (input.invitable !== undefined || config?.invitable !== undefined) body.invitable = input.invitable ?? config?.invitable;
    if (input.rateLimitPerUser !== undefined || config?.rateLimitPerUser !== undefined) body.rate_limit_per_user = input.rateLimitPerUser ?? config?.rateLimitPerUser;
    const res: any = await client.post(Routes.threads(channelId), { body });
    return { action: "start_thread_without_message", data: { channelId, threadId: res.id as string, thread: res } };
  } catch (error) { handleDiscordError("start_thread_without_message", error); }
}

export async function handleCreateForumThread(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "create_forum_thread", "Channel ID");
    const name = requireField(input.name ?? config?.name, "create_forum_thread", "Name");
    const client = createDiscordClient(config, "create_forum_thread");
    const message: Record<string, any> = {};
    if (input.content ?? config?.content) message.content = input.content ?? config?.content;
    const embeds = parseJSONField(input.embeds ?? config?.embeds, "embeds", "create_forum_thread");
    if (embeds) message.embeds = embeds;
    const components = validateMessageComponents(input.components ?? config?.components);
    if (components) message.components = components;
    const allowedMentions = parseJSONField(input.allowedMentions ?? config?.allowedMentions, "allowed_mentions", "create_forum_thread");
    if (allowedMentions) message.allowed_mentions = allowedMentions;
    const messageRef = parseJSONField(input.messageReference ?? config?.messageReference, "message_reference", "create_forum_thread");
    if (messageRef) message.message_reference = messageRef;
    const stickerIds = parseStickerIds(input.stickerIds ?? config?.stickerIds);
    if (stickerIds) message.sticker_ids = stickerIds;
    const body: Record<string, any> = { name, message };
    if (input.autoArchiveDuration ?? config?.autoArchiveDuration) body.auto_archive_duration = input.autoArchiveDuration ?? config?.autoArchiveDuration;
    if (input.appliedTags ?? config?.appliedTags) {
      body.applied_tags = (input.appliedTags ?? config?.appliedTags).split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (input.rateLimitPerUser !== undefined || config?.rateLimitPerUser !== undefined) body.rate_limit_per_user = input.rateLimitPerUser ?? config?.rateLimitPerUser;
    const res: any = await client.post(Routes.threads(channelId), { body });
    return { action: "create_forum_thread", data: { channelId, threadId: res.id as string, thread: res } };
  } catch (error) { handleDiscordError("create_forum_thread", error); }
}

export async function handleJoinThread(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "join_thread", "Thread ID");
    const client = createDiscordClient(config, "join_thread");
    await client.put(Routes.threadMembers(threadId, "@me"));
    return { action: "join_thread", data: { threadId } };
  } catch (error) { handleDiscordError("join_thread", error); }
}

export async function handleLeaveThread(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "leave_thread", "Thread ID");
    const client = createDiscordClient(config, "leave_thread");
    await client.delete(Routes.threadMembers(threadId, "@me"));
    return { action: "leave_thread", data: { threadId } };
  } catch (error) { handleDiscordError("leave_thread", error); }
}

export async function handleAddThreadMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "add_thread_member", "Thread ID");
    const userId = requireField(input.userId ?? config?.userId, "add_thread_member", "User ID");
    const client = createDiscordClient(config, "add_thread_member");
    await client.put(Routes.threadMembers(threadId, userId));
    return { action: "add_thread_member", data: { threadId, userId } };
  } catch (error) { handleDiscordError("add_thread_member", error); }
}

export async function handleRemoveThreadMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "remove_thread_member", "Thread ID");
    const userId = requireField(input.userId ?? config?.userId, "remove_thread_member", "User ID");
    const client = createDiscordClient(config, "remove_thread_member");
    await client.delete(Routes.threadMembers(threadId, userId));
    return { action: "remove_thread_member", data: { threadId, userId } };
  } catch (error) { handleDiscordError("remove_thread_member", error); }
}

export async function handleGetThreadMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "get_thread_member", "Thread ID");
    const userId = requireField(input.userId ?? config?.userId, "get_thread_member", "User ID");
    const client = createDiscordClient(config, "get_thread_member");
    const res: any = await client.get(Routes.threadMembers(threadId, userId));
    return { action: "get_thread_member", data: { threadId, userId, member: res ?? null } };
  } catch (error) { handleDiscordError("get_thread_member", error); }
}

export async function handleListThreadMembers(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const threadId = requireField(input.threadId ?? config?.threadId ?? input.channelId ?? config?.channelId, "list_thread_members", "Thread ID");
    const client = createDiscordClient(config, "list_thread_members");
    const res: any = await client.get(Routes.threadMembers(threadId));
    const members: any[] = Array.isArray(res) ? res : [];
    return { action: "list_thread_members", data: { threadId, members } };
  } catch (error) { handleDiscordError("list_thread_members", error); }
}

export async function handleListActiveThreads(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "list_active_threads", "Guild ID");
    const client = createDiscordClient(config, "list_active_threads");
    const res: any = await client.get(Routes.guildActiveThreads(guildId));
    return { action: "list_active_threads", data: { guildId, threads: res.threads ?? [] } };
  } catch (error) { handleDiscordError("list_active_threads", error); }
}

async function handleArchivedThreads(
  channelId: string, input: Record<string, any>, config: Record<string, any> | undefined,
  action: string, archivedStatus: "private" | "public",
): Promise<DiscordToolResult> {
  const limit = Math.min(input.limit ?? config?.limit ?? 50, 100);
  const returnAll = input.returnAll ?? config?.returnAll ?? false;
  const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
  const before = input.before ?? config?.before;
  const client = createDiscordClient(config, action);
  const route = Routes.channelThreads(channelId, archivedStatus);
  if (returnAll) {
    const { items, hasMore } = await paginateArchivedThreads(client, route, limit, maxItems, before);
    return { action, data: { channelId, threads: items, hasMore } };
  }
  const params: Record<string, string> = { limit: String(limit) };
  if (before) params.before = before;
  const res: any = await client.get(route, { query: new URLSearchParams(params) });
  return { action, data: { channelId, threads: res.threads ?? [], hasMore: (res.threads?.length ?? 0) >= limit } };
}

export async function handleListPublicArchivedThreads(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_public_archived_threads", "Channel ID");
    return handleArchivedThreads(channelId, input, config, "list_public_archived_threads", "public");
  } catch (error) { handleDiscordError("list_public_archived_threads", error); }
}

export async function handleListPrivateArchivedThreads(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_private_archived_threads", "Channel ID");
    return handleArchivedThreads(channelId, input, config, "list_private_archived_threads", "private");
  } catch (error) { handleDiscordError("list_private_archived_threads", error); }
}

export async function handleListJoinedArchivedThreads(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_joined_archived_threads", "Channel ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 50, 100);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const before = input.before ?? config?.before;
    const client = createDiscordClient(config, "list_joined_archived_threads");
    const route = Routes.channelJoinedArchivedThreads(channelId);
    if (returnAll) {
      const { items, hasMore } = await paginateArchivedThreads(client, route, limit, maxItems, before);
      return { action: "list_joined_archived_threads", data: { channelId, threads: items, hasMore } };
    }
    const params: Record<string, string> = { limit: String(limit) };
    if (before) params.before = before;
    const res: any = await client.get(route, { query: new URLSearchParams(params) });
    return { action: "list_joined_archived_threads", data: { channelId, threads: res.threads ?? [], hasMore: (res.threads?.length ?? 0) >= limit } };
  } catch (error) { handleDiscordError("list_joined_archived_threads", error); }
}
