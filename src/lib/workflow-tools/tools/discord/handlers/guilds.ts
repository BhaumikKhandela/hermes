import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetGuild(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild", "Guild ID");
    const client = createDiscordClient(config, "get_guild");
    const query = input.withCounts ?? config?.withCounts ? "?with_counts=true" : "";
    const res: any = await client.get(`${Routes.guild(guildId)}${query}`);
    return { action: "get_guild", data: { guildId, guild: res } };
  } catch (error) { handleDiscordError("get_guild", error); }
}

export async function handleGetGuildPreview(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_preview", "Guild ID");
    const client = createDiscordClient(config, "get_guild_preview");
    const res: any = await client.get(Routes.guildPreview(guildId));
    return { action: "get_guild_preview", data: { guildId, preview: res } };
  } catch (error) { handleDiscordError("get_guild_preview", error); }
}

export async function handleModifyGuild(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_guild", "Guild ID");
    const client = createDiscordClient(config, "modify_guild");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.description ?? config?.description) body.description = input.description ?? config?.description;
    if (input.topic ?? config?.topic) body.topic = input.topic ?? config?.topic;
    const res: any = await client.patch(Routes.guild(guildId), { body });
    return { action: "modify_guild", data: { guildId, guild: res } };
  } catch (error) { handleDiscordError("modify_guild", error); }
}

export async function handleGetGuildPruneCount(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_prune_count", "Guild ID");
    const client = createDiscordClient(config, "get_guild_prune_count");
    const params: Record<string, string> = {};
    if (input.days ?? config?.days) params.days = String(input.days ?? config?.days);
    if (input.includeRoles ?? config?.includeRoles) params.include_roles = input.includeRoles ?? config?.includeRoles;
    const res: any = await client.get(Routes.guildPrune(guildId), { query: new URLSearchParams(params) });
    return { action: "get_guild_prune_count", data: { guildId, pruned: (res.pruned ?? 0) as number } };
  } catch (error) { handleDiscordError("get_guild_prune_count", error); }
}

export async function handleBeginGuildPrune(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "begin_guild_prune", "Guild ID");
    const client = createDiscordClient(config, "begin_guild_prune");
    const body: Record<string, any> = {};
    if (input.days ?? config?.days) body.days = input.days ?? config?.days;
    if (input.computePruneCount !== undefined || config?.computePruneCount !== undefined) body.compute_prune_count = input.computePruneCount ?? config?.computePruneCount;
    if (input.includeRoles ?? config?.includeRoles) body.include_roles = (input.includeRoles ?? config?.includeRoles).split(",").map((s: string) => s.trim());
    const res: any = await client.post(Routes.guildPrune(guildId), { body });
    return { action: "begin_guild_prune", data: { guildId, pruned: (res.pruned ?? 0) as number } };
  } catch (error) { handleDiscordError("begin_guild_prune", error); }
}

export async function handleGetGuildVoiceRegions(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_voice_regions", "Guild ID");
    const client = createDiscordClient(config, "get_guild_voice_regions");
    const res: any = await client.get(Routes.guildVoiceRegions(guildId));
    return { action: "get_guild_voice_regions", data: { guildId, regions: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_guild_voice_regions", error); }
}

export async function handleGetGuildInvites(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_invites", "Guild ID");
    const client = createDiscordClient(config, "get_guild_invites");
    const res: any = await client.get(Routes.guildInvites(guildId));
    return { action: "get_guild_invites", data: { guildId, invites: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_guild_invites", error); }
}

export async function handleGetGuildWidget(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_widget", "Guild ID");
    const client = createDiscordClient(config, "get_guild_widget");
    const res: any = await client.get(Routes.guildWidgetJSON(guildId));
    return { action: "get_guild_widget", data: { guildId, widget: res } };
  } catch (error) { handleDiscordError("get_guild_widget", error); }
}

export async function handleGetGuildVanityUrl(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_vanity_url", "Guild ID");
    const client = createDiscordClient(config, "get_guild_vanity_url");
    const res: any = await client.get(Routes.guildVanityUrl(guildId));
    return { action: "get_guild_vanity_url", data: { guildId, vanityUrl: (res.code ?? null) as string | null } };
  } catch (error) { handleDiscordError("get_guild_vanity_url", error); }
}

export async function handleGetGuildWelcomeScreen(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_welcome_screen", "Guild ID");
    const client = createDiscordClient(config, "get_guild_welcome_screen");
    const res: any = await client.get(Routes.guildWelcomeScreen(guildId));
    return { action: "get_guild_welcome_screen", data: { guildId, welcomeScreen: res } };
  } catch (error) { handleDiscordError("get_guild_welcome_screen", error); }
}

export async function handleUpdateGuildWelcomeScreen(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "update_guild_welcome_screen", "Guild ID");
    const client = createDiscordClient(config, "update_guild_welcome_screen");
    const body: Record<string, any> = {};
    if (input.enabled !== undefined) body.enabled = input.enabled;
    if (input.description ?? config?.description) body.description = input.description ?? config?.description;
    const welcomeChannels = parseJSONField(input.welcomeChannels ?? config?.welcomeChannels, "welcome_channels", "update_guild_welcome_screen");
    if (welcomeChannels) body.welcome_channels = welcomeChannels;
    const res: any = await client.patch(Routes.guildWelcomeScreen(guildId), { body });
    return { action: "update_guild_welcome_screen", data: { guildId, welcomeScreen: res } };
  } catch (error) { handleDiscordError("update_guild_welcome_screen", error); }
}

export async function handleGetGuildOnboarding(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_guild_onboarding", "Guild ID");
    const client = createDiscordClient(config, "get_guild_onboarding");
    const res: any = await client.get(Routes.guildOnboarding(guildId));
    return { action: "get_guild_onboarding", data: { guildId, onboarding: res } };
  } catch (error) { handleDiscordError("get_guild_onboarding", error); }
}

export async function handleUpdateGuildOnboarding(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "update_guild_onboarding", "Guild ID");
    const client = createDiscordClient(config, "update_guild_onboarding");
    const body: Record<string, any> = {};
    if (input.enabled !== undefined) body.enabled = input.enabled;
    if (input.mode !== undefined) body.mode = input.mode;
    const defaultChannels = parseJSONField(input.defaultChannelIds ?? config?.defaultChannelIds, "default_channel_ids", "update_guild_onboarding");
    if (defaultChannels) body.default_channel_ids = defaultChannels;
    const prompts = parseJSONField(input.prompts ?? config?.prompts, "prompts", "update_guild_onboarding");
    if (prompts) body.prompts = prompts;
    const res: any = await client.put(Routes.guildOnboarding(guildId), { body });
    return { action: "update_guild_onboarding", data: { guildId, onboarding: res } };
  } catch (error) { handleDiscordError("update_guild_onboarding", error); }
}
