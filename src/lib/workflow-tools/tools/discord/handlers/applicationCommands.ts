import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetGlobalCommands(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const applicationId = requireField(input.applicationId ?? config?.applicationId, "get_global_commands", "Application ID");
    const client = createDiscordClient(config, "get_global_commands");
    const query: Record<string, string> = {};
    if (input.withLocalizations ?? config?.withLocalizations) query.with_localizations = "true";
    const res: any = await client.get(Routes.applicationCommands(applicationId), { query: new URLSearchParams(query) });
    return { action: "get_global_commands", data: { applicationId, commands: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_global_commands", error); }
}

export async function handleCreateGlobalCommand(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const applicationId = requireField(input.applicationId ?? config?.applicationId, "create_global_command", "Application ID");
    const name = requireField(input.name ?? config?.name, "create_global_command", "Name");
    const commandType = input.commandType ?? config?.commandType ?? 1;
    const client = createDiscordClient(config, "create_global_command");
    const body: Record<string, any> = {
      name,
      type: Number(commandType),
    };
    if (input.description ?? config?.description) body.description = input.description ?? config?.description;
    if (input.options ?? config?.options) body.options = parseJSONField(input.options ?? config?.options, "options", "create_global_command");
    if (input.nameLocalizations ?? config?.nameLocalizations) body.name_localizations = parseJSONField(input.nameLocalizations ?? config?.nameLocalizations, "name_localizations", "create_global_command");
    if (input.descriptionLocalizations ?? config?.descriptionLocalizations) body.description_localizations = parseJSONField(input.descriptionLocalizations ?? config?.descriptionLocalizations, "description_localizations", "create_global_command");
    if (input.defaultMemberPermissions ?? config?.defaultMemberPermissions) body.default_member_permissions = input.defaultMemberPermissions ?? config?.defaultMemberPermissions;
    if (input.dmPermission !== undefined || config?.dmPermission !== undefined) body.dm_permission = input.dmPermission ?? config?.dmPermission;
    const res: any = await client.post(Routes.applicationCommands(applicationId), { body });
    return { action: "create_global_command", data: { applicationId, commandId: res.id as string, command: res } };
  } catch (error) { handleDiscordError("create_global_command", error); }
}

export async function handleGetGuildCommands(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const applicationId = requireField(input.applicationId ?? config?.applicationId, "get_guild_commands", "Application ID");
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_commands", "Guild ID");
    const client = createDiscordClient(config, "get_guild_commands");
    const query: Record<string, string> = {};
    if (input.withLocalizations ?? config?.withLocalizations) query.with_localizations = "true";
    const res: any = await client.get(Routes.applicationGuildCommands(applicationId, guildId), { query: new URLSearchParams(query) });
    return { action: "get_guild_commands", data: { applicationId, guildId, commands: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_guild_commands", error); }
}

export async function handleCreateGuildCommand(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const applicationId = requireField(input.applicationId ?? config?.applicationId, "create_guild_command", "Application ID");
    const guildId = requireField(input.guildId ?? config?.guildId, "create_guild_command", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_guild_command", "Name");
    const commandType = input.commandType ?? config?.commandType ?? 1;
    const client = createDiscordClient(config, "create_guild_command");
    const body: Record<string, any> = {
      name,
      type: Number(commandType),
    };
    if (input.description ?? config?.description) body.description = input.description ?? config?.description;
    if (input.options ?? config?.options) body.options = parseJSONField(input.options ?? config?.options, "options", "create_guild_command");
    if (input.nameLocalizations ?? config?.nameLocalizations) body.name_localizations = parseJSONField(input.nameLocalizations ?? config?.nameLocalizations, "name_localizations", "create_guild_command");
    if (input.descriptionLocalizations ?? config?.descriptionLocalizations) body.description_localizations = parseJSONField(input.descriptionLocalizations ?? config?.descriptionLocalizations, "description_localizations", "create_guild_command");
    if (input.defaultMemberPermissions ?? config?.defaultMemberPermissions) body.default_member_permissions = input.defaultMemberPermissions ?? config?.defaultMemberPermissions;
    if (input.dmPermission !== undefined || config?.dmPermission !== undefined) body.dm_permission = input.dmPermission ?? config?.dmPermission;
    const res: any = await client.post(Routes.applicationGuildCommands(applicationId, guildId), { body });
    return { action: "create_guild_command", data: { applicationId, guildId, commandId: res.id as string, command: res } };
  } catch (error) { handleDiscordError("create_guild_command", error); }
}

export async function handleBulkOverwriteCommands(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const applicationId = requireField(input.applicationId ?? config?.applicationId, "bulk_overwrite_commands", "Application ID");
    const commands = requireField(input.commands ?? config?.commands, "bulk_overwrite_commands", "Commands (JSON array)");
    const client = createDiscordClient(config, "bulk_overwrite_commands");
    const body = parseJSONField(commands, "commands", "bulk_overwrite_commands");
    const guildId = input.guildId ?? config?.guildId;
    const route = guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId);
    const res: any = await client.put(route, { body });
    return { action: "bulk_overwrite_commands", data: { applicationId, commands: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("bulk_overwrite_commands", error); }
}
