import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_member", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "get_member", "User ID");
    const client = createDiscordClient(config, "get_member");
    const res: any = await client.get(Routes.guildMember(guildId, userId));
    return { action: "get_member", data: { guildId, userId, member: res } };
  } catch (error) { handleDiscordError("get_member", error); }
}

export async function handleListMembers(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "list_members", "Guild ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 100, 1000);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "list_members");
    if (returnAll) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.guildMembers(guildId),
        (r) => Array.isArray(r) ? r : [],
        limit, maxItems, input.after ?? config?.after,
      );
      return { action: "list_members", data: { guildId, members: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (input.after ?? config?.after) query.after = input.after ?? config?.after;
    const res: any = await client.get(Routes.guildMembers(guildId), { query: new URLSearchParams(query) });
    return { action: "list_members", data: { guildId, members: Array.isArray(res) ? res : [], hasMore: false } };
  } catch (error) { handleDiscordError("list_members", error); }
}

export async function handleSearchMembers(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "search_members", "Guild ID");
    const query = requireField(input.query ?? config?.query, "search_members", "Query");
    const limit = Math.min(input.limit ?? config?.limit ?? 10, 1000);
    const client = createDiscordClient(config, "search_members");
    const res: any = await client.get(Routes.guildMembersSearch(guildId), { query: new URLSearchParams({ query, limit: String(limit) }) });
    return { action: "search_members", data: { guildId, members: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("search_members", error); }
}

export async function handleModifyMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_member", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "modify_member", "User ID");
    const client = createDiscordClient(config, "modify_member");
    const body: Record<string, any> = {};
    if ("nick" in (input ?? {})) body.nick = input.nick;
    else if (config && "nick" in config) body.nick = config.nick;
    if (input.roles ?? config?.roles) body.roles = (input.roles ?? config?.roles).split(",").map((s: string) => s.trim());
    if (input.mute !== undefined) body.mute = input.mute;
    if (input.deaf !== undefined) body.deaf = input.deaf;
    if (input.channelId ?? config?.channelId) body.channel_id = input.channelId ?? config?.channelId;
    if (input.communicationDisabledUntil ?? config?.communicationDisabledUntil) body.communication_disabled_until = input.communicationDisabledUntil ?? config?.communicationDisabledUntil;
    const res: any = await client.patch(Routes.guildMember(guildId, userId), { body });
    return { action: "modify_member", data: { guildId, userId, member: res ?? {} } };
  } catch (error) { handleDiscordError("modify_member", error); }
}

export async function handleAddMemberRole(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "add_member_role", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "add_member_role", "User ID");
    const roleId = requireField(input.roleId ?? config?.roleId, "add_member_role", "Role ID");
    const client = createDiscordClient(config, "add_member_role");
    await client.put(Routes.guildMemberRole(guildId, userId, roleId));
    return { action: "add_member_role", data: { guildId, userId, roleId } };
  } catch (error) { handleDiscordError("add_member_role", error); }
}

export async function handleRemoveMemberRole(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "remove_member_role", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "remove_member_role", "User ID");
    const roleId = requireField(input.roleId ?? config?.roleId, "remove_member_role", "Role ID");
    const client = createDiscordClient(config, "remove_member_role");
    await client.delete(Routes.guildMemberRole(guildId, userId, roleId));
    return { action: "remove_member_role", data: { guildId, userId, roleId } };
  } catch (error) { handleDiscordError("remove_member_role", error); }
}

export async function handleKickMember(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "kick_member", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "kick_member", "User ID");
    const client = createDiscordClient(config, "kick_member");
    await client.delete(Routes.guildMember(guildId, userId));
    return { action: "kick_member", data: { guildId, userId } };
  } catch (error) { handleDiscordError("kick_member", error); }
}

export async function handleGetBans(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_bans", "Guild ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 100, 1000);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "get_bans");
    if (returnAll) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.guildBans(guildId),
        (r) => Array.isArray(r) ? r : [],
        limit, maxItems, input.after ?? config?.after,
      );
      return { action: "get_bans", data: { guildId, bans: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (input.after ?? config?.after) query.after = input.after ?? config?.after;
    const res: any = await client.get(Routes.guildBans(guildId), { query: new URLSearchParams(query) });
    return { action: "get_bans", data: { guildId, bans: Array.isArray(res) ? res : [], hasMore: false } };
  } catch (error) { handleDiscordError("get_bans", error); }
}

export async function handleGetBan(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_ban", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "get_ban", "User ID");
    const client = createDiscordClient(config, "get_ban");
    const res: any = await client.get(Routes.guildBan(guildId, userId));
    return { action: "get_ban", data: { guildId, userId, ban: res } };
  } catch (error) { handleDiscordError("get_ban", error); }
}

export async function handleCreateBan(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_ban", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "create_ban", "User ID");
    const client = createDiscordClient(config, "create_ban");
    const body: Record<string, any> = {};
    if (input.deleteMessageSeconds ?? config?.deleteMessageSeconds) body.delete_message_seconds = input.deleteMessageSeconds ?? config?.deleteMessageSeconds;
    await client.put(Routes.guildBan(guildId, userId), { body });
    return { action: "create_ban", data: { guildId, userId } };
  } catch (error) { handleDiscordError("create_ban", error); }
}

export async function handleRemoveBan(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "remove_ban", "Guild ID");
    const userId = requireField(input.userId ?? config?.userId, "remove_ban", "User ID");
    const client = createDiscordClient(config, "remove_ban");
    await client.delete(Routes.guildBan(guildId, userId));
    return { action: "remove_ban", data: { guildId, userId } };
  } catch (error) { handleDiscordError("remove_ban", error); }
}
