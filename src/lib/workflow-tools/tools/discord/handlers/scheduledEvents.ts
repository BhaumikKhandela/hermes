import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleListScheduledEvents(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "list_scheduled_events", "Guild ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 100, 100);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 1000;
    const client = createDiscordClient(config, "list_scheduled_events");
    if (returnAll) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.guildScheduledEvents(guildId),
        (r) => Array.isArray(r) ? r : [],
        limit, maxItems, input.before ?? config?.before,
      );
      return { action: "list_scheduled_events", data: { guildId, events: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (input.before ?? config?.before) query.before = input.before ?? config?.before;
    if (input.after ?? config?.after) query.after = input.after ?? config?.after;
    const res: any = await client.get(Routes.guildScheduledEvents(guildId), { query: new URLSearchParams(query) });
    return { action: "list_scheduled_events", data: { guildId, events: Array.isArray(res) ? res : [], hasMore: false } };
  } catch (error) { handleDiscordError("list_scheduled_events", error); }
}

export async function handleCreateScheduledEvent(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_scheduled_event", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_scheduled_event", "Name");
    const scheduledStartTime = requireField(input.scheduledStartTime ?? config?.scheduledStartTime, "create_scheduled_event", "Scheduled Start Time");
    const entityType = requireField(input.entityType ?? config?.entityType, "create_scheduled_event", "Entity Type");
    const client = createDiscordClient(config, "create_scheduled_event");
    const body: Record<string, any> = {
      name,
      scheduled_start_time: scheduledStartTime,
      entity_type: Number(entityType),
    };
    if (input.description ?? config?.description) body.description = input.description ?? config?.description;
    if (input.channelId ?? config?.channelId) body.channel_id = input.channelId ?? config?.channelId;
    if (input.entityMetadata ?? config?.entityMetadata) body.entity_metadata = parseJSONField(input.entityMetadata ?? config?.entityMetadata, "entity_metadata", "create_scheduled_event");
    if (input.scheduledEndTime ?? config?.scheduledEndTime) body.scheduled_end_time = input.scheduledEndTime ?? config?.scheduledEndTime;
    if (input.privacyLevel ?? config?.privacyLevel) body.privacy_level = input.privacyLevel ?? config?.privacyLevel;
    const image = parseJSONField(input.image ?? config?.image, "image", "create_scheduled_event");
    if (image) body.image = image;
    const res: any = await client.post(Routes.guildScheduledEvents(guildId), { body });
    return { action: "create_scheduled_event", data: { guildId, eventId: res.id as string, event: res } };
  } catch (error) { handleDiscordError("create_scheduled_event", error); }
}

export async function handleGetScheduledEvent(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_scheduled_event", "Guild ID");
    const eventId = requireField(input.eventId ?? config?.eventId, "get_scheduled_event", "Event ID");
    const query = input.withUserCount ?? config?.withUserCount ? "?with_user_count=true" : "";
    const client = createDiscordClient(config, "get_scheduled_event");
    const res: any = await client.get(`${Routes.guildScheduledEvent(guildId, eventId)}${query}`);
    return { action: "get_scheduled_event", data: { guildId, eventId, event: res } };
  } catch (error) { handleDiscordError("get_scheduled_event", error); }
}

export async function handleModifyScheduledEvent(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_scheduled_event", "Guild ID");
    const eventId = requireField(input.eventId ?? config?.eventId, "modify_scheduled_event", "Event ID");
    const client = createDiscordClient(config, "modify_scheduled_event");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.description !== undefined) body.description = input.description ?? config?.description;
    if (input.channelId !== undefined) body.channel_id = input.channelId ?? config?.channelId ?? null;
    if (input.entityMetadata !== undefined) {
      const meta = input.entityMetadata ?? config?.entityMetadata;
      body.entity_metadata = meta ? parseJSONField(meta, "entity_metadata", "modify_scheduled_event") : null;
    }
    if (input.privacyLevel ?? config?.privacyLevel) body.privacy_level = input.privacyLevel ?? config?.privacyLevel;
    if (input.scheduledStartTime ?? config?.scheduledStartTime) body.scheduled_start_time = input.scheduledStartTime ?? config?.scheduledStartTime;
    if (input.scheduledEndTime ?? config?.scheduledEndTime) body.scheduled_end_time = input.scheduledEndTime ?? config?.scheduledEndTime;
    if (input.status ?? config?.status) body.status = Number(input.status ?? config?.status);
    const image = parseJSONField(input.image ?? config?.image, "image", "modify_scheduled_event");
    if (image) body.image = image;
    const res: any = await client.patch(Routes.guildScheduledEvent(guildId, eventId), { body });
    return { action: "modify_scheduled_event", data: { guildId, eventId, event: res } };
  } catch (error) { handleDiscordError("modify_scheduled_event", error); }
}

export async function handleDeleteScheduledEvent(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "delete_scheduled_event", "Guild ID");
    const eventId = requireField(input.eventId ?? config?.eventId, "delete_scheduled_event", "Event ID");
    const client = createDiscordClient(config, "delete_scheduled_event");
    await client.delete(Routes.guildScheduledEvent(guildId, eventId));
    return { action: "delete_scheduled_event", data: { guildId, eventId } };
  } catch (error) { handleDiscordError("delete_scheduled_event", error); }
}

export async function handleGetScheduledEventUsers(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_scheduled_event_users", "Guild ID");
    const eventId = requireField(input.eventId ?? config?.eventId, "get_scheduled_event_users", "Event ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 100, 100);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "get_scheduled_event_users");
    if (returnAll) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.guildScheduledEventUsers(guildId, eventId),
        (r) => Array.isArray(r) ? r : [],
        limit, maxItems, input.after ?? config?.after,
      );
      return { action: "get_scheduled_event_users", data: { guildId, eventId, users: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (input.after ?? config?.after) query.after = input.after ?? config?.after;
    if (input.before ?? config?.before) query.before = input.before ?? config?.before;
    const res: any = await client.get(Routes.guildScheduledEventUsers(guildId, eventId), { query: new URLSearchParams(query) });
    return { action: "get_scheduled_event_users", data: { guildId, eventId, users: Array.isArray(res) ? res : [], hasMore: false } };
  } catch (error) { handleDiscordError("get_scheduled_event_users", error); }
}
