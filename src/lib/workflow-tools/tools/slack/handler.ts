import type { SlackToolResult } from "./types";
import { createSlackClient, handleSlackError } from "./client";
import { stripColons, validateBlocks, requireField, requireFieldRaw } from "./utils";
import { paginateAll } from "./pagination";
import { WebClient } from "@slack/web-api";
import type { WebAPICallResult } from "@slack/web-api";

// ────────── MESSAGES (10) ──────────

export async function handleSendMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "send_message", "Channel ID");
    const compositionMode = input.compositionMode ?? config?.compositionMode ?? "text";
    const text = input.text ?? config?.text;
    const blocksRaw = input.blocks ?? config?.blocks;
    const fallbackText = input.fallbackText ?? config?.fallbackText;
    const mrkdwn = input.mrkdwn ?? config?.mrkdwn;
    const linkNames = input.linkNames ?? config?.linkNames;
    const unfurlLinks = input.unfurlLinks ?? config?.unfurlLinks;
    const unfurlMedia = input.unfurlMedia ?? config?.unfurlMedia;
    const threadTs = input.threadTs ?? config?.threadTs;
    const replyBroadcast = input.replyBroadcast ?? config?.replyBroadcast;

    const client = createSlackClient(config);
    let blocks: Record<string, any>[] | undefined;

    if (compositionMode === "blocks") {
      blocks = validateBlocks(blocksRaw || "[]");
    }

    const res = await client.chat.postMessage({
      channel: channelId,
      text: compositionMode === "blocks" ? (fallbackText ?? text ?? "") : (text ?? ""),
      blocks: blocks as any,
      mrkdwn,
      link_names: linkNames,
      unfurl_links: unfurlLinks,
      unfurl_media: unfurlMedia,
      thread_ts: threadTs,
      reply_broadcast: replyBroadcast,
    });

    return { action: "send_message", data: { channelId, messageTs: res.ts as string, message: res as Record<string, any> } };
  } catch (error) {
    handleSlackError("send_message", error);
  }
}

export async function handleUpdateMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "update_message", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "update_message", "Message TS");
    const compositionMode = input.compositionMode ?? config?.compositionMode ?? "text";
    const text = input.text ?? config?.text;
    const blocksRaw = input.blocks ?? config?.blocks;
    const fallbackText = input.fallbackText ?? config?.fallbackText;
    const linkNames = input.linkNames ?? config?.linkNames;

    const client = createSlackClient(config);
    let blocks: Record<string, any>[] | undefined;

    if (compositionMode === "blocks") {
      blocks = validateBlocks(blocksRaw || "[]");
    }

    const res = await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: compositionMode === "blocks" ? (fallbackText ?? text ?? "") : (text ?? ""),
      blocks: blocks as any,
      link_names: linkNames,
    });

    return { action: "update_message", data: { channelId, messageTs, message: res as Record<string, any> } };
  } catch (error) {
    handleSlackError("update_message", error);
  }
}

export async function handleDeleteMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "delete_message", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "delete_message", "Message TS");

    const client = createSlackClient(config);
    await client.chat.delete({ channel: channelId, ts: messageTs });

    return { action: "delete_message", data: { channelId, messageTs } };
  } catch (error) {
    handleSlackError("delete_message", error);
  }
}

export async function handleGetMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_message", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "get_message", "Message TS");

    const client = createSlackClient(config);
    const res = await client.conversations.history({
      channel: channelId,
      latest: messageTs,
      inclusive: true,
      limit: 1,
    });

    const messages = (res.messages ?? []) as Record<string, any>[];
    if (messages.length === 0 || messages[0]?.ts !== messageTs) {
      throw new Error("message_not_found");
    }

    return { action: "get_message", data: { channelId, messageTs, message: messages[0] } };
  } catch (error) {
    handleSlackError("get_message", error);
  }
}

export async function handleListChannelHistory(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_channel_history", "Channel ID");
    const limit = input.limit ?? config?.limit ?? 100;
    const oldest = input.oldest ?? config?.oldest;
    const latest = input.latest ?? config?.latest;
    const inclusive = input.inclusive ?? config?.inclusive;
    const includeAllMetadata = input.includeAllMetadata ?? config?.includeAllMetadata;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;

    const client = createSlackClient(config);
    let messages: Record<string, any>[];

    if (returnAll) {
      messages = await paginateAll<Record<string, any>>(
        client,
        "conversations.history",
        { channel: channelId, oldest, latest, inclusive, include_all_metadata: includeAllMetadata, limit: Math.min(limit, 200) },
        page => (page as any).messages ?? [],
        maxItems,
      );
      return { action: "list_channel_history", data: { channelId, messages, count: messages.length, hasMore: false } };
    }

    const res = await client.conversations.history({
      channel: channelId,
      limit,
      oldest,
      latest,
      inclusive,
      include_all_metadata: includeAllMetadata,
    });
    messages = (res.messages ?? []) as Record<string, any>[];

    return { action: "list_channel_history", data: { channelId, messages, count: messages.length, hasMore: !!res.has_more } };
  } catch (error) {
    handleSlackError("list_channel_history", error);
  }
}

export async function handleGetThreadReplies(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_thread_replies", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "get_thread_replies", "Message TS");
    const limit = input.limit ?? config?.limit ?? 100;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;

    const client = createSlackClient(config);
    let messages: Record<string, any>[];

    if (returnAll) {
      messages = await paginateAll<Record<string, any>>(
        client,
        "conversations.replies",
        { channel: channelId, ts: messageTs, limit: Math.min(limit, 200) },
        page => (page as any).messages ?? [],
        maxItems,
      );
      return { action: "get_thread_replies", data: { channelId, threadTs: messageTs, messages, count: messages.length, hasMore: false } };
    }

    const res = await client.conversations.replies({ channel: channelId, ts: messageTs, limit });
    messages = (res.messages ?? []) as Record<string, any>[];

    return { action: "get_thread_replies", data: { channelId, threadTs: messageTs, messages, count: messages.length, hasMore: !!res.has_more } };
  } catch (error) {
    handleSlackError("get_thread_replies", error);
  }
}

export async function handleGetPermalink(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_permalink", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "get_permalink", "Message TS");

    const client = createSlackClient(config);
    const res = await client.chat.getPermalink({ channel: channelId, message_ts: messageTs });

    return { action: "get_permalink", data: { channelId, messageTs, permalink: res.permalink! } };
  } catch (error) {
    handleSlackError("get_permalink", error);
  }
}

export async function handleScheduleMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "schedule_message", "Channel ID");
    const postAt = requireFieldRaw(input.postAt ?? config?.postAt, "schedule_message", "Post At");
    const compositionMode = input.compositionMode ?? config?.compositionMode ?? "text";
    const text = input.text ?? config?.text;
    const blocksRaw = input.blocks ?? config?.blocks;
    const fallbackText = input.fallbackText ?? config?.fallbackText;
    const threadTs = input.threadTs ?? config?.threadTs;
    const linkNames = input.linkNames ?? config?.linkNames;
    const unfurlLinks = input.unfurlLinks ?? config?.unfurlLinks;
    const unfurlMedia = input.unfurlMedia ?? config?.unfurlMedia;

    const client = createSlackClient(config);
    let blocks: Record<string, any>[] | undefined;

    if (compositionMode === "blocks") {
      blocks = validateBlocks(blocksRaw || "[]");
    }

    const res = await client.chat.scheduleMessage({
      channel: channelId,
      text: compositionMode === "blocks" ? (fallbackText ?? text ?? "") : (text ?? ""),
      blocks: blocks as any,
      post_at: postAt,
      thread_ts: threadTs,
      link_names: linkNames,
      unfurl_links: unfurlLinks,
      unfurl_media: unfurlMedia,
    });

    return {
      action: "schedule_message",
      data: {
        channelId,
        scheduledMessageId: (res as any).scheduled_message_id as string,
        postAt,
        message: res as Record<string, any>,
      },
    };
  } catch (error) {
    handleSlackError("schedule_message", error);
  }
}

export async function handleListScheduledMessages(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = input.channelId ?? config?.channelId;
    const limit = input.limit ?? config?.limit ?? 100;
    const cursor = input.cursor ?? config?.cursor;

    const client = createSlackClient(config);
    const res = await client.chat.scheduledMessages.list({ channel: channelId, limit, cursor });

    const scheduledMessages = (res.scheduled_messages ?? []) as Record<string, any>[];

    return { action: "list_scheduled_messages", data: { scheduledMessages, count: scheduledMessages.length } };
  } catch (error) {
    handleSlackError("list_scheduled_messages", error);
  }
}

export async function handleDeleteScheduledMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "delete_scheduled_message", "Channel ID");
    const scheduledMessageId = requireField(input.scheduledMessageId ?? config?.scheduledMessageId, "delete_scheduled_message", "Scheduled Message ID");

    const client = createSlackClient(config);
    await client.chat.deleteScheduledMessage({ channel: channelId, scheduled_message_id: scheduledMessageId });

    return { action: "delete_scheduled_message", data: { channelId, scheduledMessageId } };
  } catch (error) {
    handleSlackError("delete_scheduled_message", error);
  }
}

// ────────── REACTIONS (3) ──────────

export async function handleAddReaction(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "add_reaction", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "add_reaction", "Message TS");
    const reaction = requireField(input.reaction ?? config?.reaction, "add_reaction", "Reaction");

    const client = createSlackClient(config);
    const name = stripColons(reaction);
    await client.reactions.add({ channel: channelId, name, timestamp: messageTs });

    return { action: "add_reaction", data: { channelId, messageTs, reaction } };
  } catch (error) {
    handleSlackError("add_reaction", error);
  }
}

export async function handleRemoveReaction(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "remove_reaction", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "remove_reaction", "Message TS");
    const reaction = requireField(input.reaction ?? config?.reaction, "remove_reaction", "Reaction");

    const client = createSlackClient(config);
    const name = stripColons(reaction);
    await client.reactions.remove({ channel: channelId, name, timestamp: messageTs });

    return { action: "remove_reaction", data: { channelId, messageTs, reaction } };
  } catch (error) {
    handleSlackError("remove_reaction", error);
  }
}

export async function handleGetReactions(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_reactions", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "get_reactions", "Message TS");
    const full = input.full ?? config?.full ?? false;

    const client = createSlackClient(config);
    const res = await client.reactions.get({ channel: channelId, timestamp: messageTs, full });

    return { action: "get_reactions", data: { channelId, messageTs, message: (res as any).message ?? (res as Record<string, any>) } };
  } catch (error) {
    handleSlackError("get_reactions", error);
  }
}

// ────────── PINS (3) ──────────

export async function handlePinMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "pin_message", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "pin_message", "Message TS");

    const client = createSlackClient(config);
    await client.pins.add({ channel: channelId, timestamp: messageTs });

    return { action: "pin_message", data: { channelId, messageTs } };
  } catch (error) {
    handleSlackError("pin_message", error);
  }
}

export async function handleUnpinMessage(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "unpin_message", "Channel ID");
    const messageTs = requireField(input.messageTs ?? config?.messageTs, "unpin_message", "Message TS");

    const client = createSlackClient(config);
    await client.pins.remove({ channel: channelId, timestamp: messageTs });

    return { action: "unpin_message", data: { channelId, messageTs } };
  } catch (error) {
    handleSlackError("unpin_message", error);
  }
}

export async function handleListPins(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_pins", "Channel ID");

    const client = createSlackClient(config);
    const res = await client.pins.list({ channel: channelId });

    const items = (res.items ?? []) as Record<string, any>[];

    return { action: "list_pins", data: { channelId, pinnedItems: items, count: items.length } };
  } catch (error) {
    handleSlackError("list_pins", error);
  }
}

// ────────── CONVERSATIONS (14) ──────────

export async function handleListConversations(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const types = input.types ?? config?.types ?? "public_channel";
    const excludeArchived = input.excludeArchived ?? config?.excludeArchived ?? true;
    const limit = input.limit ?? config?.limit ?? 200;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;

    const client = createSlackClient(config);
    let conversations: Record<string, any>[];

    if (returnAll) {
      conversations = await paginateAll<Record<string, any>>(
        client,
        "conversations.list",
        { types, exclude_archived: excludeArchived, limit: Math.min(limit, 200) },
        page => (page as any).channels ?? [],
        maxItems,
      );
      return { action: "list_conversations", data: { conversations, count: conversations.length } };
    }

    const res = await client.conversations.list({ types, exclude_archived: excludeArchived, limit });
    conversations = (res.channels ?? []) as Record<string, any>[];

    return { action: "list_conversations", data: { conversations, count: conversations.length } };
  } catch (error) {
    handleSlackError("list_conversations", error);
  }
}

export async function handleGetConversationInfo(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_conversation_info", "Channel ID");
    const includeNumMembers = input.includeNumMembers ?? config?.includeNumMembers ?? false;

    const client = createSlackClient(config);
    const res = await client.conversations.info({ channel: channelId, include_num_members: includeNumMembers });

    return { action: "get_conversation_info", data: { channelId, conversation: res.channel as Record<string, any> } };
  } catch (error) {
    handleSlackError("get_conversation_info", error);
  }
}

export async function handleOpenConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const users = requireField(input.users ?? config?.users, "open_conversation", "Users");
    const returnIm = input.returnIm ?? config?.returnIm ?? false;
    const preventCreation = input.preventCreation ?? config?.preventCreation ?? false;

    const userIds = users.split(",").map((u: string) => u.trim()).filter(Boolean);

    const client = createSlackClient(config);
    const res = await client.conversations.open({ users: userIds.join(","), return_im: returnIm, prevent_creation: preventCreation });

    const channelId = ((res as any).channel?.id ?? res.channel) as string;

    return { action: "open_conversation", data: { channelId, conversation: (res as any).channel ?? res } };
  } catch (error) {
    handleSlackError("open_conversation", error);
  }
}

export async function handleCreateConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const name = requireField(input.name ?? config?.name, "create_conversation", "Name");
    const isPrivate = input.isPrivate ?? config?.isPrivate ?? false;

    const client = createSlackClient(config);
    const res = await client.conversations.create({ name, is_private: isPrivate });

    return { action: "create_conversation", data: { channelId: (res.channel as any).id, conversation: res.channel as Record<string, any> } };
  } catch (error) {
    handleSlackError("create_conversation", error);
  }
}

export async function handleRenameConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "rename_conversation", "Channel ID");
    const name = requireField(input.name ?? config?.name, "rename_conversation", "Name");

    const client = createSlackClient(config);
    await client.conversations.rename({ channel: channelId, name });

    return { action: "rename_conversation", data: { channelId, name } };
  } catch (error) {
    handleSlackError("rename_conversation", error);
  }
}

export async function handleSetTopic(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "set_topic", "Channel ID");
    const topic = requireField(input.topic ?? config?.topic, "set_topic", "Topic");

    const client = createSlackClient(config);
    await client.conversations.setTopic({ channel: channelId, topic });

    return { action: "set_topic", data: { channelId, topic } };
  } catch (error) {
    handleSlackError("set_topic", error);
  }
}

export async function handleSetPurpose(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "set_purpose", "Channel ID");
    const purpose = requireField(input.purpose ?? config?.purpose, "set_purpose", "Purpose");

    const client = createSlackClient(config);
    await client.conversations.setPurpose({ channel: channelId, purpose });

    return { action: "set_purpose", data: { channelId, purpose } };
  } catch (error) {
    handleSlackError("set_purpose", error);
  }
}

export async function handleArchiveConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "archive_conversation", "Channel ID");

    const client = createSlackClient(config);
    await client.conversations.archive({ channel: channelId });

    return { action: "archive_conversation", data: { channelId } };
  } catch (error) {
    handleSlackError("archive_conversation", error);
  }
}

export async function handleUnarchiveConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "unarchive_conversation", "Channel ID");

    const client = createSlackClient(config);
    await client.conversations.unarchive({ channel: channelId });

    return { action: "unarchive_conversation", data: { channelId } };
  } catch (error) {
    handleSlackError("unarchive_conversation", error);
  }
}

export async function handleInviteUsers(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "invite_users", "Channel ID");
    const users = requireField(input.users ?? config?.users, "invite_users", "Users");
    const force = input.force ?? config?.force ?? false;

    const userArray = users.split(",").map((u: string) => u.trim()).filter(Boolean);

    const client = createSlackClient(config);
    await client.conversations.invite({ channel: channelId, users: userArray.join(","), force });

    return { action: "invite_users", data: { channelId, userIds: userArray } };
  } catch (error) {
    handleSlackError("invite_users", error);
  }
}

export async function handleKickUser(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "kick_user", "Channel ID");
    const userId = requireField(input.userId ?? config?.userId, "kick_user", "User ID");

    const client = createSlackClient(config);
    await client.conversations.kick({ channel: channelId, user: userId });

    return { action: "kick_user", data: { channelId, userId } };
  } catch (error) {
    handleSlackError("kick_user", error);
  }
}

export async function handleJoinConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "join_conversation", "Channel ID");

    const client = createSlackClient(config);
    await client.conversations.join({ channel: channelId });

    return { action: "join_conversation", data: { channelId } };
  } catch (error) {
    handleSlackError("join_conversation", error);
  }
}

export async function handleLeaveConversation(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "leave_conversation", "Channel ID");

    const client = createSlackClient(config);
    await client.conversations.leave({ channel: channelId });

    return { action: "leave_conversation", data: { channelId } };
  } catch (error) {
    handleSlackError("leave_conversation", error);
  }
}

export async function handleGetMembers(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_members", "Channel ID");
    const limit = input.limit ?? config?.limit ?? 100;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;

    const client = createSlackClient(config);
    let memberIds: string[];

    if (returnAll) {
      memberIds = await paginateAll<string>(
        client,
        "conversations.members",
        { channel: channelId, limit: Math.min(limit, 200) },
        page => (page as any).members ?? [],
        maxItems,
      );
      return { action: "get_members", data: { channelId, memberIds, count: memberIds.length } };
    }

    const res = await client.conversations.members({ channel: channelId, limit });
    memberIds = (res.members ?? []) as string[];

    return { action: "get_members", data: { channelId, memberIds, count: memberIds.length } };
  } catch (error) {
    handleSlackError("get_members", error);
  }
}

// ────────── USERS (4) ──────────

export async function handleListUsers(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const limit = input.limit ?? config?.limit ?? 200;
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;

    const client = createSlackClient(config);
    let users: Record<string, any>[];

    if (returnAll) {
      users = await paginateAll<Record<string, any>>(
        client,
        "users.list",
        { limit: Math.min(limit, 200) },
        page => (page as any).members ?? [],
        maxItems,
      );
      return { action: "list_users", data: { users, count: users.length } };
    }

    const res = await client.users.list({ limit });
    users = (res.members ?? []) as Record<string, any>[];

    return { action: "list_users", data: { users, count: users.length } };
  } catch (error) {
    handleSlackError("list_users", error);
  }
}

export async function handleGetUserInfo(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const userId = requireField(input.userId ?? config?.userId, "get_user_info", "User ID");

    const client = createSlackClient(config);
    const res = await client.users.info({ user: userId });

    return { action: "get_user_info", data: { userId, user: res.user as Record<string, any> } };
  } catch (error) {
    handleSlackError("get_user_info", error);
  }
}

export async function handleLookupUserByEmail(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const email = requireField(input.email ?? config?.email, "lookup_user_by_email", "Email");

    const client = createSlackClient(config);
    const res = await client.users.lookupByEmail({ email });

    return { action: "lookup_user_by_email", data: { userId: (res.user as any).id, email, user: res.user as Record<string, any> } };
  } catch (error) {
    handleSlackError("lookup_user_by_email", error);
  }
}

export async function handleGetUserPresence(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const userId = requireField(input.userId ?? config?.userId, "get_user_presence", "User ID");

    const client = createSlackClient(config);
    const res = await client.users.getPresence({ user: userId });

    return {
      action: "get_user_presence",
      data: {
        userId,
        presence: res.presence!,
        online: !!(res as any).online,
        autoAway: !!(res as any).auto_away,
      },
    };
  } catch (error) {
    handleSlackError("get_user_presence", error);
  }
}

// ────────── SEARCH (2) ──────────

export async function handleSearchMessages(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const query = requireField(input.query ?? config?.query, "search_messages", "Query");
    const sort = input.sort ?? config?.sort;
    const sortDir = input.sortDir ?? config?.sortDir;
    const count = input.count ?? config?.count ?? 20;
    const highlight = input.highlight ?? config?.highlight;
    const page = input.page ?? config?.page;

    const client = createSlackClient(config);
    const res = await client.search.messages({
      query,
      sort,
      sort_dir: sortDir,
      count,
      highlight,
      page,
    });

    const messages = ((res as any).messages?.matches ?? []) as Record<string, any>[];

    return { action: "search_messages", data: { query, messages, count: messages.length, total: (res as any).messages?.total ?? 0 } };
  } catch (error) {
    handleSlackError("search_messages", error);
  }
}

export async function handleSearchFiles(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const query = requireField(input.query ?? config?.query, "search_files", "Query");
    const sort = input.sort ?? config?.sort;
    const sortDir = input.sortDir ?? config?.sortDir;
    const count = input.count ?? config?.count ?? 20;
    const highlight = input.highlight ?? config?.highlight;
    const page = input.page ?? config?.page;

    const client = createSlackClient(config);
    const res = await client.search.files({
      query,
      sort,
      sort_dir: sortDir,
      count,
      highlight,
      page,
    });

    const files = ((res as any).files?.matches ?? []) as Record<string, any>[];

    return { action: "search_files", data: { query, files, count: files.length, total: (res as any).files?.total ?? 0 } };
  } catch (error) {
    handleSlackError("search_files", error);
  }
}

// ────────── FILES (4) ──────────

export async function handleUploadFile(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "upload_file", "Channel ID");
    const filename = requireField(input.filename ?? config?.filename, "upload_file", "Filename");
    const content = requireField(input.content ?? config?.content, "upload_file", "Content");
    const initialComment = input.initialComment ?? config?.initialComment;
    const altText = input.altText ?? config?.altText;
    const threadTs = input.threadTs ?? config?.threadTs;
    const title = input.title ?? config?.title;

    const client = createSlackClient(config);
    const res = await client.filesUploadV2({
      channel_id: channelId,
      filename,
      content,
      initial_comment: initialComment,
      alt_text: altText,
      thread_ts: threadTs,
      title,
    });

    const files = (res as any).files as Record<string, any>[] | undefined;

    return { action: "upload_file", data: { fileId: files?.[0]?.id ?? "", fileName: filename, fileSize: 0, channelId } };
  } catch (error) {
    handleSlackError("upload_file", error);
  }
}

export async function handleGetFileInfo(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const fileId = requireField(input.fileId ?? config?.fileId, "get_file_info", "File ID");
    const count = input.count ?? config?.count;
    const page = input.page ?? config?.page;

    const client = createSlackClient(config);
    const res = await client.files.info({ file: fileId, count, page });

    return { action: "get_file_info", data: { fileId, file: (res as any).file as Record<string, any> } };
  } catch (error) {
    handleSlackError("get_file_info", error);
  }
}

export async function handleDeleteFile(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const fileId = requireField(input.fileId ?? config?.fileId, "delete_file", "File ID");

    const client = createSlackClient(config);
    await client.files.delete({ file: fileId });

    return { action: "delete_file", data: { fileId } };
  } catch (error) {
    handleSlackError("delete_file", error);
  }
}

export async function handleListFiles(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = input.channelId ?? config?.channelId;
    const types = input.types ?? config?.types ?? "all";
    const userId = input.userId ?? config?.userId;
    const tsFrom = input.tsFrom ?? config?.tsFrom;
    const tsTo = input.tsTo ?? config?.tsTo;
    const count = input.count ?? config?.count ?? 20;
    const page = input.page ?? config?.page;

    const client = createSlackClient(config);
    const res = await client.files.list({
      channel: channelId,
      types,
      user: userId,
      ts_from: tsFrom,
      ts_to: tsTo,
      count,
      page,
    });

    const files = (res.files ?? []) as Record<string, any>[];

    return { action: "list_files", data: { files, count: files.length } };
  } catch (error) {
    handleSlackError("list_files", error);
  }
}

// ────────── BOOKMARKS (3) ──────────

export async function handleAddBookmark(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "add_bookmark", "Channel ID");
    const title = requireField(input.title ?? config?.title, "add_bookmark", "Title");
    const link = requireField(input.link ?? config?.link, "add_bookmark", "Link");
    const emoji = input.emoji ?? config?.emoji;

    const client = createSlackClient(config);
    const res = await client.bookmarks.add({ channel_id: channelId, title, link, emoji, type: "link" });

    return { action: "add_bookmark", data: { channelId, bookmarkId: ((res as any).bookmark?.id ?? "") as string, title, link } };
  } catch (error) {
    handleSlackError("add_bookmark", error);
  }
}

export async function handleRemoveBookmark(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "remove_bookmark", "Channel ID");
    const bookmarkId = requireField(input.bookmarkId ?? config?.bookmarkId, "remove_bookmark", "Bookmark ID");

    const client = createSlackClient(config);
    await client.bookmarks.remove({ channel_id: channelId, bookmark_id: bookmarkId });

    return { action: "remove_bookmark", data: { channelId, bookmarkId } };
  } catch (error) {
    handleSlackError("remove_bookmark", error);
  }
}

export async function handleListBookmarks(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "list_bookmarks", "Channel ID");

    const client = createSlackClient(config);
    const res = await client.bookmarks.list({ channel_id: channelId });

    const bookmarks = (res.bookmarks ?? []) as Record<string, any>[];

    return { action: "list_bookmarks", data: { channelId, bookmarks, count: bookmarks.length } };
  } catch (error) {
    handleSlackError("list_bookmarks", error);
  }
}

// ────────── CANVASES (4) ──────────

export async function handleCreateCanvas(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const title = requireField(input.title ?? config?.title, "create_canvas", "Title");
    const canvasContent = input.canvasContent ?? config?.canvasContent;

    const client = createSlackClient(config);
    const res = await (client as any).canvases.create({
      title,
      document_content: canvasContent ? { type: "markdown", markdown: canvasContent } : undefined,
    });

    return { action: "create_canvas", data: { canvasId: (res.canvas_id ?? "") as string, title } };
  } catch (error) {
    handleSlackError("create_canvas", error);
  }
}

export async function handleEditCanvas(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const canvasId = requireField(input.canvasId ?? config?.canvasId, "edit_canvas", "Canvas ID");
    const canvasContent = requireFieldRaw(input.canvasContent ?? config?.canvasContent, "edit_canvas", "Canvas Content");

    const client = createSlackClient(config);
    await (client as any).canvases.edit({ canvas_id: canvasId, changes: [{ operation: "replace", document_content: { type: "markdown", markdown: canvasContent } }] });

    return { action: "edit_canvas", data: { canvasId } };
  } catch (error) {
    handleSlackError("edit_canvas", error);
  }
}

export async function handleDeleteCanvas(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const canvasId = requireField(input.canvasId ?? config?.canvasId, "delete_canvas", "Canvas ID");

    const client = createSlackClient(config);
    await (client as any).canvases.delete({ canvas_id: canvasId });

    return { action: "delete_canvas", data: { canvasId } };
  } catch (error) {
    handleSlackError("delete_canvas", error);
  }
}

export async function handleSectionsLookup(
  input: Record<string, any>,
  config?: Record<string, any>,
): Promise<SlackToolResult> {
  try {
    const canvasId = requireField(input.canvasId ?? config?.canvasId, "sections_lookup", "Canvas ID");

    const client = createSlackClient(config);
    const res = await (client as any).canvases.sections.lookup({ canvas_id: canvasId, criteria: { section_types: ["any_header"] } });

    const sections = (res.sections ?? []) as Record<string, any>[];

    return { action: "sections_lookup", data: { canvasId, sections } };
  } catch (error) {
    handleSlackError("sections_lookup", error);
  }
}
