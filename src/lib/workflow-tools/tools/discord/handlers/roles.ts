import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetRoles(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_roles", "Guild ID");
    const client = createDiscordClient(config, "get_roles");
    const res: any = await client.get(Routes.guildRoles(guildId));
    return { action: "get_roles", data: { guildId, roles: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_roles", error); }
}

export async function handleCreateRole(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_role", "Guild ID");
    const client = createDiscordClient(config, "create_role");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.permissions ?? config?.permissions) body.permissions = input.permissions ?? config?.permissions;
    if (input.color ?? config?.color) body.color = input.color ?? config?.color;
    if (input.hoist !== undefined) body.hoist = input.hoist;
    if (input.icon ?? config?.icon) body.icon = input.icon ?? config?.icon;
    if (input.unicodeEmoji ?? config?.unicodeEmoji) body.unicode_emoji = input.unicodeEmoji ?? config?.unicodeEmoji;
    if (input.mentionable !== undefined) body.mentionable = input.mentionable;
    const res: any = await client.post(Routes.guildRoles(guildId), { body });
    return { action: "create_role", data: { guildId, roleId: res.id as string, role: res } };
  } catch (error) { handleDiscordError("create_role", error); }
}

export async function handleModifyRole(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_role", "Guild ID");
    const roleId = requireField(input.roleId ?? config?.roleId, "modify_role", "Role ID");
    const client = createDiscordClient(config, "modify_role");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.permissions ?? config?.permissions) body.permissions = input.permissions ?? config?.permissions;
    if (input.color ?? config?.color) body.color = input.color ?? config?.color;
    if (input.hoist !== undefined) body.hoist = input.hoist;
    if (input.mentionable !== undefined) body.mentionable = input.mentionable;
    if (input.icon ?? config?.icon) body.icon = input.icon ?? config?.icon;
    if (input.unicodeEmoji ?? config?.unicodeEmoji) body.unicode_emoji = input.unicodeEmoji ?? config?.unicodeEmoji;
    const res: any = await client.patch(Routes.guildRole(guildId, roleId), { body });
    return { action: "modify_role", data: { guildId, roleId, role: res } };
  } catch (error) { handleDiscordError("modify_role", error); }
}

export async function handleModifyRolePositions(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_role_positions", "Guild ID");
    const client = createDiscordClient(config, "modify_role_positions");
    const body = parseJSONField(input.rolePositions ?? config?.rolePositions, "role_positions", "modify_role_positions");
    if (!body || !Array.isArray(body)) throw new Error("Discord modify_role_positions: rolePositions must be a JSON array of {id, position}.");
    const res: any = await client.patch(Routes.guildRoles(guildId), { body });
    return { action: "modify_role_positions", data: { guildId, roles: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("modify_role_positions", error); }
}

export async function handleDeleteRole(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "delete_role", "Guild ID");
    const roleId = requireField(input.roleId ?? config?.roleId, "delete_role", "Role ID");
    const client = createDiscordClient(config, "delete_role");
    await client.delete(Routes.guildRole(guildId, roleId));
    return { action: "delete_role", data: { guildId, roleId } };
  } catch (error) { handleDiscordError("delete_role", error); }
}
