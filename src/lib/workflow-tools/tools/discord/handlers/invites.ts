import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetChannelInvites(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_channel_invites", "Channel ID");
    const client = createDiscordClient(config, "get_channel_invites");
    const res: any = await client.get(Routes.channelInvites(channelId));
    return { action: "get_channel_invites", data: { channelId, invites: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("get_channel_invites", error); }
}

export async function handleCreateInvite(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "create_invite", "Channel ID");
    const client = createDiscordClient(config, "create_invite");
    const body: Record<string, any> = {};
    if (input.maxAge ?? config?.maxAge) body.max_age = input.maxAge ?? config?.maxAge;
    if (input.maxUses ?? config?.maxUses) body.max_uses = input.maxUses ?? config?.maxUses;
    if (input.temporary !== undefined || config?.temporary !== undefined) body.temporary = input.temporary ?? config?.temporary;
    if (input.unique !== undefined || config?.unique !== undefined) body.unique = input.unique ?? config?.unique;
    if (input.targetType ?? config?.targetType) body.target_type = input.targetType ?? config?.targetType;
    if (input.targetUserId ?? config?.targetUserId) body.target_user_id = input.targetUserId ?? config?.targetUserId;
    if (input.targetApplicationId ?? config?.targetApplicationId) body.target_application_id = input.targetApplicationId ?? config?.targetApplicationId;
    const res: any = await client.post(Routes.channelInvites(channelId), { body });
    return { action: "create_invite", data: { channelId, inviteCode: res.code as string, invite: res } };
  } catch (error) { handleDiscordError("create_invite", error); }
}

export async function handleDeleteInvite(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const inviteCode = requireField(input.inviteCode ?? config?.inviteCode, "delete_invite", "Invite Code");
    const client = createDiscordClient(config, "delete_invite");
    await client.delete(Routes.invite(inviteCode));
    return { action: "delete_invite", data: { inviteCode } };
  } catch (error) { handleDiscordError("delete_invite", error); }
}
